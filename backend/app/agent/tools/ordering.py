"""Order and reservation tools (irreversible actions are confirmation-gated)."""

from sqlalchemy import select

from app.agent.tools.context import ToolContext
from app.agent.tools.offers import discount_for
from app.agent.tools.schemas import (
    BookTableArgs,
    GetOrderStatusArgs,
    PlaceOrderArgs,
    ToolResult,
)
from app.core.config import get_settings
from app.models import Order
from app.schemas.order import OrderCreate, OrderItemCreate, OrderOut
from app.schemas.reservation import ReservationCreate
from app.services.order import OrderValidationError, create_order, get_order
from app.services.reservation import create_reservation


def place_order(ctx: ToolContext, args: PlaceOrderArgs) -> ToolResult:
    if ctx.cart.is_empty:
        return ToolResult(ok=False, error="Cart is empty; nothing to order")

    subtotal = ctx.cart.subtotal()
    discount_rate = discount_for(ctx.offer_code, subtotal)
    gst = round(subtotal * get_settings().gst_rate)
    discount = round(subtotal * discount_rate)
    summary = {
        "items": ctx.cart.as_list(),
        "subtotal": subtotal,
        "gst": gst,
        "discount": discount,
        "total": subtotal + gst - discount,
        "payment_method": args.payment_method,
        "table_number": args.table_number,
    }

    if not ctx.confirmed:
        return ToolResult(
            ok=False,
            error="Order not confirmed; ask the user to confirm before placing it",
            data={"requires_confirmation": True, "summary": summary},
        )

    payload = OrderCreate(
        table_number=args.table_number,
        payment_method=args.payment_method,
        instructions=args.instructions,
        items=[
            OrderItemCreate(menu_item_id=line.item_id, quantity=line.quantity)
            for line in ctx.cart.lines.values()
        ],
    )
    try:
        order = create_order(ctx.db, user_id=ctx.user_id, payload=payload, discount_rate=discount_rate)
    except OrderValidationError as exc:
        return ToolResult(ok=False, error=str(exc))

    ctx.cart.clear()
    ctx.offer_code = None
    ctx.confirmed = False
    return ToolResult(ok=True, data={"order": OrderOut.model_validate(order).model_dump(mode="json")})


def _latest_order(ctx: ToolContext) -> Order | None:
    statement = (
        select(Order)
        .where(Order.user_id.is_(None) if ctx.user_id is None else Order.user_id == ctx.user_id)
        .order_by(Order.created_at.desc(), Order.id.desc())
    )
    return ctx.db.scalars(statement).first()


def get_order_status(ctx: ToolContext, args: GetOrderStatusArgs) -> ToolResult:
    order = get_order(ctx.db, args.order_id) if args.order_id is not None else _latest_order(ctx)
    if order is None:
        return ToolResult(ok=False, error="No matching order found")
    if order.user_id != ctx.user_id:
        return ToolResult(ok=False, error="That order does not belong to you")

    return ToolResult(
        ok=True,
        data={
            "order_id": order.id,
            "status": order.status,
            "total": order.total,
            "created_at": order.created_at.isoformat(),
        },
    )


def book_table(ctx: ToolContext, args: BookTableArgs) -> ToolResult:
    payload = ReservationCreate(
        name=(args.name or "Guest").strip(),
        party_size=args.party_size,
        time=args.time,
    )
    reservation = create_reservation(ctx.db, user_id=ctx.user_id, payload=payload)
    return ToolResult(
        ok=True,
        data={
            "reservation_id": reservation.id,
            "name": reservation.name,
            "party_size": reservation.party_size,
            "time": reservation.time.isoformat(),
            "status": reservation.status,
        },
    )
