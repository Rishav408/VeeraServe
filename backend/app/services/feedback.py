from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Feedback
from app.schemas.feedback import FeedbackCreate


def create_feedback(db: Session, *, user_id: int | None, payload: FeedbackCreate) -> Feedback:
    feedback = Feedback(
        user_id=user_id,
        order_id=payload.order_id,
        food_rating=payload.food_rating,
        service_rating=payload.service_rating,
        ai_rating=payload.ai_rating,
        comment=payload.comment,
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback


def list_feedback(db: Session) -> list[Feedback]:
    statement = select(Feedback).order_by(Feedback.created_at.desc(), Feedback.id.desc())
    return list(db.scalars(statement))
