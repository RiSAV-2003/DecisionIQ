"""Verification Agent — grounds claims in sources, flags conflicts and weak evidence.

Runs AFTER source scoring (SourceExtractor). Responsibilities:
  - flag stale / low-quality sources instead of silently dropping them
  - detect conflicting numeric claims (e.g. two different prices)
  - attach evidence (claims) to options with confidence derived from source score
"""
import re
from dataclasses import dataclass, field

_PRICE_RE = re.compile(r"₹\s?([\d,]+(?:\.\d+)?)")


@dataclass
class VerifiedClaim:
    claim: str
    snippet: str | None = None
    source_title: str | None = None
    source_url: str | None = None
    confidence: float = 0.0
    conflicting: bool = False
    evidence_key: str | None = None
    relevance_score: float = 0.0


class VerificationAgent:
    STALE_FRESHNESS = 60  # sources scoring below this are flagged in the report

    def verify(self, raw_sources: list) -> tuple[list[VerifiedClaim], list[str]]:
        """Return (claims, conflict_warnings)."""
        claims: list[VerifiedClaim] = []
        warnings: list[str] = []
        seen_titles: set[str] = set()

        for src in raw_sources:
            title_key = re.sub(r"[^a-z0-9]+", "", (src.title or "").lower())[:60]
            if title_key and title_key in seen_titles:
                warnings.append(f"Duplicate source skipped: {src.title}")
                continue
            seen_titles.add(title_key)

            if src.freshness_score < self.STALE_FRESHNESS:
                warnings.append(
                    f"Source may be outdated (freshness {src.freshness_score:.0f}/100): {src.title}"
                )
            if src.authority_score < 60:
                warnings.append(f"Low-authority source treated cautiously: {src.title}")

            if src.snippet:
                claims.append(
                    VerifiedClaim(
                        claim=f"{src.title}: {src.snippet[:220]}",
                        snippet=src.snippet[:400],
                        source_title=src.title,
                        source_url=src.url,
                        confidence=round(min(0.95, src.overall_score / 100 * 0.9 + 0.1), 2),
                        relevance_score=src.relevance_score,
                        evidence_key="general",
                    )
                )

        # Conflict detection: numeric price claims that disagree by > 10%
        price_claims = [c for c in claims if _PRICE_RE.search(c.claim or "")]
        grouped: dict[str, list[VerifiedClaim]] = {}
        for c in price_claims:
            nums = [float(m.replace(",", "")) for m in _PRICE_RE.findall(c.claim or "")]
            if nums:
                grouped.setdefault(round(nums[0] / 1000) * 1000, []).append(c)
        keys = sorted(grouped)
        for a, b in zip(keys, keys[1:]):
            if b > 0 and (b - a) / b > 0.10:
                for c in grouped[a]:
                    c.conflicting = True
                warnings.append(
                    f"Conflicting price claims detected: ~₹{a:,} vs ~₹{b:,} — both are shown, "
                    "verify before relying on either."
                )

        return claims, warnings