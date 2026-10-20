"""Agent graph nodes: routing, guardrails, and specialist handlers."""

from typing import Any

from langchain_core.runnables import RunnableConfig
from sqlalchemy.orm import Session

from app.agent import intents, memory
from app.agent.state import AgentState
from app.agent.tools.context import Cart, ToolContext
from app.agent.tools.registry import call_tool
from app.core.config import get_settings
from app.models import MenuItem
from app.rag.retriever import retrieve_menu_items
from app.services.menu import MenuService

INTENT_NODES = {
    "greeting": "greeter",
    "menu": "menu",
    "recommend": "recommend",
    "order": "ordering",
    "order_confirm": "ordering",
    "order_cancel": "ordering",
    "status": "status",
    "vision": "vision",
    "preference": "preference",
    "preference_confirm": "preference",
}

QUERY_FILLERS = (
    "how much is",
    "how much for",
    "how much does",
    "the price of",
    "price of",
    "do you have",
    "is there",
    "tell me about",
    "show me",
    "what is",
    "what's",
    "whats",
    "menu",
)


def _db(config: RunnableConfig) -> Session:
    return config["configurable"]["db"]


def _context(state: AgentState, db: Session) -> ToolContext:
    cart = Cart()
    for line in state.get("cart") or []:
        cart.add(line["item_id"], line["name"], line["unit_price"], line["quantity"])
    return ToolContext(
        db=db,
        cart=cart,
        user_id=state.get("user_id"),
        session_id=state.get("session_id"),
        offer_code=state.get("offer_code"),
    )


def _save_cart(state: AgentState, ctx: ToolContext) -> None:
    state["cart"] = ctx.cart.as_list()


def _record_call(state: AgentState, tool: str, args: dict[str, Any]) -> None:
    calls = list(state.get("tool_calls") or [])
    calls.append({"tool": tool, "args": args})
    state["tool_calls"] = calls


def _price_text(price: int | None) -> str:
    return f"₹{price}" if price is not None else "price on request"


def _describe_item(item: dict[str, Any]) -> str:
    diet = "veg" if item["is_veg"] else "non-veg"
    return f"{item['name']} ({diet}) — {_price_text(item.get('price'))}"


def _clean_query(message: str) -> str:
    query = message.lower()
    for filler in QUERY_FILLERS:
        query = query.replace(filler, " ")
    for char in "?₹":
        query = query.replace(char, " ")
    return query.strip() or message


def load_memory(state: AgentState, config: RunnableConfig) -> AgentState:
    state["memory"] = memory.load_preferences(_db(config), state.get("user_id"))
    state.setdefault("history", [])
    state["tool_calls"] = []
    return state


def supervisor(state: AgentState, config: RunnableConfig) -> AgentState:
    state["intent"] = intents.classify(
        state.get("user_message", ""),
        has_image=bool(state.get("image_query")),
        pending_order=bool(state.get("pending_confirmation")),
        pending_preference=bool(state.get("pending_preference")),
    )
    return state


def guardrails(state: AgentState, config: RunnableConfig) -> AgentState:
    settings = get_settings()
    intent = state.get("intent", "menu")
    message = state.get("user_message", "").lower()
    state["blocked"] = False

    if intent == "injection":
        state["blocked"] = True
        state["reply"] = "I can only help with the Veeradhar Dhaba menu and your orders."
    elif intent == "off_topic":
        state["blocked"] = True
        state["reply"] = (
            "I'm Veera, your waiter — I can help with the menu, a recommendation, "
            "your order, or a table booking."
        )
    elif not settings.alcohol_enabled and intents.contains_any(message, intents.ALCOHOL_KEYWORDS):
        state["blocked"] = True
        state["reply"] = "Sorry, we're not serving alcohol at the moment."
    return state


def route_after_guardrails(state: AgentState) -> str:
    if state.get("blocked"):
        return "record"
    return INTENT_NODES.get(state.get("intent", "menu"), "menu")


def greeter_node(state: AgentState, config: RunnableConfig) -> AgentState:
    reply = "Namaste! Welcome to Veeradhar Dhaba — I'm Veera, your waiter."
    prefs = state.get("memory") or {}
    if prefs.get("veg") is True:
        reply += " I remember you prefer veg dishes."
    reply += " Ask about the menu, get a recommendation, or say 'order ...' to place one."
    state["reply"] = reply
    return state


def menu_node(state: AgentState, config: RunnableConfig) -> AgentState:
    db = _db(config)
    ctx = _context(state, db)
    query = _clean_query(state.get("user_message", ""))
    result = call_tool("search_menu", ctx, {"query": query})
    _record_call(state, "search_menu", {"query": query})

    items = (result.data or {}).get("items", [])
    state["tool_results"] = [{"tool": "search_menu", **result.model_dump()}]
    state["retrieved"] = items[:5]
    if not items:
        state["reply"] = (
            f"Sorry, we don't have anything matching '{query}'. "
            "Want me to suggest something from the menu?"
        )
        return state

    listing = "; ".join(_describe_item(item) for item in items[:5])
    state["reply"] = f"Here's what I found: {listing}."
    return state


def recommend_node(state: AgentState, config: RunnableConfig) -> AgentState:
    db = _db(config)
    ctx = _context(state, db)
    message = state.get("user_message", "").lower()

    if "non-veg" in message or "non veg" in message or "chicken" in message:
        dietary: str | None = "non-veg"
    elif "veg" in message:
        dietary = "veg"
    else:
        dietary = None

    spice_pref = 3 if ("spicy" in message or "hot" in message) else (1 if "mild" in message else None)
    args = {"dietary": dietary, "spice_pref": spice_pref}
    result = call_tool("get_recommendations", ctx, args)
    _record_call(state, "get_recommendations", args)
    recs = (result.data or {}).get("recommendations", [])
    state["tool_results"] = [{"tool": "get_recommendations", **result.model_dump()}]
    state["retrieved"] = recs
    if not recs:
        state["reply"] = "I couldn't find a match — tell me your taste and I'll try again."
        return state

    listing = "; ".join(_describe_item(item) for item in recs)
    state["reply"] = f"Try these: {listing}."
    return state


def _match_menu_items(db: Session, message: str) -> list[MenuItem]:
    lowered = message.lower()
    items = MenuService(db).list_items()
    matches = [item for item in items if item.name.lower() in lowered]
    matches.sort(key=lambda item: len(item.name), reverse=True)
    return matches


def ordering_node(state: AgentState, config: RunnableConfig) -> AgentState:
    db = _db(config)
    ctx = _context(state, db)
    message = state.get("user_message", "")
    pending = state.get("pending_confirmation")

    if pending and intents.is_affirmative(message):
        ctx.confirmed = True
        order_args = pending.get("order_args", {})
        result = call_tool("place_order", ctx, order_args)
        _record_call(state, "place_order", order_args)
        state["tool_results"] = [{"tool": "place_order", **result.model_dump()}]
        if result.ok:
            order = (result.data or {}).get("order", {})
            state["reply"] = (
                f"Done! Order #{order.get('id')} is placed for {_price_text(order.get('total'))}. "
                "I'll keep you posted on its status."
            )
            state["pending_confirmation"] = None
            state["offer_code"] = None
        else:
            state["reply"] = f"Sorry, I couldn't place the order: {result.error}."
        _save_cart(state, ctx)
        return state

    if pending and intents.is_negative(message):
        state["pending_confirmation"] = None
        state["reply"] = "No problem — your cart is unchanged. Anything else?"
        _save_cart(state, ctx)
        return state

    matches = _match_menu_items(db, message)
    if not matches:
        state["reply"] = "Which dish would you like? Tell me the name, e.g. 'add 2 Masala Chai'."
        return state

    quantity = intents.extract_quantity(message)
    for item in matches:
        call_tool("add_to_cart", ctx, {"item_id": item.id, "quantity": quantity})
        _record_call(state, "add_to_cart", {"item_id": item.id, "quantity": quantity})
    _save_cart(state, ctx)

    summary_result = call_tool("place_order", ctx, {"payment_method": "cash"})
    _record_call(state, "place_order", {"payment_method": "cash"})
    state["tool_results"] = [{"tool": "add_to_cart", **summary_result.model_dump()}]
    summary = (summary_result.data or {}).get("summary", {})
    state["pending_confirmation"] = {
        "summary": summary,
        "order_args": {"payment_method": "cash"},
    }
    lines = ", ".join(
        f"{line['quantity']}× {line['name']}" for line in summary.get("items", [])
    )
    state["reply"] = (
        f"I've added {lines} ({_price_text(summary.get('total'))} including GST) to your cart. "
        "Reply 'yes' to confirm and I'll place the order."
    )
    return state


def status_node(state: AgentState, config: RunnableConfig) -> AgentState:
    db = _db(config)
    ctx = _context(state, db)
    result = call_tool("get_order_status", ctx, {})
    _record_call(state, "get_order_status", {})
    state["tool_results"] = [{"tool": "get_order_status", **result.model_dump()}]
    if result.ok:
        data = result.data or {}
        state["reply"] = f"Your order #{data.get('order_id')} is currently '{data.get('status')}'."
    else:
        state["reply"] = (
            "I couldn't find an order for you. Give me the order number and I'll check."
        )
    return state


def _image_candidates(db: Session, description: str) -> list[dict[str, Any]]:
    try:
        retrieved = retrieve_menu_items(description, db=db)
    except Exception:
        return []

    service = MenuService(db)
    candidates: list[dict[str, Any]] = []
    for match in retrieved:
        item = service.get_item(match.id)
        if item is None or not item.is_available:
            continue
        candidates.append(
            {
                "item_id": item.id,
                "name": item.name,
                "price": item.price,
                "is_veg": item.is_veg,
            }
        )
    return candidates


def vision_node(state: AgentState, config: RunnableConfig) -> AgentState:
    db = _db(config)
    ctx = _context(state, db)
    description = state.get("image_query") or "dish photo"

    candidates = _image_candidates(db, description)
    if candidates:
        tool_record: dict[str, Any] = {"tool": "get_recommendations", "ok": True, "data": None}
        _record_call(state, "get_recommendations", {"query": description})
    else:
        result = call_tool("search_menu", ctx, {"query": description})
        candidates = (result.data or {}).get("items", [])
        tool_record = {"tool": "search_menu", **result.model_dump()}
        _record_call(state, "search_menu", {"query": description})

    state["tool_results"] = [tool_record]
    state["retrieved"] = candidates[:3]
    if not candidates:
        state["reply"] = (
            "I couldn't match that photo to a dish on our menu, but tell me the flavours "
            "you like and I'll suggest something."
        )
        return state

    best = candidates[0]
    others = ", ".join(item["name"] for item in candidates[1:3])
    state["reply"] = (
        f"I think this looks closest to {_describe_item(best)} — want to try it?"
        + (f" Other close matches: {others}." if others else "")
    )
    return state


def preference_node(state: AgentState, config: RunnableConfig) -> AgentState:
    db = _db(config)
    user_id = state.get("user_id")

    if state.get("intent") == "preference_confirm" and state.get("pending_preference"):
        pending = state.get("pending_preference") or {}
        saved = memory.save_preferences(db, user_id, pending.get("prefs", {}))
        state["memory"] = saved
        state["pending_preference"] = None
        state["reply"] = (
            f"Noted — I've saved {memory.describe_preferences(saved)} to your profile."
        )
        return state

    preferences = memory.extract_preferences(state.get("user_message", ""), state.get("memory"))
    if user_id is None:
        state["reply"] = "I can remember that once you sign in — want me to note it for this visit?"
        return state

    state["pending_preference"] = {"prefs": preferences}
    state["reply"] = (
        f"Noted — {memory.describe_preferences(preferences)}. "
        "Save this to your profile? Reply 'yes' to confirm."
    )
    return state


def record_node(state: AgentState, config: RunnableConfig) -> AgentState:
    history = list(state.get("history") or [])
    history.append({"role": "user", "content": state.get("user_message", "")})
    if state.get("reply"):
        history.append({"role": "assistant", "content": state["reply"]})
    state["history"] = history[-20:]
    return state
