"""Abstraction layer over external research providers.

- TavilyProvider is used when SEARCH_API_KEY is set.
- WikipediaProvider is the keyless default: real, attributable sources.
- SourceExtractor normalizes raw results and scores source quality so the
  verifier/analyst only see scored, deduped sources.
"""
import logging
import re
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from urllib.parse import quote

import httpx

from app.core.config import settings

logger = logging.getLogger("decisioniq.search")

WIKI_API = "https://en.wikipedia.org/w/api.php"
WIKI_UA = {
    "User-Agent": "DecisionIQ/1.0 (AI decision-intelligence research; contact: research@decisioniq.local)"
}


class SearchProvider(ABC):
    """Return a list of {title, url, publisher, snippet, published_date} dicts."""

    @abstractmethod
    async def search(self, query: str, limit: int = 5) -> list[dict]:
        raise NotImplementedError


class WikipediaProvider(SearchProvider):
    """Keyless research via the Wikipedia API. Sources are real and attributable."""

    def __init__(self) -> None:
        self.timeout = httpx.Timeout(15.0)

    async def search(self, query: str, limit: int = 5) -> list[dict]:
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                search_resp = await client.get(
                    WIKI_API,
                    headers=WIKI_UA,
                    params={
                        "action": "query",
                        "list": "search",
                        "srsearch": query,
                        "srlimit": min(limit + 2, 10),
                        "format": "json",
                        "origin": "*",
                    },
                )
                search_resp.raise_for_status()
                hits = search_resp.json().get("query", {}).get("search", [])

                results: list[dict] = []
                page_ids = []
                for hit in hits[:limit]:
                    page_ids.append(str(hit["pageid"]))
                    results.append(
                        {
                            "title": hit.get("title", query),
                            "url": f"https://en.wikipedia.org/wiki/{quote(hit.get('title', '').replace(' ', '_'))}",
                            "publisher": "Wikipedia",
                            "snippet": re.sub(r"\s+", " ", hit.get("snippet", "")).replace("&quot;", '"'),
                            "published_date": None,
                            "pageid": hit["pageid"],
                        }
                    )

                if page_ids:
                    extracts = await client.get(
                        WIKI_API,
                        headers=WIKI_UA,
                        params={
                            "action": "query",
                            "prop": "extracts",
                            "explaintext": True,
                            "exintro": True,
                            "pageids": "|".join(page_ids),
                            "format": "json",
                            "origin": "*",
                        },
                    )
                    extracts.raise_for_status()
                    pages = extracts.json().get("query", {}).get("pages", {})
                    for r in results:
                        page = pages.get(str(r.pop("pageid")), {})
                        intro = page.get("extract", "")
                        if intro:
                            r["snippet"] = re.sub(r"\s+", " ", intro)[:900]
                            r["published_date"] = page.get("touched", None)

                return results
        except Exception as exc:  # noqa: BLE001
            logger.warning("Wikipedia research failed for %r: %s", query, exc)
            return []


class LiveWebSearchProvider(SearchProvider):
    """Free live web search using ddgs. Returns fresh, real-world articles,
    reviews, tech specifications, and buying guides without requiring an API key."""

    def __init__(self) -> None:
        self.wiki = WikipediaProvider()

    async def search(self, query: str, limit: int = 5) -> list[dict]:
        results: list[dict] = []
        try:
            import asyncio
            from ddgs import DDGS

            def _fetch_ddg():
                ddg = DDGS()
                return list(ddg.text(query, max_results=limit))

            raw = await asyncio.to_thread(_fetch_ddg)
            for item in raw:
                title = item.get("title", "")
                url = item.get("href", "")
                snippet = item.get("body", "")
                if url and title:
                    results.append(
                        {
                            "title": title,
                            "url": url,
                            "publisher": _domain_of(url).replace("www.", "").capitalize(),
                            "snippet": snippet[:900],
                            "published_date": None,
                        }
                    )
        except Exception as exc:  # noqa: BLE001
            logger.warning("Live web search (ddgs) failed for %r: %s", query, exc)

        # Supplement with Wikipedia if fewer results or failed
        if len(results) < limit:
            try:
                wiki_results = await self.wiki.search(query, limit=max(2, limit - len(results)))
                results.extend(wiki_results)
            except Exception:  # noqa: BLE001
                pass

        return results


class TavilyProvider(SearchProvider):
    """Optional richer provider. Enable with SEARCH_API_KEY."""

    def __init__(self) -> None:
        self.timeout = httpx.Timeout(15.0)

    async def search(self, query: str, limit: int = 5) -> list[dict]:
        if not settings.SEARCH_API_KEY:
            return []
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(
                    "https://api.tavily.com/search",
                    json={
                        "api_key": settings.SEARCH_API_KEY,
                        "query": query,
                        "search_depth": "basic",
                        "max_results": limit,
                    },
                )
                resp.raise_for_status()
                results = []
                for r in resp.json().get("results", []):
                    results.append(
                        {
                            "title": r.get("title", ""),
                            "url": r.get("url", ""),
                            "publisher": None,
                            "snippet": r.get("content", "")[:900],
                            "published_date": r.get("published_date"),
                        }
                    )
                return results
        except Exception as exc:  # noqa: BLE001
            logger.warning("Tavily research failed for %r: %s", query, exc)
            return []


def get_provider() -> SearchProvider:
    if settings.SEARCH_API_KEY:
        return TavilyProvider()
    return LiveWebSearchProvider()


# ---------- Source quality scoring ----------

_AUTHORITY_BY_DOMAIN = {
    "wikipedia.org": 85,
    "gov": 95,
    "edu": 92,
    "ac.": 92,
    "apple.com": 90,
    "lenovo.com": 90,
    "asus.com": 88,
    "hp.com": 88,
    "acer.com": 86,
    "dell.com": 88,
    "tushar": 0,
}
_REVIEW_DOMAINS = {
    "theverge.com": 82,
    "techradar.com": 80,
    "tomsguide.com": 78,
    "toms hardware": 80,
    "anandtech.com": 88,
    "arstechnica.com": 86,
    "engadget.com": 78,
    "zdnet.com": 76,
    "ndtv": 74,
    "gadgets360.com": 74,
    "91mobiles.com": 72,
    "gsmarena.com": 80,
    "notebookcheck.net": 82,
    "cnet.com": 76,
    "forbes.com": 74,
    "bloomberg.com": 82,
    "reuters.com": 86,
    "cnbc.com": 76,
    "mint": 72,
    "economictimes": 72,
    "livemint.com": 72,
    "moneycontrol.com": 70,
    "numbeo.com": 70,
}


def _domain_of(url: str) -> str:
    m = re.search(r"https?://([^/]+)", url)
    return m.group(1).lower() if m else ""


def _authority_score(url: str, publisher: str | None) -> float:
    domain = _domain_of(url)
    pub = (publisher or "").lower()
    for key, score in _AUTHORITY_BY_DOMAIN.items():
        if key in domain or key in pub:
            return score
    for key, score in _REVIEW_DOMAINS.items():
        if key in domain or key in pub:
            return score
    if "wikipedia" in pub:
        return 85
    return 55


def _freshness_score(published_date: str | None) -> float:
    if not published_date:
        return 70  # unknown age — neutral
    try:
        dt = datetime.fromisoformat(str(published_date).replace("Z", "+00:00"))
        days = (datetime.now(timezone.utc) - dt).total_seconds() / 86400
    except (ValueError, TypeError):
        return 70
    if days <= 90:
        return 100
    if days <= 365:
        return 90
    if days <= 730:
        return 78
    if days <= 1825:
        return 60
    return 40


def _relevance_score(query: str, title: str, snippet: str) -> float:
    tokens = {t for t in re.findall(r"[a-z0-9]{3,}", query.lower()) if t not in {"which", "what", "should", "best", "better", "under", "for", "and", "the", "with", "that"}}
    if not tokens:
        return 60
    text = f"{title} {snippet}".lower()
    hits = sum(1 for t in tokens if t in text)
    return round(min(100, 45 + hits * 14), 1)


class SourceExtractor:
    """Normalizes raw provider results into scored source dicts."""

    def extract(self, raw_results: list[dict]) -> list[dict]:
        seen: set[str] = set()
        out: list[dict] = []
        for raw in raw_results:
            url = raw.get("url", "")
            if not url or url in seen:
                continue
            seen.add(url)
            authority = _authority_score(url, raw.get("publisher"))
            freshness = _freshness_score(raw.get("published_date"))
            relevance = _relevance_score(raw.get("query", ""), raw.get("title", ""), raw.get("snippet", ""))
            reliability = round(authority * 0.5 + freshness * 0.2 + relevance * 0.3, 1)
            out.append(
                {
                    "title": raw.get("title", url),
                    "publisher": raw.get("publisher"),
                    "url": url,
                    "domain_name": _domain_of(url),
                    "source_type": _classify(url, raw.get("publisher")),
                    "snippet": raw.get("snippet"),
                    "authority_score": authority,
                    "freshness_score": freshness,
                    "relevance_score": relevance,
                    "reliability_score": reliability,
                    "overall_score": round((reliability + relevance) / 2, 1),
                    "published_date": _parse_date(raw.get("published_date")),
                }
            )
        return out


def _parse_date(value):
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except (ValueError, TypeError):
        return None


def _classify(url: str, publisher: str | None) -> str:
    domain = _domain_of(url)
    pub = (publisher or "").lower()
    if any(k in domain or k in pub for k in ("wikipedia", "britannica", "encyclopedia")):
        return "reference"
    if any(k in domain for k in ("gov", "edu", "ac.")):
        return "official"
    if any(k in domain or k in pub for k in ("reuters", "bloomberg", "apnews", "bbc", "cnbc", "mint", "economictimes")):
        return "news"
    if any(k in domain or k in pub for k in ("apple.com", "lenovo.com", "asus.com", "hp.com", "acer.com", "dell.com", "samsung.com", "microsoft.com")):
        return "official"
    if any(k in domain or k in pub for k in ("review", "techradar", "theverge", "notebookcheck", "gsmarena", "cnet")):
        return "review"
    return "web"