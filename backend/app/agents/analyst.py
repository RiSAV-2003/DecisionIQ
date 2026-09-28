"""Analysis Agent — identifies trade-offs, pros/cons, and risks per option.

For knowledge-base options the curated strengths/weaknesses/risks are used.
For generic options, pros/cons are derived from the criterion scores that are
significantly above/below the option's own average.
"""


class AnalysisAgent:
    def analyze(self, scored_options: list, kb_by_key: dict) -> dict[str, dict]:
        out: dict[str, dict] = {}
        for so in scored_options:
            kb = kb_by_key.get(so.key)
            if kb:
                out[so.key] = {
                    "highlights": list(kb.highlights or []),
                    "strengths": list(kb.strengths or []),
                    "weaknesses": list(kb.weaknesses or []),
                    "risks": list(kb.risks or []),
                }
                continue

            scores = {s["name"]: s["score"] for s in so.criterion_scores}
            if not scores:
                out[so.key] = {"highlights": [], "strengths": [], "weaknesses": [], "risks": []}
                continue
            avg = sum(scores.values()) / len(scores)
            ordered = sorted(scores.items(), key=lambda kv: kv[1], reverse=True)
            strengths = [
                f"Strong on {name} ({score:.0f}/100) — a top factor in your scoring"
                for name, score in ordered[:2]
                if score >= avg + 8
            ]
            weaknesses = [
                f"Below average on {name} ({score:.0f}/100)"
                for name, score in ordered[-2:]
                if score <= avg - 8
            ]
            out[so.key] = {
                "highlights": [],
                "strengths": strengths or ["Balanced across your criteria"],
                "weaknesses": weaknesses or ["No major weak spots found in current evidence"],
                "risks": ["Limited source coverage — scores may change as more evidence is found"],
            }
        return out