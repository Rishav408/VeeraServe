from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, OptionalUser
from app.db.session import get_db
from app.schemas.reservation import ReservationCreate, ReservationOut
from app.services.reservation import create_reservation, list_reservations

router = APIRouter()


@router.post("/reservations", response_model=ReservationOut, status_code=status.HTTP_201_CREATED)
def submit_reservation(
    payload: ReservationCreate,
    current_user: OptionalUser,
    db: Session = Depends(get_db),
) -> ReservationOut:
    return create_reservation(
        db,
        user_id=current_user.id if current_user else None,
        payload=payload,
    )


@router.get("/reservations", response_model=list[ReservationOut])
def read_reservations(current_user: CurrentUser, db: Session = Depends(get_db)) -> list[ReservationOut]:
    return list_reservations(db, user=current_user)
