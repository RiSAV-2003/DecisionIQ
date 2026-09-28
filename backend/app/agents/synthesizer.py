"""Decision Synthesizer — produces the final, explainable DecisionResult.

Confidence is computed from evidence coverage + source quality + conflicts —
never from vibes, and never claiming absolute certainty.
"""
from __future__ import annotations


class DecisionSynthesizer:
    def synthesize(
        self,
        scored_options: list,
        criteria: list[dict],
        analysis: dict[str, dict],
        sources: list,
        claims: list,
        conflict_warnings: list[str],
        inputs: dict,
        budget: int | None = None,
        uses: list[str] | None = None,
    ) -> dict:
        if not scored_options:
            return {
                "recommended_option_id": None,
                "summary": "We couldn't identify comparable options yet.",
                "reasoning": "No options were available to compare.",
                "caveats": "Add more detail and try again.",
                "confidence_score": 0,
                "overall_fit_score": 0,
                "what_could_change": [],
                "next_steps": ["Refine your question", "Provide more constraints"],
                "trade_offs": [],
                "assumptions": [],
            }

        winner = scored_options[0]
        runner_up = scored_options[1] if len(scored_options) > 1 else None

        # ---- confidence -------------------------------------------------
        evidence_count = sum(1 for c in claims if c.relevance_score > 40)
        avg_source_score = (
            sum(s.get("overall_score") or 0 for s in sources) / len(sources) if sources else 0
        )
        coverage = min(1.0, evidence_count / 12)
        agreement = max(0.0, 1.0 - len(conflict_warnings) * 0.12)
        confidence = round(
            min(
                0.95,
                0.55 + coverage * 0.3 + (avg_source_score / 100) * 0.1 + agreement * 0.05,
            ),
            2,
        )
        confidence_label = (
            "High" if confidence >= 0.8 else ("Medium" if confidence >= 0.6 else "Low")
        )

        # ---- reasoning --------------------------------------------------
        top_criteria = sorted(criteria, key=lambda c: c["weight"], reverse=True)[:3]
        crit_scores = {s["name"]: s["score"] for s in winner.criterion_scores}
        reasoning_parts = [
            f"{winner.name} scores {winner.fit_score:.0f}/100, ahead of "
            f"{runner_up.name} ({runner_up.fit_score:.0f}/100) when your criteria are weighted."
        ]
        for c in top_criteria:
            score = crit_scores.get(c["name"], 50)
            reasoning_parts.append(
                f"On {c['name'].lower()} (weight {c['weight']:.0f}%), it scores {score:.0f}/100."
            )
        strengths = analysis.get(winner.key, {}).get("strengths", [])
        if strengths:
            reasoning_parts.append(f"Key strengths: {strengths[0].lower()}.")

        # ---- caveats / trade-offs / what could change -------------------
        weaknesses = analysis.get(winner.key, {}).get("weaknesses", [])
        caveats = "; ".join(weaknesses[:2]) if weaknesses else (
            "No major weaknesses surfaced in the current evidence."
        )
        trade_offs = []
        if runner_up:
            trade_offs.append(
                f"Choosing {winner.name} means giving up {runner_up.name}'s edge on "
                + _best_criterion(runner_up)
            )
        for w in weaknesses[:2]:
            trade_offs.append(w)
        if budget and winner.price_inr and winner.price_inr > budget:
            trade_offs.append(
                f"{winner.name} slightly exceeds your stated budget of ₹{budget:,}."
            )

        what_could_change = [
            "If your budget changes materially, the price weighting shifts and so may the winner.",
            "If a new option enters your shortlist, scores are recomputed transparently.",
            "If your priorities change (e.g. performance over price), weights update automatically.",
        ]
        if conflict_warnings:
            what_could_change.insert(0, "Conflicting claims were flagged and both sides shown — newer, higher-authority evidence could tip the balance.")

        next_steps = [
            "Re-verify the top 1–2 options' live prices before purchasing.",
            "Ask me a follow-up, e.g. 'compare A and B only' or 'what if my budget changes?'",
            "Check the evidence sources below and read the top 2 in full.",
        ]

        assumptions = [
            "Prices are approximate street prices (India, 2026) — verify live listings.",
            "Scores use the criteria and weights you can see — nothing is hidden.",
            f"Research depth: {inputs.get('research_depth', 'standard')}.",
        ]

        summary = (
            f"Based on your priorities, **{winner.name}** is the strongest fit "
            f"({winner.fit_score:.0f}/100), with {confidence_label} confidence. "
            f"{strengths[0] if strengths else 'It leads on the criteria that matter most to you.'} "
            "You make the final call — this analysis is your evidence, not your verdict."
        )

        return {
            "recommended_option_id": winner.key,
            "summary": summary,
            "reasoning": " ".join(reasoning_parts),
            "caveats": caveats,
            "confidence_score": confidence,
            "confidence_label": confidence_label,
            "overall_fit_score": winner.fit_score,
            "what_could_change": what_could_change,
            "next_steps": next_steps,
            "trade_offs": trade_offs,
            "assumptions": assumptions,
        }


def _best_criterion(option) -> str:
    if not option.criterion_scores:
        return "its overall score"
    best = max(option.criterion_scores, key=lambda s: s["score"])
    return f"{best['name'].lower()} ({best['score']:.0f}/100)"