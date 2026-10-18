from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, OptionalUser, require_roles
from app.db.session import get_db
from app.models import User
from app.schemas.feedback import FeedbackCreate, FeedbackOut
from app.services.feedback import create_feedback, list_feedback

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
