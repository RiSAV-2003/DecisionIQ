from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func

from app.core.deps import get_current_user
from app.db.base import get_db
from app.models.decision import Decision, DecisionStatus
from app.models.platform import AnalyticsEvent
from app.models.saved import SavedDecision
from app.models.user import User

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])


@router.get("/summary")
def summary(user: User = Depends(get_current_user), db=Depends(get_db)):
    decisions = db.query(Decision).filter(Decision.user_id == user.id).all()
    total = len(decisions)
    completed = [d for d in decisions if d.status == DecisionStatus.COMPLETED]
    saved_count = db.query(SavedDecision).filter(SavedDecision.user_id == user.id).count()

    by_category: dict[str, int] = {}
    for d in decisions:
        key = d.domain.value if hasattr(d.domain, "value") else str(d.domain)
        by_category[key] = by_category.get(key, 0) + 1

    fits = [d.result.overall_fit_score for d in completed if d.result and d.result.overall_fit_score is not None]
    confidences = [d.result.confidence_score for d in completed if d.result and d.result.confidence_score is not None]
    avg_fit = round(sum(fits) / len(fits), 1) if fits else None
    avg_confidence = round(sum(confidences) / len(confidences), 2) if confidences else None

    # Research depth + message activity
    depths: dict[str, int] = {}
    for d in decisions:
        depths[d.research_depth] = depths.get(d.research_depth, 0) + 1
    messages = sum(len(d.messages) for d in decisions)

    # Activity over last 14 days
    since = datetime.now(timezone.utc) - timedelta(days=13)
    rows = (
        db.query(
            func.date(AnalyticsEvent.created_at),
            func.count(AnalyticsEvent.id),
        )
        .filter(AnalyticsEvent.user_id == user.id, AnalyticsEvent.created_at >= since)
        .group_by(func.date(AnalyticsEvent.created_at))
        .all()
    )
    by_day = {str(day): count for day, count in rows}

    events_by_type: dict[str, int] = {}
    for ev in db.query(AnalyticsEvent).filter(AnalyticsEvent.user_id == user.id).all():
        events_by_type[ev.event_type] = events_by_type.get(ev.event_type, 0) + 1

    return {
        "total_decisions": total,
        "completed_decisions": len(completed),
        "in_progress": total - len(completed),
        "saved_decisions": saved_count,
        "avg_fit_score": avg_fit,
        "avg_confidence": avg_confidence,
        "total_messages": messages,
        "by_category": [{"category": k, "count": v} for k, v in sorted(by_category.items(), key=lambda kv: -kv[1])],
        "activity_last_14_days": by_day,
        "events_by_type": events_by_type,
        "research_depth": depths,
    }