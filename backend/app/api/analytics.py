from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.models import User
from app.schemas.analytics import DashboardAnalytics
from app.services.analytics import compute_dashboard

router = APIRouter()


@router.get("/analytics/dashboard", response_model=DashboardAnalytics)
def dashboard(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("admin")),
) -> DashboardAnalytics:
    return compute_dashboard(db)
