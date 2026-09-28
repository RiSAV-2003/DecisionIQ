"""Research Agent — queries the SearchProvider abstraction, never invents information."""
from dataclasses import dataclass, field

from app.services.search_service import SourceExtractor


@dataclass
class RawSource:
    title: str
    url: str
    publisher: str | None
    snippet: str
    published_date: str | None
    query: str = ""
    source_type: str | None = None
    domain_name: str | None = None
    authority_score: float = 0.0
    freshness_score: float = 0.0
    relevance_score: float = 0.0
    reliability_score: float = 0.0
    overall_score: float = 0.0


class ResearchAgent:
    def __init__(self, search_provider):
        # search_provider: app.services.search_service.SearchProvider
        self.search_provider = search_provider
        self.extractor = SourceExtractor()

    async def research(self, queries: list[str], depth: str = "standard") -> list[RawSource]:
        """Fan out queries, dedupe, score quality, return raw (unverified) sources."""
        limit = 3 if depth == "quick" else (6 if depth == "deep" else 4)
        raw: list[dict] = []
        for q in queries[:4]:
            results = await self.search_provider.search(q, limit=limit)
            for r in results:
                r["query"] = q
            raw.extend(results)

        scored = self.extractor.extract(raw)
        return [
            RawSource(
                title=s["title"],
                url=s["url"],
                publisher=s.get("publisher"),
                snippet=s.get("snippet"),
                published_date=s.get("published_date"),
                query=next((r["query"] for r in raw if r.get("url") == s["url"]), ""),
                source_type=s.get("source_type"),
                domain_name=s.get("domain_name"),
                authority_score=s["authority_score"],
                freshness_score=s["freshness_score"],
                relevance_score=s["relevance_score"],
                reliability_score=s["reliability_score"],
                overall_score=s["overall_score"],
            )
            for s in scored
        ]