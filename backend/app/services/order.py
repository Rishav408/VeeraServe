from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.config import get_settings
from app.models import MenuItem, Order, OrderItem, User
from app.schemas.order import OrderCreate

settings = get_settings()

ORDER_STATUSES = ("pending", "preparing", "ready", "served")
ALLOWED_TRANSITIONS: dict[str, set[str]] = {
    "pending": {"preparing"},
    "preparing": {"ready"},
    "ready": {"served"},
    "served": set(),
}
STAFF_ROLES = frozenset({"staff", "admin"})


class OrderValidationError(ValueError):
    pass


def create_order(
    db: Session,
    *,
    user_id: int | None,
    payload: OrderCreate,
    discount_rate: float = 0.0,
) -> Order:
    if payload.payment_method not in settings.payment_methods:
        raise OrderValidationError("Unsupported payment method")

    subtotal = 0
    order_items: list[OrderItem] = []
    for line in payload.items:
        item = db.get(MenuItem, line.menu_item_id)
        if item is None:
            raise OrderValidationError(f"Unknown menu item: {line.menu_item_id}")
        if not item.is_available or item.price is None:
            raise OrderValidationError(f"Item unavailable: {item.name}")
        subtotal += item.price * line.quantity
        order_items.append(
            OrderItem(
                menu_item_id=item.id,
                quantity=line.quantity,
                unit_price=item.price,
                customisations=line.customisations,
            )
        )

    gst = round(subtotal * settings.gst_rate)
    discount = round(subtotal * discount_rate)
    order = Order(
        user_id=user_id,
        table_number=payload.table_number,
        status="pending",
        subtotal=subtotal,
        gst=gst,
        discount=discount,
        total=subtotal + gst - discount,
        payment_method=payload.payment_method,
        instructions=payload.instructions,
        items=order_items,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


def list_orders(db: Session, *, user: User, status: str | None = None) -> list[Order]:
    if status is not None and status not in ORDER_STATUSES:
        raise OrderValidationError(f"Unknown status: {status}")
    statement = (
        select(Order)
        .options(selectinload(Order.items))
        .order_by(Order.created_at.desc(), Order.id.desc())
    )
    if user.role not in STAFF_ROLES:
        statement = statement.where(Order.user_id == user.id)
    if status is not None:
        statement = statement.where(Order.status == status)
    return list(db.scalars(statement))


def get_order(db: Session, order_id: int) -> Order | None:
    statement = select(Order).options(selectinload(Order.items)).where(Order.id == order_id)
    return db.scalar(statement)


def update_status(db: Session, order: Order, new_status: str) -> Order:
    if new_status not in ORDER_STATUSES:
        raise OrderValidationError(f"Unknown status: {new_status}")
    if new_status not in ALLOWED_TRANSITIONS[order.status]:
        raise OrderValidationError(f"Cannot transition from {order.status} to {new_status}")
    order.status = new_status
    db.commit()
    db.refresh(order)
    return order
