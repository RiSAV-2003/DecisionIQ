from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.ratelimit import rate_limit
from app.db.base import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, RefreshRequest, RegisterRequest, TokenResponse, UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limit("auth", 10, 60))],
)
def register(payload: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    service = AuthService(db)
    try:
        user = service.register(payload.full_name, payload.email, payload.password, request)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return user


@router.post(
    "/login",
    response_model=TokenResponse,
    dependencies=[Depends(rate_limit("auth", 10, 60))],
)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    service = AuthService(db)
    user = service.authenticate(payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    access, refresh = service.issue_tokens(user, request)
    return TokenResponse(access_token=access, refresh_token=refresh, user=user)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    dependencies=[Depends(rate_limit("auth", 20, 60))],
)
def refresh(payload: RefreshRequest, request: Request, db: Session = Depends(get_db)):
    service = AuthService(db)
    tokens = service.refresh(payload.refresh_token, request)
    if not tokens:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    access, new_refresh = tokens
    user = service.db.query(User).filter(User.id == _subject_of(payload.refresh_token)).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return TokenResponse(access_token=access, refresh_token=new_refresh, user=user)


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)):
    return user


def _subject_of(token: str) -> str:
    from app.core.security import decode_token

    payload = decode_token(token)
    return payload.get("sub", "") if payload else ""