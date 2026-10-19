"""Read-only catalog tools (grounded in the database)."""

from app.agent.tools.context import ToolContext
from app.agent.tools.schemas import (
    GetItemArgs,
    GetRecommendationsArgs,
    SearchMenuArgs,
    ToolResult,
)
from app.models import MenuItem
from app.services.menu import MenuService

NON_VEG_ALIASES = {"non-veg", "nonveg", "non veg"}


def _serialize(items: list[MenuItem]) -> list[dict]:
    return [
        {
            "item_id": item.id,
            "name": item.name,
            "category": item.category_id,
            "price": item.price,
            "is_veg": item.is_veg,
            "spice_level": item.spice_level,
            "tags": list(item.tags or []),
            "is_available": item.is_available,
        }
        for item in items
    ]


def search_menu(ctx: ToolContext, args: SearchMenuArgs) -> ToolResult:
    items = MenuService(ctx.db).list_items(
        category=args.category,
        veg=args.is_veg,
        max_price=args.max_price,
        search=args.query,
    )
    if args.max_spice is not None:
        items = [item for item in items if item.spice_level <= args.max_spice]
    items = [item for item in items if item.is_available]
    return ToolResult(ok=True, data={"count": len(items), "items": _serialize(items)})


def get_item(ctx: ToolContext, args: GetItemArgs) -> ToolResult:
    item = MenuService(ctx.db).get_item(args.item_id)
    if item is None:
        return ToolResult(ok=False, error=f"Unknown menu item: {args.item_id}")
    return ToolResult(ok=True, data={"item": _serialize([item])[0]})


def get_recommendations(ctx: ToolContext, args: GetRecommendationsArgs) -> ToolResult:
    diet = (args.dietary or "").strip().lower()
    if diet == "veg":
        is_veg: bool | None = True
    elif diet in NON_VEG_ALIASES:
        is_veg = False
    else:
        is_veg = None

    items = MenuService(ctx.db).list_items(veg=is_veg, max_price=args.budget)
    items = [item for item in items if item.is_available]
    if args.spice_pref is not None:
        items.sort(key=lambda item: (abs(item.spice_level - args.spice_pref), -(item.rating or 0)))
    else:
        items.sort(key=lambda item: (-(item.rating or 0), item.name))

    top = items[:5]
    return ToolResult(ok=True, data={"count": len(top), "recommendations": _serialize(top)})
