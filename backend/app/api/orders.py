from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, OptionalUser, require_roles
from app.db.session import get_db
from app.models import User
from app.schemas.order import OrderCreate, OrderOut, OrderStatusUpdate
from app.services.order import (
    STAFF_ROLES,
    OrderValidationError,
    create_order,
    get_order,
    list_orders,
    update_status,
)

router = APIRouter()


@router.post("/orders", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def place_order(
    payload: OrderCreate,
    current_user: OptionalUser,
    db: Session = Depends(get_db),
) -> OrderOut:
    try:
        order = create_order(
            db,
            user_id=current_user.id if current_user else None,
            payload=payload,
        )
    except OrderValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return order


@router.get("/orders", response_model=list[OrderOut])
def read_orders(current_user: CurrentUser, db: Session = Depends(get_db)) -> list[OrderOut]:
    return list_orders(db, user=current_user)


@router.get("/orders/{order_id}", response_model=OrderOut)
def read_order(
    order_id: int,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
) -> OrderOut:
    order = get_order(db, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if current_user.role not in STAFF_ROLES and order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your order")
    return order


@router.patch("/orders/{order_id}/status", response_model=OrderOut)
def change_order_status(
    order_id: int,
    payload: OrderStatusUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("staff", "admin")),
) -> OrderOut:
    order = get_order(db, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    try:
        update_status(db, order, payload.status)
    except OrderValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return order
