"""Decision Planner — turns the raw prompt + inputs into a structured research plan.

Uses dynamic Gemini AI analysis when available to discover real-world options,
custom criteria, and targeted research queries. All static mock databases have
been eliminated.
"""
from __future__ import annotations

from dataclasses import dataclass, field
import re

from app.services import knowledge_base as kb
from app.services.llm_service import LLMService

STAGE_LABELS = [
    {"key": "understanding", "label": "Understanding your decision", "description": "Parsing your question, goals and constraints"},
    {"key": "priorities", "label": "Analyzing your priorities", "description": "Weighting what matters most to you"},
    {"key": "researching", "label": "Researching trusted sources", "description": "Collecting real, attributable information"},
    {"key": "verifying", "label": "Verifying evidence", "description": "Checking freshness, authority and conflicts"},
    {"key": "comparing", "label": "Comparing your options", "description": "Scoring every option against your criteria"},
    {"key": "insights", "label": "Generating personalized insights", "description": "Finding trade-offs and what could change"},
    {"key": "ready", "label": "Decision ready", "description": "Your recommendation is ready to review"},
]


@dataclass
class DecisionPlan:
    domain: str = "other"
    criteria: list[dict] = field(default_factory=list)
    research_queries: list[str] = field(default_factory=list)
    clarifying_questions: list[dict] = field(default_factory=list)
    options: list = field(default_factory=list)  # list of option dicts / GenericOptions
    option_templates: list[str] = field(default_factory=list)
    budget: int | None = None
    currency: str | None = None
    uses: list[str] = field(default_factory=list)
    budget_sensitivity: int = 3
    needs_input: bool = False


_NORMALIZE_NAMES: dict[str, str] = {
    "hydrabad": "Hyderabad",
    "hyderabad": "Hyderabad",
    "secunderabad": "Hyderabad",
    "bangalore": "Bangalore (Bengaluru)",
    "bengaluru": "Bangalore (Bengaluru)",
    "bengalore": "Bangalore (Bengaluru)",
    "banglore": "Bangalore (Bengaluru)",
    "calcutta": "Kolkata",
    "kolkata": "Kolkata",
    "gurgaon": "Gurgaon (Haryana / NCR)",
    "gurugram": "Gurgaon (Haryana / NCR)",
    "haryana": "Gurgaon (Haryana / NCR)",
    "noida": "Noida (Delhi NCR)",
    "delhi": "Delhi NCR",
    "delhi ncr": "Delhi NCR",
    "bombay": "Mumbai",
    "mumbai": "Mumbai",
    "madras": "Chennai",
    "chennai": "Chennai",
    "pune": "Pune",
}


def _normalize_name(name: str) -> str:
    clean = name.strip(" ?!.,;:")
    lower = clean.lower()
    if lower in _NORMALIZE_NAMES:
        return _NORMALIZE_NAMES[lower]
    return clean


def _split_named_options(prompt: str) -> list[str]:
    """Extract candidate option names from prompts with comma lists, 'vs', 'or', colons, etc."""
    text = prompt.strip(" ?!.,;:")

    # 1. Colon or dash delimiter: e.g. 'Which city is best: Kolkata, Bangalore, Hyderabad'
    for sep_char in [":", " - "]:
        if sep_char in text:
            _, right = text.split(sep_char, 1)
            parts = [
                p.strip(" ?!.,;:")
                for p in re.split(r"[,;]|\s+(?:or|vs|versus|and)\s+", right, flags=re.I)
                if p.strip(" ?!.,;:")
            ]
            if len(parts) >= 2 and all(2 <= len(p) <= 60 for p in parts):
                return [_normalize_name(p) for p in parts[:6]]

    # 2. Conjunctions 'vs', 'versus', 'compared to', 'against'
    if re.search(r"\s+(?:vs\.?|versus|compared\s+to|against)\s+", text, re.I):
        clean = re.sub(r"\s+(?:for|under|with)\s+.*$", "", text, flags=re.I)
        clean = re.sub(
            r"^(?:which|what|should\s+i|choose\s+between|between|compare)?\s*(?:[a-zA-Z\s]{2,30}:)?\s*",
            "",
            clean,
            flags=re.I,
        ).strip()
        parts = [p.strip(" ?!.,;:") for p in re.split(r"\s+(?:vs\.?|versus|compared\s+to|against)\s+", clean, flags=re.I)]
        if len(parts) >= 2 and all(2 <= len(p) <= 80 for p in parts):
            return [_normalize_name(p) for p in parts[:6]]

    # 3. 'Between X, Y and Z' or 'Between X and Y'
    m_between = re.search(r"\bbetween\s+(.+?)(?:\s+for\s+.*|\s+under\s+.*|$)", text, re.I)
    if m_between:
        between_content = m_between.group(1).strip()
        parts = [
            p.strip(" ?!.,;:")
            for p in re.split(r"[,;]|\s+(?:and|or)\s+", between_content, flags=re.I)
            if p.strip(" ?!.,;:")
        ]
        if len(parts) >= 2 and all(2 <= len(p) <= 60 for p in parts):
            return [_normalize_name(p) for p in parts[:6]]

    # 4. Comma-separated list with question prefix or constraints
    # e.g. 'Which City is better for it jobs Kolkata, Bangalore, Hydrabad , Haryana ?'
    if "," in text:
        clean_end = re.sub(r"\s+(?:for|under|with)\s+[a-zA-Z0-9\s]+$", "", text, flags=re.I).strip(" ?!.,;:")
        comma_parts = [p.strip(" ?!.,;:") for p in clean_end.split(",")]
        if len(comma_parts) >= 2:
            first = comma_parts[0]
            # Strip question starters, preambles, and purpose clauses from first element
            cleaned_first = re.sub(
                r"^(?:which(?:\s+(?:one|city|laptop|phone|framework|language|car|college|university|option|place|country|stock))?|what(?:\s+(?:is|are))?|should\s+i(?:\s+choose|\s+buy)?|choose(?:\s+between)?|compare|tell\s+me\s+about)?\s*",
                "",
                first,
                flags=re.I,
            ).strip()
            cleaned_first = re.sub(
                r"^(?:is\s+)?(?:better|best|preferred)\s+(?:for\s+[^,:]+\s+)?",
                "",
                cleaned_first,
                flags=re.I,
            ).strip()
            cleaned_first = re.sub(
                r"^(?:[a-zA-Z\s]{2,30}?\s+for\s+[a-zA-Z0-9\s]{1,30}?\s+)",
                "",
                cleaned_first,
                flags=re.I,
            ).strip()
            cleaned_first = re.sub(r"^(?:between\s+|for\s+)", "", cleaned_first, flags=re.I).strip()

            candidates = []
            if cleaned_first and len(cleaned_first) >= 2:
                candidates.append(cleaned_first)

            for p in comma_parts[1:]:
                sub_parts = re.split(r"\s+(?:or|and)\s+", p, flags=re.I)
                for sp in sub_parts:
                    s = sp.strip(" ?!.,;:")
                    s = re.sub(r"\s+(?:which\s+one|which\s+is\s+better|which\s+to\s+buy).*$", "", s, flags=re.I).strip(" ?!.,;:")
                    s = re.sub(r"^(?:or|and)\s+", "", s, flags=re.I).strip(" ?!.,;:")
                    if s and 2 <= len(s) <= 60:
                        candidates.append(s)

            if len(candidates) >= 2:
                return [_normalize_name(c) for c in candidates[:6]]

    # 5. 'X or Y' style prompt
    if re.search(r"\s+or\s+", text, re.I):
        clean = re.sub(r"\s+(?:for|under|with)\s+.*$", "", text, flags=re.I)
        clean = re.sub(
            r"^(?:which|what|should\s+i|choose\s+between|between|compare)?\s*(?:[a-zA-Z\s]{2,30}:)?\s*",
            "",
            clean,
            flags=re.I,
        ).strip()
        parts = [p.strip(" ?!.,;:") for p in re.split(r"\s+or\s+", clean, flags=re.I)]
        if len(parts) >= 2 and all(2 <= len(p) <= 80 for p in parts):
            return [_normalize_name(p) for p in parts[:6]]

    return []


def _slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug or "option"


class DecisionPlanner:
    def __init__(self) -> None:
        self.llm = LLMService()

    def plan(
        self,
        raw_prompt: str,
        domain: str | None,
        inputs: dict[str, str],
        user_prefs: dict | None = None,
    ) -> DecisionPlan:
        """Fast synchronous planner for initial preparation and clarifying questions."""
        prefs = user_prefs or {}
        priorities = prefs.get("priorities", [])
        budget_sensitivity = int(prefs.get("budget_sensitivity", 3))

        detected = domain or kb.detect_domain(raw_prompt)
        budget, currency = kb.parse_budget(raw_prompt)
        if budget is None:
            raw_budget = inputs.get("budget")
            if raw_budget:
                try:
                    budget = int(str(raw_budget).replace(",", "").replace("₹", "").replace("$", "").strip())
                except ValueError:
                    budget = None

        uses = kb.extract_uses(raw_prompt) or ([inputs["primary_use"].lower()] if inputs.get("primary_use") else [])
        budget_sensitivity = kb.detect_budget_sensitivity(raw_prompt, budget_sensitivity)

        criteria = kb.adjust_criteria_weights(
            kb.get_domain_criteria(detected, raw_prompt),
            inputs,
            raw_prompt,
            budget_sensitivity,
            priorities,
        )

        questions = kb.get_clarifying_questions(detected, raw_prompt, inputs, budget)
        named = _split_named_options(raw_prompt)

        queries = [raw_prompt.strip()]
        if named:
            for opt in named:
                if detected in ("lifestyle", "travel"):
                    queries.append(f"{opt} cost of living quality of life IT jobs career 2026")
                elif detected in ("career", "business"):
                    queries.append(f"{opt} IT jobs tech companies salary growth 2026")
                elif detected == "technology":
                    queries.append(f"{opt} pros cons comparison benchmark performance 2026")
                elif detected == "education":
                    queries.append(f"{opt} ranking placements fees reviews 2026")
                elif detected == "finance":
                    queries.append(f"{opt} returns risk tax efficiency review 2026")
                else:
                    queries.append(f"{opt} review specifications pros cons 2026")
        else:
            budget_clause = f" under {currency or '₹'}{budget:,}" if budget else ""
            use_clause = f" for {', '.join(uses[:2])}" if uses else ""

            # Extract subject for realistic search queries
            clean_q = re.sub(r"^(?:which|what|should\s+i|choose\s+between|between|is|are|tell\s+me|give\s+me|compare)?\s*", "", raw_prompt, flags=re.IGNORECASE).strip(" ?!.,;:")

            if detected == "products":
                sub = "earbuds tws" if any(w in raw_prompt.lower() for w in ("buds", "earbud", "earbuds", "tws", "audio")) else ("laptops" if "laptop" in raw_prompt.lower() else "top choices")
                queries.append(f"best {sub}{budget_clause}{use_clause} 2026 reviews specifications")
                queries.append(f"top {sub}{budget_clause} comparison pros cons")
            elif detected == "education":
                queries.append(f"{clean_q} ranking placement fees cutoff 2026")
                queries.append(f"{clean_q} comparison reviews")
            elif detected in ("lifestyle", "career"):
                queries.append(f"{clean_q} top cities cost of living IT tech jobs salary 2026")
                queries.append(f"{clean_q} comparison pros cons")
            else:
                queries.append(f"{clean_q} best options {budget_clause} 2026 reviews")
                queries.append(f"{clean_q} comparison pros cons")

        return DecisionPlan(
            domain=detected,
            criteria=criteria,
            research_queries=[q for q in queries if q][:4],
            clarifying_questions=questions,
            options=[],
            option_templates=named,
            budget=budget,
            currency=currency,
            uses=uses,
            budget_sensitivity=budget_sensitivity,
            needs_input=any(q.get("required") for q in questions),
        )

    async def plan_dynamic(
        self,
        raw_prompt: str,
        domain: str | None,
        inputs: dict[str, str],
        user_prefs: dict | None = None,
        llm: LLMService | None = None,
    ) -> DecisionPlan:
        """Deep dynamic planner using Gemini AI to discover real-world options and criteria."""
        base_plan = self.plan(raw_prompt, domain, inputs, user_prefs)
        active_llm = llm or self.llm

        if active_llm and active_llm.is_available:
            try:
                ai_data = await active_llm.plan_decision(
                    raw_prompt=raw_prompt,
                    detected_domain=base_plan.domain,
                    budget=base_plan.budget,
                    currency=base_plan.currency,
                    uses=base_plan.uses,
                    user_prefs=user_prefs,
                )
                if ai_data and isinstance(ai_data, dict):
                    ai_domain = ai_data.get("domain") or base_plan.domain
                    ai_options = ai_data.get("options") or []
                    ai_criteria = ai_data.get("criteria") or []
                    ai_queries = ai_data.get("research_queries") or []

                    formatted_options = []
                    for opt in ai_options:
                        if isinstance(opt, dict) and opt.get("name"):
                            formatted_options.append({
                                "key": _slugify(opt["name"]),
                                "name": opt["name"],
                                "summary": opt.get("summary", ""),
                                "price_info": opt.get("price_info"),
                                "price_inr": opt.get("price_inr") or (base_plan.budget if base_plan.currency == "INR" else None),
                                "attrs": {},
                                "source_keys": [],
                            })

                    if formatted_options:
                        base_plan.options = formatted_options

                    if ai_criteria and len(ai_criteria) >= 3:
                        tot_weight = sum(c.get("weight", 0) for c in ai_criteria) or 100
                        norm_criteria = []
                        for c in ai_criteria:
                            w = round(c.get("weight", 20) / tot_weight * 100, 1)
                            norm_criteria.append({
                                "name": c.get("name", "Factor"),
                                "weight": w,
                                "description": c.get("description", ""),
                            })
                        base_plan.criteria = norm_criteria

                    if ai_queries:
                        base_plan.research_queries = [raw_prompt] + [q for q in ai_queries if q != raw_prompt][:3]

                    base_plan.domain = ai_domain
                    return base_plan
            except Exception as exc:  # noqa: BLE001
                import logging
                logging.getLogger("decisioniq.planner").warning("Dynamic Gemini planning failed: %s", exc)

        # Fallback when LLM is unavailable: use named options or curated baseline
        if not base_plan.options:
            if base_plan.option_templates:
                curated_fallbacks = kb.get_curated_fallback_options(
                    raw_prompt, base_plan.domain, base_plan.budget, base_plan.currency
                )
                curated_map = {}
                for e in curated_fallbacks:
                    curated_map[e.key.lower()] = e
                    curated_map[e.name.lower()] = e

                opts = []
                for name in base_plan.option_templates:
                    name_slug = _slugify(name)
                    name_lower = name.lower()
                    matched_kb = curated_map.get(name_slug) or curated_map.get(name_lower)
                    if not matched_kb:
                        name_words = set(re.findall(r"[a-z0-9]+", name_lower))
                        for e in curated_fallbacks:
                            e_words = set(re.findall(r"[a-z0-9]+", e.name.lower())) | set(e.key.lower().split("-"))
                            common = name_words & e_words
                            distinctive = [w for w in common if len(w) >= 4 and w not in ("university", "college", "institute", "technology", "city", "north", "south", "west", "east", "laptop", "phones")]
                            if distinctive:
                                matched_kb = e
                                break

                    if matched_kb:
                        opts.append(
                            {
                                "key": matched_kb.key,
                                "name": matched_kb.name if len(matched_kb.name) >= len(name) else name,
                                "summary": matched_kb.summary,
                                "price_info": matched_kb.price_info,
                                "price_inr": matched_kb.price_inr,
                                "attrs": dict(matched_kb.attrs),
                                "strengths": list(matched_kb.strengths),
                                "weaknesses": list(matched_kb.weaknesses),
                                "highlights": list(matched_kb.highlights),
                                "source_keys": list(matched_kb.source_keys),
                            }
                        )
                    else:
                        opts.append(
                            {
                                "key": name_slug,
                                "name": name,
                                "summary": f"Option evaluated from your query: {name}",
                                "price_info": f"~{base_plan.currency or '₹'}{base_plan.budget:,}" if base_plan.budget else None,
                                "price_inr": base_plan.budget if base_plan.currency == "INR" else None,
                                "attrs": {},
                                "source_keys": [],
                            }
                        )
                base_plan.options = opts
            else:
                fallback_entries = kb.get_curated_fallback_options(
                    raw_prompt, base_plan.domain, base_plan.budget, base_plan.currency
                )
                if fallback_entries:
                    base_plan.options = [
                        {
                            "key": e.key,
                            "name": e.name,
                            "summary": e.summary,
                            "price_info": e.price_info,
                            "price_inr": e.price_inr,
                            "attrs": e.attrs,
                            "strengths": e.strengths,
                            "weaknesses": e.weaknesses,
                            "highlights": e.highlights,
                            "source_keys": e.source_keys,
                        }
                        for e in fallback_entries
                    ]

        return base_plan