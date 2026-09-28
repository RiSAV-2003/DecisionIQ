from fastapi import APIRouter, Depends, HTTPException

from app.core.deps import get_current_user
from app.core.ratelimit import rate_limit
from app.models.user import User
from app.services.search_service import get_provider

router = APIRouter(prefix="/api/v1/research", tags=["research"])


@router.post("", dependencies=[Depends(rate_limit("research", 20, 60))])
async def run_research(payload: dict, user: User = Depends(get_current_user)):
    """Run a quick standalone research query, returning scored sources."""
    query = (payload.get("query") or "").strip()
    if not query:
        raise HTTPException(status_code=422, detail="query is required")
    provider = get_provider()
    raw = await provider.search(query, limit=payload.get("limit") or 4)
    from app.services.search_service import SourceExtractor

    scored = SourceExtractor().extract([{**r, "query": query} for r in raw])
    return {"query": query, "sources": scored}