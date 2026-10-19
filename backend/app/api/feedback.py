from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import OptionalUser, require_roles
from app.db.session import get_db
from app.models import User
from app.schemas.feedback import FeedbackCreate, FeedbackOut
from app.services.feedback import acknowledge_feedback, create_feedback, get_feedback, list_feedback

router = APIRouter()


@router.post("/feedback", response_model=FeedbackOut, status_code=status.HTTP_201_CREATED)
def submit_feedback(
    payload: FeedbackCreate,
    current_user: OptionalUser,
    db: Session = Depends(get_db),
) -> FeedbackOut:
    return create_feedback(db, user_id=current_user.id if current_user else None, payload=payload)


@router.get("/feedback", response_model=list[FeedbackOut])
def read_feedback(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("admin")),
) -> list[FeedbackOut]:
    return list_feedback(db)


@router.patch("/feedback/{feedback_id}/acknowledge", response_model=FeedbackOut)
def acknowledge(
    feedback_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("admin")),
) -> FeedbackOut:
    feedback = get_feedback(db, feedback_id)
    if feedback is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feedback not found")
    return acknowledge_feedback(db, feedback)
