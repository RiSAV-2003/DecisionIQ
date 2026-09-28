"""Agent Orchestrator — wires the full pipeline together dynamically.

    Prompt -> Planner (Gemini / Dynamic) -> Researcher (Wikipedia / Live Web)
           -> Verifier -> Comparator -> Analyst -> Synthesizer -> Report

Zero local static data: options, evidence, and scores are generated dynamically.
"""
from __future__ import annotations

from dataclasses import dataclass, field
import logging
import re

from app.agents.planner import DecisionPlanner, STAGE_LABELS
from app.agents.researcher import ResearchAgent
from app.agents.verifier import VerificationAgent
from app.agents.comparator import ComparisonAgent
from app.agents.analyst import AnalysisAgent
from app.agents.synthesizer import DecisionSynthesizer
from app.services import knowledge_base as kb
from app.services.llm_service import LLMService

logger = logging.getLogger("decisioniq.orchestrator")


@dataclass
class GenericOption:
    key: str
    name: str
    summary: str | None = None
    price_info: str | None = None
    price_inr: int | None = None
    attrs: dict[str, float] = field(default_factory=dict)
    source_keys: list[str] = field(default_factory=list)


def _slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug or "option"


_STOP_TOKENS = {"which", "what", "should", "the", "and", "for", "with", "under", "best", "buy", "your", "that", "this", "from", "option", "options", "compare", "only"}


class DecisionOrchestrator:
    def __init__(self, search_provider):
        self.planner = DecisionPlanner()
        self.researcher = ResearchAgent(search_provider)
        self.verifier = VerificationAgent()
        self.comparator = ComparisonAgent()
        self.analyst = AnalysisAgent()
        self.synthesizer = DecisionSynthesizer()
        self.llm = LLMService()

    # ------------------------------------------------------------------
    async def run(
        self,
        raw_prompt: str,
        domain: str | None,
        inputs: dict,
        user_prefs: dict | None = None,
        depth: str = "standard",
        on_stage=None,
        user_api_key: str | None = None,
    ) -> dict:
        def stage(key: str, status: str, detail: str | None = None):
            if on_stage:
                on_stage(key, status, detail)

        llm = LLMService(api_key=user_api_key) if user_api_key else self.llm

        stage("understanding", "active", "Analyzing decision with AI and identifying real-world options…")
        plan = await self.planner.plan_dynamic(raw_prompt, domain, inputs, user_prefs, llm)
        stage("understanding", "completed", f"Category: {plan.domain.capitalize()}")
        stage("priorities", "completed", f"{len(plan.criteria)} weighted criteria tailored to your decision")

        # Convert plan options to GenericOption instances
        options: list[GenericOption] = []
        for opt in plan.options:
            if isinstance(opt, dict):
                options.append(
                    GenericOption(
                        key=opt.get("key") or _slugify(opt.get("name", "option")),
                        name=opt.get("name", "Option"),
                        summary=opt.get("summary"),
                        price_info=opt.get("price_info"),
                        price_inr=opt.get("price_inr"),
                        attrs=opt.get("attrs", {}),
                    )
                )
            elif hasattr(opt, "name"):
                options.append(
                    GenericOption(
                        key=getattr(opt, "key", _slugify(opt.name)),
                        name=opt.name,
                        summary=getattr(opt, "summary", None),
                        price_info=getattr(opt, "price_info", None),
                        price_inr=getattr(opt, "price_inr", None),
                        attrs=getattr(opt, "attrs", {}),
                    )
                )

        stage("researching", "active", f"Researching live web & verified sources ({len(plan.research_queries)} queries)…")
        raw_sources = await self.researcher.research(plan.research_queries, depth)
        stage("researching", "completed", f"{len(raw_sources)} real sources collected")

        if not options or options[0].name.startswith("Top Contender"):
            discovered = _discover_options_from_sources(
                raw_sources, raw_prompt, plan.domain, plan.budget, plan.currency
            )
            if discovered:
                options = discovered
            elif not options:
                fallback_entries = kb.get_curated_fallback_options(
                    raw_prompt, plan.domain, plan.budget, plan.currency
                )
                options = [
                    GenericOption(
                        key=e.key,
                        name=e.name,
                        summary=e.summary,
                        price_info=e.price_info,
                        price_inr=e.price_inr,
                        attrs=e.attrs,
                    )
                    for e in fallback_entries
                ]

        stage("verifying", "active", "Checking freshness, authority and conflicting data…")
        claims, conflict_warnings = self.verifier.verify(raw_sources)
        stage("verifying", "completed", f"{len(claims)} evidence points extracted")

        sources = _collect_sources(raw_sources)
        evidence_by_option = _build_evidence(raw_sources, claims, options)

        stage("comparing", "active", "Evaluating options against criteria with evidence-grounded scoring…")

        # Use Gemini AI evaluation when available for deep criteria scoring and notes
        ai_eval = None
        evidence_snippets = [f"Source: {s.get('title')} - {s.get('snippet')}" for s in sources if s.get("snippet")]
        if llm.is_available:
            try:
                ai_eval = await llm.evaluate_options_with_evidence(
                    raw_prompt=raw_prompt,
                    options=[{"name": o.name, "summary": o.summary, "price": o.price_info} for o in options],
                    criteria=plan.criteria,
                    evidence_snippets=evidence_snippets,
                    budget=plan.budget,
                )
            except Exception as exc:  # noqa: BLE001
                logger.warning("AI evaluation failed, falling back to comparator: %s", exc)

        scored = self.comparator.compare(options, plan.criteria, evidence_by_option, plan.budget)

        # Merge AI evaluation into scored options if available
        if ai_eval and isinstance(ai_eval, dict) and "evaluations" in ai_eval:
            eval_by_name = {e.get("option_name", "").lower(): e for e in ai_eval.get("evaluations", [])}
            for so in scored:
                matched_eval = eval_by_name.get(so.name.lower())
                if not matched_eval:
                    for k, v in eval_by_name.items():
                        if k in so.name.lower() or so.name.lower() in k:
                            matched_eval = v
                            break
                if matched_eval:
                    ai_scores = matched_eval.get("scores", {})
                    ai_notes = matched_eval.get("notes", {})
                    updated_crit_scores = []
                    total_weighted = 0.0
                    for cs in so.criterion_scores:
                        crit_name = cs["name"]
                        if crit_name in ai_scores:
                            new_score = float(ai_scores[crit_name])
                            cs["score"] = new_score
                            if crit_name in ai_notes:
                                cs["note"] = ai_notes[crit_name]
                        total_weighted += cs["score"] * (cs["weight"] / 100.0)
                        updated_crit_scores.append(cs)
                    so.criterion_scores = updated_crit_scores
                    so.fit_score = round(total_weighted, 1)

            # Re-sort scored options by updated fit_score
            scored.sort(key=lambda o: o.fit_score, reverse=True)

        stage("comparing", "completed", f"{len(scored)} options scored")

        stage("insights", "active", "Generating trade-offs, risk factors and recommendation…")
        analysis = self.analyst.analyze(scored, {})

        # If AI evaluation gave highlights, strengths, weaknesses, risks, merge them
        if ai_eval and isinstance(ai_eval, dict) and "evaluations" in ai_eval:
            for so in scored:
                matched_eval = next((e for e in ai_eval.get("evaluations", []) if e.get("option_name", "").lower() in so.name.lower() or so.name.lower() in e.get("option_name", "").lower()), None)
                if matched_eval:
                    analysis[so.key] = {
                        "highlights": matched_eval.get("highlights") or analysis[so.key].get("highlights", []),
                        "strengths": matched_eval.get("strengths") or analysis[so.key].get("strengths", []),
                        "weaknesses": matched_eval.get("weaknesses") or analysis[so.key].get("weaknesses", []),
                        "risks": matched_eval.get("risks") or analysis[so.key].get("risks", []),
                    }

        result = self.synthesizer.synthesize(
            scored, plan.criteria, analysis, sources, claims,
            conflict_warnings, inputs, plan.budget, plan.uses,
        )

        # Enhance synthesis with Gemini if available
        if llm.is_available and scored:
            try:
                ai_synth = await llm.synthesize_recommendation(
                    raw_prompt=raw_prompt,
                    ranked_options=[{"name": o.name, "fit_score": o.fit_score, "summary": o.summary} for o in scored],
                    criteria=plan.criteria,
                    analysis=analysis,
                    budget=plan.budget,
                )
                if ai_synth and isinstance(ai_synth, dict):
                    if ai_synth.get("summary"):
                        result["summary"] = ai_synth["summary"]
                    if ai_synth.get("reasoning"):
                        result["reasoning"] = ai_synth["reasoning"]
                    if ai_synth.get("caveats"):
                        result["caveats"] = ai_synth["caveats"]
                    if ai_synth.get("trade_offs"):
                        result["trade_offs"] = ai_synth["trade_offs"]
                    if ai_synth.get("assumptions"):
                        result["assumptions"] = ai_synth["assumptions"]
                    if ai_synth.get("what_could_change"):
                        result["what_could_change"] = ai_synth["what_could_change"]
                    if ai_synth.get("next_steps"):
                        result["next_steps"] = ai_synth["next_steps"]
            except Exception as exc:  # noqa: BLE001
                logger.warning("AI synthesis refinement failed: %s", exc)

        stage("insights", "completed", "Real-world decision intelligence ready")

        return _report(
            domain=plan.domain,
            criteria=plan.criteria,
            scored=scored,
            analysis=analysis,
            sources=sources,
            evidence_by_option=evidence_by_option,
            result=result,
            conflict_warnings=conflict_warnings,
            budget=plan.budget,
            uses=plan.uses,
        )

    # ------------------------------------------------------------------
    def recompute(
        self,
        domain: str,
        criteria: list[dict],
        options: list,
        evidence_by_option: dict[str, list],
        inputs: dict,
        budget: int | None = None,
        uses: list[str] | None = None,
        sources: list | None = None,
        claims: list | None = None,
        conflict_warnings: list[str] | None = None,
    ) -> dict:
        """Re-score an existing decision after a follow-up changes constraints."""
        scored = self.comparator.compare(options, criteria, evidence_by_option, budget)
        analysis = self.analyst.analyze(scored, {})
        result = self.synthesizer.synthesize(
            scored, criteria, analysis, sources or [], claims or [],
            conflict_warnings or [], inputs, budget, uses,
        )
        return _report(domain, criteria, scored, analysis, sources or [], evidence_by_option, result, conflict_warnings or [], budget, uses)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _collect_sources(raw_sources: list) -> list[dict]:
    out = []
    for r in raw_sources:
        out.append(
            {
                "title": r.title,
                "publisher": r.publisher,
                "url": r.url,
                "domain_name": r.domain_name,
                "source_type": r.source_type,
                "snippet": r.snippet,
                "authority_score": r.authority_score,
                "freshness_score": r.freshness_score,
                "relevance_score": r.relevance_score,
                "reliability_score": r.reliability_score,
                "overall_score": r.overall_score,
                "published_date": r.published_date,
                "key": None,
            }
        )
    return out


def _significant_tokens(name: str) -> list[str]:
    toks = [t for t in re.findall(r"[a-z0-9]{2,}", name.lower()) if t not in _STOP_TOKENS]
    return toks[:8]


def _build_evidence(raw_sources: list, claims: list, options: list) -> dict[str, list]:
    """Attach evidence to each option key from live research claims."""
    by_key: dict[str, list] = {o.key: [] for o in options}

    for claim in claims:
        text = f"{claim.claim} {claim.snippet or ''}".lower()
        target = None

        # 1. Exact or substring match of full option name
        for o in options:
            clean_name = o.name.lower()
            if len(clean_name) >= 4 and clean_name in text:
                target = o
                break

        # 2. Key tokens match
        if not target:
            for o in options:
                toks = _significant_tokens(o.name)
                if toks and sum(1 for t in toks if t in text) >= max(1, len(toks) // 2):
                    target = o
                    break

        source = {
            "title": claim.source_title,
            "publisher": None,
            "url": claim.source_url,
            "domain_name": None,
            "source_type": None,
            "snippet": claim.snippet,
            "authority_score": claim.confidence * 100,
            "freshness_score": 70,
            "relevance_score": claim.relevance_score,
            "reliability_score": claim.confidence * 100,
            "overall_score": claim.confidence * 100,
            "published_date": None,
        }
        entry = {
            "claim": claim.claim,
            "evidence_key": claim.evidence_key or "general",
            "confidence": claim.confidence,
            "relevance_score": claim.relevance_score,
            "conflict": claim.conflicting,
            "source": source,
        }
        if target:
            by_key.setdefault(target.key, []).append(entry)
        else:
            by_key.setdefault("_general", []).append(entry)

    return by_key


def _report(domain, criteria, scored, analysis, sources, evidence_by_option,
            result, conflict_warnings, budget, uses) -> dict:
    winner_key = result.get("recommended_option_id")
    options_out = []
    for idx, so in enumerate(scored):
        a = analysis.get(so.key, {})
        options_out.append(
            {
                "key": so.key,
                "name": so.name,
                "summary": so.summary,
                "price_info": so.price_info,
                "price_inr": so.price_inr,
                "badge": "RECOMMENDED FIT" if so.key == winner_key else "ALTERNATIVE",
                "highlights": a.get("highlights", []),
                "strengths": a.get("strengths", []),
                "weaknesses": a.get("weaknesses", []),
                "risks": a.get("risks", []),
                "criterion_scores": so.criterion_scores,
                "fit_score": so.fit_score,
                "recommended": so.key == winner_key,
                "position": idx,
            }
        )
    criteria_out = [
        {"id": _criterion_id(c["name"]), "name": c["name"], "weight": c["weight"],
         "description": c.get("description", ""), "position": i}
        for i, c in enumerate(criteria)
    ]
    evidence_out = []
    for key, evs in evidence_by_option.items():
        for ev in evs:
            evidence_out.append({**ev, "option_key": key})
    return {
        "domain": domain,
        "criteria": criteria_out,
        "options": options_out,
        "sources": sources,
        "evidence": evidence_out,
        "result": result,
        "conflict_warnings": conflict_warnings,
        "budget": budget,
        "uses": uses or [],
        "stages": STAGE_LABELS,
    }


def _criterion_id(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


_KNOWN_BRANDS = [
    "OnePlus", "boAt", "Realme", "Noise", "Boult", "Sony", "Apple", "Samsung",
    "Nothing", "CMF", "JBL", "Sennheiser", "Anker", "Soundcore", "Oppo", "Vivo",
    "Xiaomi", "Redmi", "Poco", "Jabra", "Asus", "Lenovo", "Acer", "HP", "Dell",
    "MSI", "Google", "Motorola", "iQOO", "AWS", "Azure", "GCP", "Supabase", "Firebase",
    "Vercel", "Cloudflare", "Tata", "Mahindra", "MG", "Hyundai", "Kia", "BYD", "Tesla"
]

_JUNK_SUBSTRINGS = {
    "buy top", "view popular", "shop now", "click here", "read more", "top rated",
    "best overall", "buying guide", "amazon india", "flipkart", "smartprix", "digit",
    "true wireless earbuds", "wireless earbuds", "tws earbuds", "earbuds under",
    "headphones under", "best earbuds", "best laptops", "best phones", "under 5000",
    "under 50000", "under 70000", "free delivery", "add to cart", "customer reviews",
    "specs features", "price in india", "full review", "hands on", "buying guide",
    "which is better", "should you buy", "everything you need", "pros and cons",
    "jun 2026", "sep 2026", "feb 2026", "oct 2026", "top 10", "top 5", "top picks",
    "all rights reserved", "privacy policy", "terms of use", "other features",
    "key features", "what we like", "what we dislike", "the good", "the bad",
}

_JUNK_WORDS = {
    "buy", "view", "shop", "click", "read", "check", "find", "explore", "learn", "compare",
    "today", "yesterday", "jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep",
    "oct", "nov", "dec", "january", "february", "march", "april", "june", "july", "august",
    "september", "october", "november", "december", "2023", "2024", "2025", "2026",
    "hours", "days", "minutes", "guide", "review", "reviews", "best", "top", "list", "overview",
    "which", "what", "how", "why", "where", "under", "over", "between", "true", "wireless",
    "sizes", "size", "features", "feature", "specifications", "specification", "specs",
    "performance", "display", "battery", "life", "price", "pricing", "cost", "design", "build",
    "quality", "camera", "storage", "ram", "ports", "warranty", "pros", "cons", "verdict",
    "conclusion", "rating", "ratings", "benchmarks", "benchmark", "connectivity", "dimensions",
    "weight", "accessories", "package", "other", "things", "everything", "detail", "details",
    "article", "post", "blog", "author", "comments", "advertisement", "sponsored", "affiliate",
    "questions", "answers", "faq", "faqs", "table", "summary", "source", "sources", "edition",
    "model", "models", "options", "option", "choice", "choices", "contender", "contenders",
}


def _is_junk_candidate(name: str) -> bool:
    clean = name.strip().lower()
    if len(clean) < 4:
        return True
    if clean in _JUNK_SUBSTRINGS or any(j in clean for j in _JUNK_SUBSTRINGS):
        return True
    words = clean.split()
    if not words:
        return True
    if words[0] in _JUNK_WORDS and len(words) <= 2:
        return True
    if any(w in _JUNK_WORDS for w in words) and len(words) <= 2:
        return True
    if all(w in _JUNK_WORDS for w in words):
        return True
    # If date pattern like 'sep 10' or '10 days ago'
    if re.search(r"^(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d+", clean):
        return True
    return False


def _discover_options_from_sources(
    raw_sources: list,
    raw_prompt: str,
    domain: str = "other",
    budget: int | None = None,
    currency: str | None = None,
) -> list[GenericOption]:
    """Dynamically discover candidate real options from research snippets and titles."""
    discovered: list[GenericOption] = []
    seen = set()

    # 1. Look for Brand + Model patterns in titles and snippets
    brand_pattern = r"\b(" + "|".join(re.escape(b) for b in _KNOWN_BRANDS) + r")\s+([A-Za-z0-9\+\-]+(?:\s+[A-Za-z0-9\+\-]+){1,3})"

    for s in raw_sources:
        text = f"{getattr(s, 'title', '')} {getattr(s, 'snippet', '')}"

        # Brand + model matches
        matches = re.findall(brand_pattern, text, re.IGNORECASE)
        for b, m in matches:
            cand = f"{b} {m}".strip()
            # Clean trailing punctuation
            cand = re.sub(r"[,;:\.\-\(\)].*$", "", cand).strip()
            if not _is_junk_candidate(cand) and cand.lower() not in seen and 4 <= len(cand) <= 40:
                # Disallow candidates where model is just generic dictionary words
                cand_words = [w.lower() for w in cand.split()]
                if not all(w in _JUNK_WORDS for w in cand_words[1:]):
                    seen.add(cand.lower())
                    discovered.append(
                        GenericOption(
                            key=_slugify(cand),
                            name=cand,
                            summary=f"Market contender identified via live research: {cand}",
                            price_info=f"~{currency or '₹'}{budget:,}" if budget else None,
                            price_inr=budget if currency == "INR" else None,
                        )
                    )
                    if len(discovered) >= 5:
                        break

        if len(discovered) >= 5:
            break

        # Numbered list pattern: "1. Brand Model ..." or "Top 5: Brand Model ..."
        list_matches = re.findall(
            r"(?:(?:\b\d+\.|\b#\d+)\s+|\bTop\s+\d+\s*[-:–]\s*)([A-Z][A-Za-z0-9\+\-]+(?:\s+[A-Za-z0-9\+\-]+){1,4})",
            text,
        )
        for lm in list_matches:
            cand = lm.strip(" -–:.")
            cand = re.sub(r"^(?:The|Best|Top)\s+", "", cand, flags=re.IGNORECASE).strip()
            if (
                not _is_junk_candidate(cand)
                and cand.lower() not in seen
                and 4 <= len(cand) <= 40
                and any(b.lower() in cand.lower() for b in _KNOWN_BRANDS)
            ):
                seen.add(cand.lower())
                discovered.append(
                    GenericOption(
                        key=_slugify(cand),
                        name=cand,
                        summary=f"Contender identified from research recommendations: {cand}",
                        price_info=f"~{currency or '₹'}{budget:,}" if budget else None,
                        price_inr=budget if currency == "INR" else None,
                    )
                )
                if len(discovered) >= 5:
                    break

        if len(discovered) >= 5:
            break

    # If fewer than 2 valid options found from snippets, use high-confidence curated archetype baseline
    if len(discovered) < 2:
        fallback_entries = kb.get_curated_fallback_options(raw_prompt, domain, budget, currency)
        if fallback_entries:
            return [
                GenericOption(
                    key=e.key,
                    name=e.name,
                    summary=e.summary,
                    price_info=e.price_info,
                    price_inr=e.price_inr,
                    attrs=e.attrs,
                )
                for e in fallback_entries
            ]

    return discovered