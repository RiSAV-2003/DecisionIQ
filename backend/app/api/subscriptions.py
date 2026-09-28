from fastapi import APIRouter, Depends, HTTPException

from app.core.deps import get_current_user
from app.db.base import get_db
from app.models.platform import Subscription
from app.models.user import User

router = APIRouter(prefix="/api/v1/subscriptions", tags=["subscriptions"])

PLANS = {
    "free": {
        "name": "Free",
        "monthly_decisions": 5,
        "research_depth": "standard",
        "features": ["Limited decisions", "Basic research", "Basic comparison"],
    },
    "pro": {
        "name": "Pro",
        "monthly_decisions": 100,
        "research_depth": "deep",
        "features": ["Deeper research", "More decisions", "Advanced insights", "Personalized analysis"],
    },
    "premium": {
        "name": "Premium",
        "monthly_decisions": 1000,
        "research_depth": "deep",
        "features": ["Everything in Pro", "Priority AI depth", "Team-ready architecture", "Early access features"],
    },
}


@router.get("/plans")
def plans():
    return PLANS


@router.get("/me")
def my_subscription(user: User = Depends(get_current_user), db=Depends(get_db)):
    sub = db.query(Subscription).filter(Subscription.user_id == user.id).first()
    plan = sub.plan if sub else "free"
    return {"plan": plan, "limits": PLANS.get(plan, PLANS["free"])}


@router.post("/upgrade")
def upgrade(payload: dict, user: User = Depends(get_current_user), db=Depends(get_db)):
    plan = (payload.get("plan") or "free").lower()
    if plan not in PLANS:
        raise HTTPException(status_code=422, detail="Unknown plan")
    sub = db.query(Subscription).filter(Subscription.user_id == user.id).first()
    if sub:
        sub.plan = plan
    else:
        sub = Subscription(user_id=user.id, plan=plan)
        db.add(sub)
    user.plan = plan
    db.commit()
    return {"plan": plan, "limits": PLANS[plan], "note": "Checkout integration is staged for the payments provider."}