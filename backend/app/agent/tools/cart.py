"""Cart tools — these actually mutate the session cart."""

from app.agent.tools.context import ToolContext
from app.agent.tools.offers import discount_for
from app.agent.tools.schemas import AddToCartArgs, EmptyArgs, ToolResult, UpdateCartArgs
from app.core.config import get_settings
from app.services.menu import MenuService


def _cart_payload(ctx: ToolContext) -> dict:
    subtotal = ctx.cart.subtotal()
    gst = round(subtotal * get_settings().gst_rate)
    discount = round(subtotal * discount_for(ctx.offer_code, subtotal))
    return {
        "items": ctx.cart.as_list(),
        "subtotal": subtotal,
        "gst": gst,
        "discount": discount,
        "total": subtotal + gst - discount,
        "offer_code": ctx.offer_code,
    }


def add_to_cart(ctx: ToolContext, args: AddToCartArgs) -> ToolResult:
    item = MenuService(ctx.db).get_item(args.item_id)
    if item is None:
        return ToolResult(ok=False, error=f"Unknown menu item: {args.item_id}")
    if not item.is_available or item.price is None:
        return ToolResult(ok=False, error=f"Item unavailable: {item.name}")
    ctx.cart.add(item.id, item.name, item.price, args.quantity)
    return ToolResult(ok=True, data=_cart_payload(ctx))


def update_cart(ctx: ToolContext, args: UpdateCartArgs) -> ToolResult:
    if not ctx.cart.contains(args.item_id):
        return ToolResult(ok=False, error=f"Item not in cart: {args.item_id}")
    ctx.cart.set_quantity(args.item_id, args.quantity)
    return ToolResult(ok=True, data=_cart_payload(ctx))


def view_cart(ctx: ToolContext, args: EmptyArgs) -> ToolResult:
    return ToolResult(ok=True, data=_cart_payload(ctx))
