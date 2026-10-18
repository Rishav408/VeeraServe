from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Reservation, User
from app.schemas.reservation import ReservationCreate

STAFF_ROLES = frozenset({"staff", "admin"})


def create_reservation(
    db: Session, *, user_id: int | None, payload: ReservationCreate
) -> Reservation:
    reservation = Reservation(
        user_id=user_id,
        name=payload.name.strip(),
        party_size=payload.party_size,
        time=payload.time,
        status="pending",
    )
    db.add(reservation)
    db.commit()
    db.refresh(reservation)
    return reservation


def list_reservations(db: Session, *, user: User) -> list[Reservation]:
    statement = select(Reservation).order_by(Reservation.time.desc(), Reservation.id.desc())
    if user.role not in STAFF_ROLES:
        statement = statement.where(Reservation.user_id == user.id)
    return list(db.scalars(statement))
