from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/comparisons", tags=["comparisons"])


@router.get("/criteria")
def default_criteria(domain: str = "other"):
    """Expose the default weighted criteria for a decision category."""
    from app.services import knowledge_base as kb

    criteria = kb.get_domain_criteria(domain)
    return [{"name": c["name"], "weight": c["weight"], "description": c.get("description", "")} for c in criteria]