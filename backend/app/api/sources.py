from fastapi import APIRouter, Depends, HTTPException

from app.core.deps import get_current_user
from app.db.base import get_db
from app.models.user import User
from app.schemas.decision import SourceSchema

router = APIRouter(prefix="/api/v1/sources", tags=["sources"])


@router.get("/{source_id}", response_model=SourceSchema)
def get_source(source_id: str, user: User = Depends(get_current_user), db=Depends(get_db)):
    from app.models.research import Source

    source = db.get(Source, source_id)
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    return SourceSchema(
        id=source.id,
        title=source.title,
        publisher=source.publisher,
        url=source.url,
        domain_name=source.domain_name,
        source_type=source.source_type,
        snippet=source.snippet,
        authority_score=source.authority_score or 0,
        freshness_score=source.freshness_score or 0,
        relevance_score=source.relevance_score or 0,
        reliability_score=source.reliability_score or 0,
        overall_score=source.overall_score or 0,
        published_date=source.published_date,
        retrieved_date=source.retrieved_date,
    )