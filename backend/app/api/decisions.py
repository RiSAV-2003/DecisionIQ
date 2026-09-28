from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.ratelimit import rate_limit
from app.db.base import get_db
from app.models.user import User
from app.schemas.decision import (
    DecisionAnswersRequest,
    DecisionCreateRequest,
    DecisionDetailResponse,
    DecisionListResponse,
    FollowUpRequest,
    FollowUpResponse,
    ReweightRequest,
)
from app.services.decision_service import DecisionService

router = APIRouter(prefix="/api/v1/decisions", tags=["decisions"])


def _needs_input(decision) -> bool:
    return any(q.get("required") for q in (decision.clarifying_questions or []))


@router.post(
    "",
    response_model=DecisionDetailResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limit("decisions", 30, 60))],
)
def create_decision(
    payload: DecisionCreateRequest,
    background: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = DecisionService(db)
    if not payload.raw_prompt.strip():
        raise HTTPException(status_code=422, detail="Tell us what you're trying to decide.")
    decision = service.create_decision(
        user, payload.raw_prompt, payload.domain, payload.answers, payload.research_depth
    )
    service.prepare_analysis(decision, user)
    if not _needs_input(decision):
        service.start_analysis(decision, user, background)
    return service.to_detail(decision, user.id)


@router.get("", response_model=DecisionListResponse)
def list_decisions(
    limit: int = 50,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = DecisionService(db)
    items, total = service.list_for_user(user.id, limit=min(limit, 100), offset=offset)
    return DecisionListResponse(items=items, total=total)


@router.get("/{decision_id}", response_model=DecisionDetailResponse)
def get_decision(decision_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = DecisionService(db)
    decision = service.get(decision_id, user.id)
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    return service.to_detail(decision, user.id)


@router.post("/{decision_id}/answers", response_model=DecisionDetailResponse)
def submit_answers(
    decision_id: str,
    payload: DecisionAnswersRequest,
    background: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = DecisionService(db)
    decision = service.get(decision_id, user.id)
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    from app.models.decision import DecisionInput

    for key, value in payload.answers.items():
        if value in (None, ""):
            continue
        existing = next((i for i in decision.inputs if i.key == key), None)
        if existing:
            existing.value = str(value)
        else:
            db.add(DecisionInput(decision_id=decision.id, key=str(key), value=str(value)))
    db.commit()
    db.refresh(decision)
    service.prepare_analysis(decision, user)
    if not _needs_input(decision):
        service.start_analysis(decision, user, background)
    return service.to_detail(decision, user.id)


@router.post("/{decision_id}/analyze", response_model=DecisionDetailResponse)
def analyze(
    decision_id: str,
    background: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = DecisionService(db)
    decision = service.get(decision_id, user.id)
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    service.prepare_analysis(decision, user)
    if _needs_input(decision):
        # Not enough information yet — surface the questions instead.
        return service.to_detail(decision, user.id)
    service.start_analysis(decision, user, background)
    return service.to_detail(decision, user.id)


@router.post("/{decision_id}/follow-up", response_model=FollowUpResponse)
async def follow_up(
    decision_id: str,
    payload: FollowUpRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = DecisionService(db)
    decision = service.get(decision_id, user.id)
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    reply, changed, detail = await service.follow_up(decision, user, payload.message)
    return FollowUpResponse(reply=reply, changed_recommendation=changed, decision=detail)


@router.post("/{decision_id}/reweight", response_model=DecisionDetailResponse)
def reweight_decision(
    decision_id: str,
    payload: ReweightRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = DecisionService(db)
    decision = service.get(decision_id, user.id)
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    return service.reweight_criteria(decision, payload.criteria_weights, user.id)


@router.post("/{decision_id}/save", status_code=status.HTTP_201_CREATED)
def save_decision(decision_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = DecisionService(db)
    if not service.get(decision_id, user.id):
        raise HTTPException(status_code=404, detail="Decision not found")
    service.save(user.id, decision_id)
    return {"status": "saved"}


@router.delete("/{decision_id}/save")
def unsave_decision(decision_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = DecisionService(db)
    service.unsave(user.id, decision_id)
    return {"status": "removed"}


@router.delete("/{decision_id}")
def delete_decision(decision_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = DecisionService(db)
    if not service.delete(decision_id, user.id):
        raise HTTPException(status_code=404, detail="Decision not found")
    return {"status": "deleted"}