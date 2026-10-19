"""Offer catalog and happy-hour helpers."""

from datetime import datetime

from app.agent.tools.context import ToolContext
from app.agent.tools.schemas import ApplyOfferArgs, EmptyArgs, ToolResult
from app.core.config import get_settings
from app.services.menu import MenuService

OFFERS: tuple[dict, ...] = (
    {"code": "WELCOME10", "description": "10% off your order", "discount_rate": 0.10, "min_subtotal": 0},
    {"code": "FEAST20", "description": "20% off orders over ₹500", "discount_rate": 0.20, "min_subtotal": 500},
)


def get_offer(code: str | None) -> dict | None:
    normalized = (code or "").strip().upper()
    return next((offer for offer in OFFERS if offer["code"] == normalized), None)


def discount_for(code: str | None, subtotal: int) -> float:
    offer = get_offer(code)
    if offer is None or subtotal < offer["min_subtotal"]:
        return 0.0
    return float(offer["discount_rate"])


def _happy_hour(ctx: ToolContext | None) -> dict:
    settings = get_settings()
    active = settings.happy_hour_start <= datetime.now().hour < settings.happy_hour_end
    affected: list[str] = []
    if ctx is not None:
        affected = [
            item.id for item in MenuService(ctx.db).list_items() if item.happy_hour_price is not None
        ]
    return {
        "active": active,
        "start_hour": settings.happy_hour_start,
        "end_hour": settings.happy_hour_end,
        "affected_item_ids": affected,
    }


def list_offers(ctx: ToolContext, args: EmptyArgs) -> ToolResult:
    return ToolResult(ok=True, data={"offers": [dict(offer) for offer in OFFERS], "happy_hour": _happy_hour(ctx)})


def apply_offer(ctx: ToolContext, args: ApplyOfferArgs) -> ToolResult:
    offer = get_offer(args.code)
    if offer is None:
        return ToolResult(ok=False, error=f"Unknown offer code: {args.code}")
    ctx.offer_code = offer["code"]
    subtotal = ctx.cart.subtotal()
    return ToolResult(
        ok=True,
        data={
            "offer": dict(offer),
            "applicable": subtotal >= offer["min_subtotal"],
            "subtotal": subtotal,
        },
    )


def get_happy_hour_status(ctx: ToolContext, args: EmptyArgs) -> ToolResult:
    return ToolResult(ok=True, data=_happy_hour(ctx))
