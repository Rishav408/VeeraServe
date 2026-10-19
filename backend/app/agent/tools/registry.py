"""Tool registry: strict validation in, structured results out."""

from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from pydantic import BaseModel, ValidationError

from app.agent.tools import cart, catalog, offers, ordering
from app.agent.tools.context import ToolContext
from app.agent.tools.schemas import (
    AddToCartArgs,
    ApplyOfferArgs,
    BookTableArgs,
    EmptyArgs,
    GetItemArgs,
    GetOrderStatusArgs,
    GetRecommendationsArgs,
    PlaceOrderArgs,
    SearchMenuArgs,
    ToolResult,
    UpdateCartArgs,
)


@dataclass(frozen=True)
class ToolSpec:
    name: str
    description: str
    args_model: type[BaseModel]
    handler: Callable[..., ToolResult]


TOOLS: dict[str, ToolSpec] = {
    spec.name: spec
    for spec in (
        ToolSpec(
            "search_menu",
            "Search the menu by free text and optional filters. Returns real menu items only.",
            SearchMenuArgs,
            catalog.search_menu,
        ),
        ToolSpec("get_item", "Fetch one menu item by its id.", GetItemArgs, catalog.get_item),
        ToolSpec(
            "get_recommendations",
            "Suggest dishes from the menu for a dietary preference, spice level, or budget.",
            GetRecommendationsArgs,
            catalog.get_recommendations,
        ),
        ToolSpec(
            "add_to_cart",
            "Add a real menu item to the cart (item must exist and be available).",
            AddToCartArgs,
            cart.add_to_cart,
        ),
        ToolSpec(
            "update_cart",
            "Set the quantity of a cart line (0 removes it).",
            UpdateCartArgs,
            cart.update_cart,
        ),
        ToolSpec("view_cart", "Show the current cart and its totals.", EmptyArgs, cart.view_cart),
        ToolSpec(
            "apply_offer",
            "Apply a valid offer code to the cart.",
            ApplyOfferArgs,
            offers.apply_offer,
        ),
        ToolSpec("list_offers", "List active offers and happy-hour info.", EmptyArgs, offers.list_offers),
        ToolSpec(
            "get_happy_hour_status",
            "Report whether happy hour is active and which items it affects.",
            EmptyArgs,
            offers.get_happy_hour_status,
        ),
        ToolSpec(
            "place_order",
            "Place the current cart as an order. Requires explicit user confirmation.",
            PlaceOrderArgs,
            ordering.place_order,
        ),
        ToolSpec(
            "get_order_status",
            "Get the status of the user's order (most recent if no id is given).",
            GetOrderStatusArgs,
            ordering.get_order_status,
        ),
        ToolSpec(
            "book_table",
            "Book a table reservation for a party size and time.",
            BookTableArgs,
            ordering.book_table,
        ),
    )
}


def list_tools() -> list[ToolSpec]:
    return list(TOOLS.values())


def get_tool(name: str) -> ToolSpec | None:
    return TOOLS.get(name)


def call_tool(name: str, ctx: ToolContext, raw_args: dict[str, Any] | None = None) -> ToolResult:
    spec = get_tool(name)
    if spec is None:
        return ToolResult(ok=False, error=f"Unknown tool: {name}")

    try:
        args = spec.args_model.model_validate(raw_args or {})
    except ValidationError as exc:
        return ToolResult(ok=False, error=f"Invalid arguments: {exc.errors()}")

    return spec.handler(ctx, args)


def openai_tool_schemas() -> list[dict[str, Any]]:
    return [
        {
            "type": "function",
            "function": {
                "name": spec.name,
                "description": spec.description,
                "parameters": spec.args_model.model_json_schema(),
            },
        }
        for spec in TOOLS.values()
    ]
