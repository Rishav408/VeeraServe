from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser
from app.core.security import create_access_token
from app.db.session import get_db
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserOut,
    UserPreferences,
)
from app.services.user import (
    authenticate_user,
    get_user_by_email,
    register_user,
    update_preferences,
)

router = APIRouter()


@router.post("/auth/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    if get_user_by_email(db, payload.email) is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    user = register_user(db, name=payload.name, email=payload.email, password=payload.password)
    token = create_access_token(subject=str(user.id), role=user.role)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = authenticate_user(db, email=payload.email, password=payload.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    token = create_access_token(subject=str(user.id), role=user.role)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.get("/auth/me", response_model=UserOut)
def read_current_user(current_user: CurrentUser) -> UserOut:
    return UserOut.model_validate(current_user)


@router.patch("/auth/me/preferences", response_model=UserOut)
def update_current_user_preferences(
    payload: UserPreferences,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
) -> UserOut:
    updated = update_preferences(db, current_user, payload)
    return UserOut.model_validate(updated)
