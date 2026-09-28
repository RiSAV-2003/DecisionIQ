from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.base import get_db
from app.models.user import User, UserPreference
from app.schemas.auth import UserResponse
from app.schemas.user import PreferenceResponse, PreferenceUpdateRequest, UserUpdateRequest

router = APIRouter(prefix="/api/v1/users", tags=["users"])


@router.patch("/me", response_model=UserResponse)
def update_me(payload: UserUpdateRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.full_name:
        user.full_name = payload.full_name
    db.commit()
    db.refresh(user)
    return user


def _prefs(db: Session, user: User) -> UserPreference:
    if not user.preferences:
        prefs = UserPreference(user_id=user.id)
        db.add(prefs)
        db.commit()
        db.refresh(user)
    return user.preferences


@router.get("/preferences", response_model=PreferenceResponse)
def get_preferences(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = _prefs(db, user)
    return PreferenceResponse(
        decision_interests=p.decision_interests or [],
        priorities=p.priorities or [],
        budget_sensitivity=p.budget_sensitivity,
        research_depth=p.research_depth,
        preferred_categories=p.preferred_categories or [],
        currency=p.currency,
        extra=p.extra or {},
    )


@router.patch("/preferences", response_model=PreferenceResponse)
def update_preferences(
    payload: PreferenceUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    p = _prefs(db, user)
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        if value is not None:
            setattr(p, key, value)
    db.commit()
    db.refresh(p)
    return PreferenceResponse(
        decision_interests=p.decision_interests or [],
        priorities=p.priorities or [],
        budget_sensitivity=p.budget_sensitivity,
        research_depth=p.research_depth,
        preferred_categories=p.preferred_categories or [],
        currency=p.currency,
        extra=p.extra or {},
    )