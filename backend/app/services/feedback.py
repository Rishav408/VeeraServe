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


def list_feedback(db: Session, *, acknowledged: bool | None = None) -> list[Feedback]:
    statement = select(Feedback).order_by(Feedback.created_at.desc(), Feedback.id.desc())
    if acknowledged is not None:
        statement = statement.where(Feedback.acknowledged == acknowledged)
    return list(db.scalars(statement))


def get_feedback(db: Session, feedback_id: int) -> Feedback | None:
    return db.get(Feedback, feedback_id)


def acknowledge_feedback(db: Session, feedback: Feedback) -> Feedback:
    feedback.acknowledged = True
    db.commit()
    db.refresh(feedback)
    return feedback
