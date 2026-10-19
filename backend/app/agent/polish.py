"""LLM rephrasing of grounded replies, guarded by verification (defence in depth)."""

import re
from collections.abc import Callable
from typing import Any

from app.llm.client import LLMError, chat_completion

PRICE_PATTERN = re.compile(r"₹\s?(\d+)")

RESPONSE_SYSTEM_PROMPT = (
    "You are Veera, a warm waiter at Veeradhar Dhaba. Rewrite the drafted reply in a "
    "friendly, concise tone. Use ONLY the items and prices listed; never invent dishes, "
    "prices, or offers and keep every price exactly as given. Reply with the rewritten text only."
)

Complete = Callable[..., str]


def _grounded_prices(context: list[dict[str, Any]]) -> set[str]:
    prices: set[str] = set()
    for item in context:
        price = item.get("price")
        if price is not None:
            prices.add(str(price))
    return prices


def verify_grounded(text: str, context: list[dict[str, Any]]) -> bool:
    """A reply is grounded if it introduces no price absent from the retrieved context."""
    allowed = _grounded_prices(context)
    return all(price in allowed for price in PRICE_PATTERN.findall(text))


def _render_context(context: list[dict[str, Any]]) -> str:
    lines: list[str] = []
    for item in context:
        diet = "veg" if item.get("is_veg") else "non-veg"
        price = item.get("price")
        suffix = f"₹{price}" if price is not None else "price on request"
        lines.append(f"- {item.get('name')} ({diet}): {suffix}")
    return "\n".join(lines)


def polish_reply(
    draft: str,
    context: list[dict[str, Any]],
    *,
    complete: Complete = chat_completion,
) -> str:
    """Rephrase a grounded draft, falling back to the draft on any ungrounded output."""
    if not draft or not context:
        return draft

    prompt = f"DRAFT:\n{draft}\n\nALLOWED ITEMS:\n{_render_context(context)}\n\nRewrite the draft."
    try:
        polished = complete(
            prompt,
            system_prompt=RESPONSE_SYSTEM_PROMPT,
            temperature=0.4,
            max_tokens=200,
        ).strip()
    except LLMError:
        return draft

    if not polished or not verify_grounded(polished, context):
        return draft
    return polished
