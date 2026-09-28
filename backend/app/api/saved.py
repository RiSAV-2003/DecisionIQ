from fastapi import APIRouter, Depends

from app.core.deps import get_current_user
from app.db.base import get_db
from app.models.user import User
from app.schemas.decision import SavedDecisionSummary, SavedListResponse
from app.services.decision_service import DecisionService

router = APIRouter(prefix="/api/v1/saved", tags=["saved"])


@router.get("", response_model=SavedListResponse)
def list_saved(user: User = Depends(get_current_user), db=Depends(get_db)):
    service = DecisionService(db)
    saved = service.saved_list(user.id)
    items = []
    for s in saved:
        decision = s.decision
        recommended = ""
        fit = None
        if decision.result:
            winner = next((o for o in decision.options if o.recommended), None)
            if winner:
                recommended = winner.name
            fit = decision.result.overall_fit_score
        from app.schemas.decision import DecisionSummary

        items.append(
            SavedDecisionSummary(
                id=s.id,
                saved_at=s.created_at,
                decision=DecisionSummary(
                    id=decision.id,
                    title=decision.title,
                    domain=decision.domain.value if hasattr(decision.domain, "value") else str(decision.domain),
                    status=decision.status.value if hasattr(decision.status, "value") else str(decision.status),
                    created_at=decision.created_at,
                    updated_at=decision.updated_at,
                    fit_score=fit,
                    recommended_title=recommended,
                    saved=True,
                ),
            )
        )
    return SavedListResponse(items=items, total=len(items))