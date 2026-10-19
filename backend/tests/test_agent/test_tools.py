import pytest
from sqlalchemy import select

from app.agent.tools.context import ToolContext
from app.agent.tools.registry import call_tool, list_tools, openai_tool_schemas
from app.models import MenuItem, Order, Reservation


@pytest.fixture()
def menu_item(db) -> MenuItem:
    item = db.scalars(
        select(MenuItem).where(MenuItem.price.is_not(None), MenuItem.is_available.is_(True))
    ).first()
    assert item is not None
    return item


def _ctx(db) -> ToolContext:
    return ToolContext(db=db)


def test_view_cart_starts_empty(db) -> None:
    result = call_tool("view_cart", _ctx(db))

    assert result.ok is True
    assert result.data is not None
    assert result.data["total"] == 0
    assert result.data["items"] == []


def test_add_to_cart_rejects_unknown_item(db) -> None:
    result = call_tool("add_to_cart", _ctx(db), {"item_id": "no-such-dish"})

    assert result.ok is False
    assert result.recoverable is True
    assert "Unknown menu item" in (result.error or "")


def test_add_to_cart_rejects_non_positive_quantity(db, menu_item: MenuItem) -> None:
    result = call_tool("add_to_cart", _ctx(db), {"item_id": menu_item.id, "quantity": 0})

    assert result.ok is False
    assert "Invalid arguments" in (result.error or "")


def test_add_to_cart_rejects_unknown_fields(db, menu_item: MenuItem) -> None:
    result = call_tool(
        "add_to_cart", _ctx(db), {"item_id": menu_item.id, "quantity": 1, "free": True}
    )

    assert result.ok is False
    assert "Invalid arguments" in (result.error or "")


def test_add_to_cart_actually_mutates_the_cart(db, menu_item: MenuItem) -> None:
    ctx = _ctx(db)

    added = call_tool("add_to_cart", ctx, {"item_id": menu_item.id, "quantity": 2})
    assert added.ok is True
    assert added.data is not None
    assert added.data["subtotal"] == (menu_item.price or 0) * 2

    viewed = call_tool("view_cart", ctx)
    assert viewed.data is not None
    assert len(viewed.data["items"]) == 1
    assert viewed.data["items"][0]["quantity"] == 2


def test_update_cart_is_idempotent_and_zero_removes(db, menu_item: MenuItem) -> None:
    ctx = _ctx(db)
    call_tool("add_to_cart", ctx, {"item_id": menu_item.id, "quantity": 1})

    first = call_tool("update_cart", ctx, {"item_id": menu_item.id, "quantity": 3})
    second = call_tool("update_cart", ctx, {"item_id": menu_item.id, "quantity": 3})
    assert first.data == second.data

    removed = call_tool("update_cart", ctx, {"item_id": menu_item.id, "quantity": 0})
    assert removed.data is not None
    assert removed.data["items"] == []


def test_apply_offer_validates_and_discounts(db, menu_item: MenuItem) -> None:
    ctx = _ctx(db)
    bad = call_tool("apply_offer", ctx, {"code": "NOPE"})
    assert bad.ok is False

    good = call_tool("apply_offer", ctx, {"code": "welcome10"})
    assert good.ok is True

    call_tool("add_to_cart", ctx, {"item_id": menu_item.id, "quantity": 2})
    cart = call_tool("view_cart", ctx)
    assert cart.data is not None
    assert cart.data["discount"] == round(cart.data["subtotal"] * 0.10)


def test_get_item_and_search_menu(db, menu_item: MenuItem) -> None:
    found = call_tool("get_item", ctx=_ctx(db), raw_args={"item_id": menu_item.id})
    assert found.ok is True
    assert found.data is not None
    assert found.data["item"]["item_id"] == menu_item.id

    missing = call_tool("get_item", _ctx(db), {"item_id": "ghost"})
    assert missing.ok is False

    search = call_tool("search_menu", _ctx(db), {"is_veg": True, "max_price": 500})
    assert search.ok is True
    assert search.data is not None
    assert all(item["is_veg"] and item["price"] <= 500 for item in search.data["items"])


def test_place_order_requires_confirmation(db, menu_item: MenuItem) -> None:
    ctx = _ctx(db)
    call_tool("add_to_cart", ctx, {"item_id": menu_item.id, "quantity": 1})

    pending = call_tool("place_order", ctx, {"payment_method": "cash"})

    assert pending.ok is False
    assert pending.data is not None
    assert pending.data["requires_confirmation"] is True
    assert ctx.cart.is_empty is False


def test_place_order_creates_once_and_clears_cart(db, menu_item: MenuItem) -> None:
    ctx = _ctx(db)
    ctx.confirmed = True
    call_tool("add_to_cart", ctx, {"item_id": menu_item.id, "quantity": 1})

    placed = call_tool("place_order", ctx, {"payment_method": "cash", "table_number": 5})
    assert placed.ok is True
    assert placed.data is not None
    assert placed.data["order"]["status"] == "pending"
    assert ctx.cart.is_empty is True

    again = call_tool("place_order", ctx, {"payment_method": "cash"})
    assert again.ok is False

    order_count = len(list(db.scalars(select(Order))))
    assert order_count == 1

    status = call_tool("get_order_status", ctx)
    assert status.ok is True
    assert status.data is not None
    assert status.data["status"] == "pending"


def test_get_order_status_rejects_unknown_order(db) -> None:
    result = call_tool("get_order_status", _ctx(db), {"order_id": 999})
    assert result.ok is False


def test_book_table_creates_reservation(db) -> None:
    result = call_tool(
        "book_table",
        _ctx(db),
        {"party_size": 4, "time": "2026-11-01T20:00:00", "name": "Asha"},
    )

    assert result.ok is True
    assert result.data is not None
    assert result.data["party_size"] == 4
    assert len(list(db.scalars(select(Reservation)))) == 1


def test_registry_exposes_openai_schemas() -> None:
    schemas = openai_tool_schemas()

    assert len(schemas) == len(list_tools())
    assert {schema["function"]["name"] for schema in schemas} == {
        "search_menu",
        "get_item",
        "get_recommendations",
        "add_to_cart",
        "update_cart",
        "view_cart",
        "apply_offer",
        "list_offers",
        "get_happy_hour_status",
        "place_order",
        "get_order_status",
        "book_table",
    }
