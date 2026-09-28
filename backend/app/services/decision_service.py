"""Decision service: CRUD, analysis pipeline persistence, follow-ups, saving."""
from __future__ import annotations

import logging
import re
import traceback
from datetime import datetime, timezone

from fastapi import BackgroundTasks, HTTPException
from sqlalchemy.orm import Session

from app.agents.orchestrator import DecisionOrchestrator, GenericOption
from app.models.decision import (
    Decision,
    DecisionDomain,
    DecisionStatus,
    DecisionInput,
    DecisionCriterion,
    Option,
    DecisionMessage,
)
from app.models.platform import AnalyticsEvent
from app.models.result import DecisionResult
from app.models.research import Source as SourceModel, Evidence as EvidenceModel
from app.models.saved import SavedDecision
from app.models.user import User
from app.schemas.decision import (
    DecisionDetailResponse,
    DecisionSummary,
    SourceSchema,
    EvidenceSchema,
    OptionSchema,
    CriterionSchema,
    MessageSchema,
    RecommendationSchema,
)
from app.services import knowledge_base as kb
from app.services.llm_service import LLMService
from app.services.search_service import get_provider

logger = logging.getLogger("decisioniq.decisions")


class DecisionService:
    def __init__(self, db: Session):
        self.db = db
        self.orchestrator = DecisionOrchestrator(get_provider())
        self.llm = LLMService()

    # ------------------------------------------------------------------
    # CRUD
    # ------------------------------------------------------------------

    def create_decision(
        self,
        user: User,
        raw_prompt: str,
        domain: str | None = None,
        answers: dict | None = None,
        research_depth: str | None = None,
    ) -> Decision:
        prefs = user.preferences
        depth = research_depth or (prefs.research_depth if prefs else "standard")
        title = raw_prompt.strip()[:240] or "Untitled decision"
        decision = Decision(
            user_id=user.id,
            title=title,
            raw_prompt=raw_prompt.strip(),
            domain=DecisionDomain(domain) if domain and domain in DecisionDomain.__members__.values() else DecisionDomain.OTHER,
            status=DecisionStatus.DRAFT,
            research_depth=depth,
        )
        self.db.add(decision)
        self.db.flush()
        for key, value in (answers or {}).items():
            if value not in (None, ""):
                self.db.add(DecisionInput(decision_id=decision.id, key=str(key), value=str(value)))
        self.db.commit()
        self.db.refresh(decision)
        self._log(user, "decision_created", decision.id)
        return decision

    def get(self, decision_id: str, user_id: str) -> Decision | None:
        return (
            self.db.query(Decision)
            .filter(Decision.id == decision_id, Decision.user_id == user_id)
            .first()
        )

    def list_for_user(self, user_id: str, limit: int = 50, offset: int = 0) -> tuple[list[DecisionSummary], int]:
        query = self.db.query(Decision).filter(Decision.user_id == user_id).order_by(Decision.created_at.desc())
        total = query.count()
        items = query.offset(offset).limit(limit).all()
        saved_ids = {s.decision_id for s in self.db.query(SavedDecision).filter(SavedDecision.user_id == user_id).all()}
        summaries = []
        for d in items:
            recommended = ""
            fit = None
            if d.result and d.options:
                winner = next((o for o in d.options if o.recommended), None)
                if winner:
                    recommended = winner.name
                fit = d.result.overall_fit_score
            summaries.append(
                DecisionSummary(
                    id=d.id,
                    title=d.title,
                    domain=d.domain.value if hasattr(d.domain, "value") else str(d.domain),
                    status=d.status.value if hasattr(d.status, "value") else str(d.status),
                    created_at=d.created_at,
                    updated_at=d.updated_at,
                    fit_score=fit,
                    recommended_title=recommended,
                    saved=d.id in saved_ids,
                )
            )
        return summaries, total

    def delete(self, decision_id: str, user_id: str) -> bool:
        d = self.get(decision_id, user_id)
        if not d:
            return False
        self.db.query(SavedDecision).filter(SavedDecision.decision_id == decision_id).delete()
        self.db.delete(d)
        self.db.commit()
        return True

    # ------------------------------------------------------------------
    # Analysis pipeline
    # ------------------------------------------------------------------

    def prepare_analysis(self, decision: Decision, user: User) -> dict:
        """Run the planner synchronously to decide whether clarifying input is needed."""
        inputs = {i.key: i.value for i in decision.inputs}
        prefs = {"priorities": user.preferences.priorities if user.preferences else [],
                 "budget_sensitivity": user.preferences.budget_sensitivity if user.preferences else 3}
        plan = self.orchestrator.planner.plan(decision.raw_prompt, None, inputs, prefs)
        decision.domain = DecisionDomain(plan.domain)
        decision.clarifying_questions = plan.clarifying_questions
        if plan.budget and "budget" not in inputs:
            self.db.add(DecisionInput(decision_id=decision.id, key="budget", value=str(plan.budget)))
        if plan.uses and "uses" not in inputs:
            self.db.add(DecisionInput(decision_id=decision.id, key="uses", value=",".join(plan.uses)))
        self.db.commit()
        return {
            "domain": plan.domain,
            "questions": plan.clarifying_questions,
            "needs_input": bool(plan.clarifying_questions),
            "budget": plan.budget,
        }

    def start_analysis(self, decision: Decision, user: User, background: BackgroundTasks) -> None:
        """Kick off the full pipeline in the background; UI polls decision state."""
        decision.status = DecisionStatus.ANALYZING
        decision.error = None
        decision.clarifying_questions = []
        from app.agents.planner import STAGE_LABELS
        decision.stages = [{**s, "status": "pending"} for s in STAGE_LABELS]
        self.db.commit()
        background.add_task(self._run_analysis_task, decision.id, user.id)

    def _run_analysis_task(self, decision_id: str, user_id: str) -> None:
        """Background task — own DB session, updates stages live."""
        from app.db.base import SessionLocal
        db = SessionLocal()
        try:
            decision = db.query(Decision).filter(Decision.id == decision_id).first()
            if not decision:
                return
            user = db.get(User, user_id)
            inputs = {i.key: i.value for i in decision.inputs}
            prefs = {
                "priorities": user.preferences.priorities if user and user.preferences else [],
                "budget_sensitivity": user.preferences.budget_sensitivity if user and user.preferences else 3,
            }

            def on_stage(key: str, status: str, detail: str | None = None):
                # Reassign a fresh list so the JSON column change is tracked
                # (in-place dict mutation would not persist on commit).
                decision.stages = [
                    {**s, "status": status, **({"detail": detail} if detail else {})}
                    if s.get("key") == key else dict(s)
                    for s in (decision.stages or [])
                ]
                decision.updated_at = datetime.now(timezone.utc)
                db.commit()

            user_api_key = None
            if user and user.preferences and user.preferences.extra:
                user_api_key = user.preferences.extra.get("gemini_api_key")

            report = None
            import asyncio

            async def _run():
                return await self.orchestrator.run(
                    decision.raw_prompt,
                    None,
                    inputs,
                    prefs,
                    depth=decision.research_depth,
                    on_stage=on_stage,
                    user_api_key=user_api_key,
                )

            report = asyncio.run(_run())
            self._persist_report(db, decision, report, inputs)
        except Exception as exc:  # noqa: BLE001
            logger.error("Analysis failed for %s: %s\n%s", decision_id, exc, traceback.format_exc())
            try:
                decision = db.query(Decision).filter(Decision.id == decision_id).first()
                if decision:
                    decision.status = DecisionStatus.FAILED
                    decision.error = str(exc)[:500]
                    db.commit()
            except Exception:  # noqa: BLE001
                db.rollback()
        finally:
            db.close()

    def _persist_report(self, db: Session, decision: Decision, report: dict, inputs: dict) -> None:
        # Re-analysis is idempotent: clear prior artifacts before re-inserting
        # (otherwise UNIQUE decision_results.decision_id trips on re-runs).
        db.query(DecisionResult).filter(DecisionResult.decision_id == decision.id).delete()
        db.query(DecisionCriterion).filter(DecisionCriterion.decision_id == decision.id).delete()
        db.query(Option).filter(Option.decision_id == decision.id).delete()
        db.query(SourceModel).filter(SourceModel.decision_id == decision.id).delete()
        db.query(EvidenceModel).filter(EvidenceModel.decision_id == decision.id).delete()
        db.flush()

        decision.domain = DecisionDomain(report["domain"])
        for c in report["criteria"]:
            db.add(
                DecisionCriterion(
                    decision_id=decision.id,
                    name=c["name"],
                    weight=float(c["weight"]),
                    description=c.get("description"),
                    position=c.get("position", 0),
                )
            )
        db.flush()

        # Sources first so evidence can link (deduped by URL)
        source_by_url: dict[str, SourceModel] = {}
        for s in report["sources"]:
            url = s.get("url", "")
            if url in source_by_url:
                continue
            src = SourceModel(
                decision_id=decision.id,
                title=s.get("title", "Source"),
                publisher=s.get("publisher"),
                url=url,
                domain_name=s.get("domain_name"),
                source_type=s.get("source_type"),
                snippet=s.get("snippet"),
                authority_score=float(s.get("authority_score", 0)),
                freshness_score=float(s.get("freshness_score", 0)),
                relevance_score=float(s.get("relevance_score", 0)),
                reliability_score=float(s.get("reliability_score", 0)),
                overall_score=float(s.get("overall_score", 0)),
                published_date=s.get("published_date"),
            )
            db.add(src)
            db.flush()
            source_by_url[url] = src

        option_by_key: dict[str, Option] = {}
        for o in report["options"]:
            opt = Option(
                decision_id=decision.id,
                key=o.get("key"),
                name=o["name"],
                summary=o.get("summary"),
                price_info=o.get("price_info"),
                price_inr=o.get("price_inr"),
                badge=o.get("badge"),
                highlights=o.get("highlights", []),
                strengths=o.get("strengths", []),
                weaknesses=o.get("weaknesses", []),
                risks=o.get("risks", []),
                criterion_scores=o.get("criterion_scores", []),
                fit_score=o.get("fit_score"),
                recommended=bool(o.get("recommended")),
                position=o.get("position", 0),
            )
            db.add(opt)
            db.flush()
            option_by_key[o["key"]] = opt

        for ev in report["evidence"]:
            source = None
            src_data = ev.get("source")
            if src_data and src_data.get("url") in source_by_url:
                source = source_by_url[src_data["url"]]
            elif src_data and src_data.get("title"):
                # KB sources share URLs per publisher — match by title fallback
                source = next(
                    (s for s in source_by_url.values() if s.title == src_data["title"]),
                    None,
                )
            opt = option_by_key.get(ev.get("option_key") or "")
            db.add(
                EvidenceModel(
                    decision_id=decision.id,
                    option_id=opt.id if opt else None,
                    source_id=source.id if source else None,
                    claim=ev.get("claim", ""),
                    snippet=ev.get("snippet"),
                    evidence_key=ev.get("evidence_key"),
                    confidence=ev.get("confidence"),
                    relevance_score=float(ev.get("relevance_score", 0)),
                    conflict=bool(ev.get("conflict")),
                )
            )
        db.flush()

        r = report["result"]
        winner = option_by_key.get(r.get("recommended_option_id"))
        result = DecisionResult(
            decision_id=decision.id,
            recommended_option_id=winner.id if winner else None,
            summary=r.get("summary", ""),
            reasoning=r.get("reasoning", ""),
            caveats=r.get("caveats"),
            confidence_score=r.get("confidence_score"),
            overall_fit_score=r.get("overall_fit_score"),
            what_could_change=r.get("what_could_change", []),
            next_steps=r.get("next_steps", []),
            trade_offs=r.get("trade_offs", []),
            assumptions=r.get("assumptions", []),
        )
        db.add(result)

        completed_keys = {stage["key"] for stage in report["stages"]}
        decision.stages = [
            {
                **dict(s),
                "status": "completed",
                "label": next(
                    (stage["label"] for stage in report["stages"] if stage["key"] == s.get("key")),
                    s.get("label", ""),
                ),
                "description": next(
                    (stage["description"] for stage in report["stages"] if stage["key"] == s.get("key")),
                    s.get("description", ""),
                ),
            }
            if s.get("key") in completed_keys else dict(s)
            for s in (decision.stages or [])
        ]

        decision.status = DecisionStatus.COMPLETED
        decision.error = None
        decision.updated_at = datetime.now(timezone.utc)
        db.commit()
        self._log_sync(db, None, "decision_completed", decision.id, {"fit": r.get("overall_fit_score")})

    # ------------------------------------------------------------------
    # Follow-up chat
    # ------------------------------------------------------------------

    async def follow_up(self, decision: Decision, user: User, message: str) -> tuple[str, bool, DecisionDetailResponse]:
        inputs = {i.key: i.value for i in decision.inputs}
        criteria = [
            {"id": c.id, "name": c.name, "weight": c.weight, "description": c.description, "position": c.position}
            for c in decision.criteria
        ]
        options = [
            GenericOption(
                key=o.key or _slug(o.name),
                name=o.name,
                summary=o.summary,
                price_info=o.price_info,
                price_inr=o.price_inr,
                attrs=_kb_attrs(decision.domain, o.key or o.name),
            )
            for o in decision.options
        ]
        evidence_by_option = _evidence_from_db(decision)

        changed = False
        reply = ""
        action = _classify_follow_up(message, [c["name"] for c in criteria])

        if action["type"] == "why":
            reply = _why_reply(decision)
        elif action["type"] == "budget":
            new_budget = action["value"]
            inputs["budget"] = str(new_budget)
            reply = f"Got it — I've updated your budget to ₹{new_budget:,} and re-scored every option against it."
            changed = True
        elif action["type"] == "compare_only":
            names = action["names"]
            # Keep only options whose name contains one of the requested terms.
            kept = [o for o in options if any(n.lower() in o.name.lower() for n in names)]
            if kept:
                options = kept
                inputs["compare_only"] = ",".join(names)
                reply = f"Comparing only {', '.join(names)}. Scores and recommendation are recomputed for this shortlist."
            else:
                reply = "I couldn't match those options by name. Try 'compare Acer and Dell', or 'show all options'."
            changed = bool(kept)
        elif action["type"] == "compare_top":
            fit_by_key = {o.key or _slug(o.name): o.fit_score or 0 for o in decision.options}
            top = sorted(options, key=lambda o: fit_by_key.get(o.key or _slug(o.name), 0), reverse=True)[:2]
            if len(top) >= 2:
                options = top
                inputs["compare_only"] = ",".join([o.name for o in top])
                reply = "Comparing only the top two options by current score. Recomputed below."
                changed = True
            else:
                reply = "There aren't enough scored options to compare yet."
        elif action["type"] == "show_all":
            inputs.pop("compare_only", None)
            reply = "Showing all options again with full scoring."
            changed = True
        elif action["type"] == "prioritize":
            criterion = action["criterion"]
            criteria = _bump_weight(criteria, criterion)
            inputs["priority_adjust"] = criterion
            reply = f"Understood — {criterion} now carries more weight. Recomputed below."
            changed = True
        elif action["type"] == "filter_os":
            constraint = action["value"]
            inputs["os_constraint"] = constraint
            options = [o for o in options if _os_allowed(o, constraint)]
            reply = f"Filtered to options compatible with {constraint}."
            changed = True
        else:
            llm_to_use = self.llm
            if user and user.preferences and user.preferences.extra and user.preferences.extra.get("gemini_api_key"):
                llm_to_use = LLMService(api_key=user.preferences.extra.get("gemini_api_key"))

            chat_context = {
                "title": decision.title,
                "domain": decision.domain.value if hasattr(decision.domain, "value") else str(decision.domain),
                "recommended_title": next((o.name for o in decision.options if o.recommended), ""),
                "options": [{"name": o.name} for o in decision.options],
                "criteria": [{"name": c.name} for c in decision.criteria],
            }
            history = [{"role": m.role, "content": m.content} for m in decision.messages[-6:]]

            ai_chat = await llm_to_use.follow_up_chat(chat_context, history, message) if llm_to_use.is_available else None
            if ai_chat and ai_chat.get("reply"):
                reply = ai_chat["reply"]
            else:
                llm_reply = await llm_to_use.complete(
                    "You are DecisionIQ, an AI decision partner. Answer concisely using the decision context.",
                    f"Decision: {decision.raw_prompt}\nUser follow-up: {message}",
                    max_tokens=350,
                ) if llm_to_use.is_available else None
                reply = llm_reply or _smart_local_reply(decision, message)

        if changed:
            if not options:
                changed = False
                reply = "There are no options to re-score yet — analysis may still be running."
            else:
                from types import SimpleNamespace

                claims = [
                    SimpleNamespace(
                        claim=ev.claim,
                        relevance_score=ev.relevance_score or 50,
                        confidence=ev.confidence or 0.5,
                        conflicting=ev.conflict,
                    )
                    for ev in decision.evidence
                ]
                sources = [{"overall_score": s.overall_score or 60} for s in decision.sources]
                report = self.orchestrator.recompute(
                    domain=decision.domain.value if hasattr(decision.domain, "value") else str(decision.domain),
                    criteria=criteria,
                    options=options,
                    evidence_by_option=evidence_by_option,
                    inputs=inputs,
                    budget=_budget_of(inputs),
                    uses=_uses_of(inputs),
                    sources=sources,
                    claims=claims,
                    conflict_warnings=[],
                )
                self._apply_recompute(decision, report, criteria)
                changed = report["result"].get("changed", False)

        # Persist chat messages
        self.db.add(DecisionMessage(decision_id=decision.id, role="user", content=message))
        self.db.add(
            DecisionMessage(decision_id=decision.id, role="assistant", content=reply, changed_recommendation=changed)
        )
        decision.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self._log(user, "follow_up", decision.id)

        return reply, changed, self.to_detail(decision, user.id)

    def reweight_criteria(self, decision: Decision, criteria_weights: dict[str, float], user_id: str) -> DecisionDetailResponse:
        """Dynamically reweight criteria and instantly recalculate all option fit scores and winner."""
        if not decision.criteria or not decision.options:
            return self.to_detail(decision, user_id)

        # Update criteria weights
        for c in decision.criteria:
            if c.id in criteria_weights:
                c.weight = max(0.0, float(criteria_weights[c.id]))
            elif c.name in criteria_weights:
                c.weight = max(0.0, float(criteria_weights[c.name]))

        total_weight = sum(c.weight for c in decision.criteria)
        if total_weight <= 0:
            total_weight = 1.0
            for c in decision.criteria:
                c.weight = 100.0 / len(decision.criteria)

        # Normalize to 100%
        for c in decision.criteria:
            c.weight = round((c.weight / total_weight) * 100.0, 1)

        crit_weight_map = {c.id: c.weight for c in decision.criteria}
        crit_name_weight_map = {c.name.lower(): c.weight for c in decision.criteria}

        # Recalculate fit score for each option
        best_option = None
        highest_fit = -1.0

        for opt in decision.options:
            scores = opt.criterion_scores or []
            weighted_sum = 0.0
            weight_used = 0.0

            for sc in scores:
                c_id = sc.get("criterionId")
                c_name = sc.get("name", "").lower()
                w = crit_weight_map.get(c_id) or crit_name_weight_map.get(c_name, 0.0)
                score_val = float(sc.get("score", 0.0))
                weighted_sum += (w / 100.0) * score_val
                weight_used += w

            if weight_used > 0:
                final_score = round(weighted_sum * (100.0 / weight_used), 1)
            else:
                final_score = opt.fit_score or 50.0

            opt.fit_score = min(100.0, max(0.0, final_score))
            if opt.fit_score > highest_fit:
                highest_fit = opt.fit_score
                best_option = opt

        # Update recommendation badges
        for opt in decision.options:
            if best_option and opt.id == best_option.id:
                opt.recommended = True
                opt.badge = "RECOMMENDED FIT"
            else:
                opt.recommended = False
                opt.badge = "ALTERNATIVE"

        # Update decision result summary if present
        if decision.result and best_option:
            decision.result.recommended_option_id = best_option.id
            decision.result.overall_fit_score = best_option.fit_score
            decision.result.summary = f"Based on your adjusted criteria weights, **{best_option.name}** is your optimal recommendation ({best_option.fit_score:.0f}/100 fit)."

        self.db.commit()
        self.db.refresh(decision)
        return self.to_detail(decision, user_id)

    def _apply_recompute(self, decision: Decision, report: dict, criteria: list) -> None:
        option_rows = {o.key or _slug(o.name): o for o in decision.options}
        winner_key = report["result"].get("recommended_option_id")
        for so in report["options"]:
            row = option_rows.get(so["key"]) or next(
                (o for o in decision.options if o.name == so["name"]), None
            )
            if not row:
                continue
            row.fit_score = so["fit_score"]
            row.criterion_scores = so["criterion_scores"]
            row.recommended = so["key"] == winner_key
            row.badge = "RECOMMENDED FIT" if so["key"] == winner_key else "ALTERNATIVE"
            row.strengths = so.get("strengths", row.strengths)
            row.weaknesses = so.get("weaknesses", row.weaknesses)
        for row in decision.criteria:
            match = next((c for c in criteria if c["name"] == row.name), None)
            if match:
                row.weight = float(match["weight"])
        r = report["result"]
        result = decision.result
        if result:
            old_winner = result.recommended_option_id
            winner_row = next(
                (o for o in decision.options if o.key == winner_key or o.name == _winner_name(report, winner_key)),
                None,
            )
            result.summary = r.get("summary", result.summary)
            result.reasoning = r.get("reasoning", result.reasoning)
            result.caveats = r.get("caveats", result.caveats)
            result.confidence_score = r.get("confidence_score", result.confidence_score)
            result.overall_fit_score = r.get("overall_fit_score", result.overall_fit_score)
            result.what_could_change = r.get("what_could_change", result.what_could_change)
            result.next_steps = r.get("next_steps", result.next_steps)
            result.trade_offs = r.get("trade_offs", result.trade_offs)
            result.assumptions = r.get("assumptions", result.assumptions)
            result.recommended_option_id = winner_row.id if winner_row else old_winner
            result.last_researched_at = datetime.now(timezone.utc)
            report["result"]["changed"] = bool(winner_row and old_winner and winner_row.id != old_winner)
        else:
            report["result"]["changed"] = False

    # ------------------------------------------------------------------
    # Saved decisions
    # ------------------------------------------------------------------

    def save(self, user_id: str, decision_id: str) -> bool:
        existing = (
            self.db.query(SavedDecision)
            .filter(SavedDecision.user_id == user_id, SavedDecision.decision_id == decision_id)
            .first()
        )
        if existing:
            return True
        self.db.add(SavedDecision(user_id=user_id, decision_id=decision_id))
        self.db.commit()
        self._log(None, "decision_saved", decision_id)
        return True

    def unsave(self, user_id: str, decision_id: str) -> None:
        self.db.query(SavedDecision).filter(
            SavedDecision.user_id == user_id, SavedDecision.decision_id == decision_id
        ).delete()
        self.db.commit()

    def saved_list(self, user_id: str) -> list[SavedDecision]:
        return (
            self.db.query(SavedDecision)
            .filter(SavedDecision.user_id == user_id)
            .order_by(SavedDecision.created_at.desc())
            .all()
        )

    # ------------------------------------------------------------------
    # Serialization
    # ------------------------------------------------------------------

    def to_detail(self, decision: Decision, user_id: str) -> DecisionDetailResponse:
        inputs = {i.key: i.value for i in decision.inputs}
        criteria = [
            CriterionSchema(id=c.id, name=c.name, weight=c.weight, description=c.description, position=c.position)
            for c in sorted(decision.criteria, key=lambda c: c.position)
        ]
        all_options = [
            OptionSchema(
                id=o.id,
                name=o.name,
                summary=o.summary,
                price_info=o.price_info,
                badge=o.badge,
                highlights=o.highlights or [],
                strengths=o.strengths or [],
                weaknesses=o.weaknesses or [],
                risks=o.risks or [],
                criterion_scores=o.criterion_scores or [],
                fit_score=o.fit_score,
                recommended=o.recommended,
                position=o.position,
            )
            for o in sorted(decision.options, key=lambda o: o.position)
        ]
        options = all_options

        compare_only = inputs.get("compare_only")
        if compare_only:
            keep = [n.strip().lower() for n in compare_only.split(",") if n.strip()]
            filtered = [
                o for o in all_options
                if any(k in o.name.lower() for k in keep)
            ]
            if filtered:
                options = filtered

        sources = [
            SourceSchema(
                id=s.id,
                title=s.title,
                publisher=s.publisher,
                url=s.url,
                domain_name=s.domain_name,
                source_type=s.source_type,
                snippet=s.snippet,
                authority_score=s.authority_score or 0,
                freshness_score=s.freshness_score or 0,
                relevance_score=s.relevance_score or 0,
                reliability_score=s.reliability_score or 0,
                overall_score=s.overall_score or 0,
                published_date=s.published_date,
                retrieved_date=s.retrieved_date,
            )
            for s in decision.sources
        ]
        source_by_id = {s.id: s for s in decision.sources}

        evidence = []
        for ev in decision.evidence:
            src = source_by_id.get(ev.source_id) if ev.source_id else None
            evidence.append(
                EvidenceSchema(
                    id=ev.id,
                    claim=ev.claim,
                    snippet=ev.snippet,
                    evidence_key=ev.evidence_key,
                    confidence=ev.confidence,
                    relevance_score=ev.relevance_score or 0,
                    conflict=ev.conflict,
                    source=SourceSchema(
                        id=src.id,
                        title=src.title,
                        publisher=src.publisher,
                        url=src.url,
                        domain_name=src.domain_name,
                        source_type=src.source_type,
                        snippet=src.snippet,
                        authority_score=src.authority_score or 0,
                        freshness_score=src.freshness_score or 0,
                        relevance_score=src.relevance_score or 0,
                        reliability_score=src.reliability_score or 0,
                        overall_score=src.overall_score or 0,
                        published_date=src.published_date,
                        retrieved_date=src.retrieved_date,
                    )
                    if src
                    else None,
                )
            )

        messages = [
            MessageSchema(
                id=m.id,
                role=m.role,
                content=m.content,
                changed_recommendation=m.changed_recommendation,
                created_at=m.created_at,
            )
            for m in sorted(decision.messages, key=lambda m: m.created_at)
        ]

        result = None
        if decision.result:
            r = decision.result
            result = RecommendationSchema(
                recommended_option_id=r.recommended_option_id,
                summary=r.summary,
                reasoning=r.reasoning,
                caveats=r.caveats,
                confidence_score=r.confidence_score,
                overall_fit_score=r.overall_fit_score,
                what_could_change=r.what_could_change or [],
                next_steps=r.next_steps or [],
                trade_offs=r.trade_offs or [],
                assumptions=r.assumptions or [],
            )

        saved = (
            self.db.query(SavedDecision)
            .filter(SavedDecision.user_id == user_id, SavedDecision.decision_id == decision.id)
            .first()
            is not None
        )

        return DecisionDetailResponse(
            id=decision.id,
            title=decision.title,
            domain=decision.domain.value if hasattr(decision.domain, "value") else str(decision.domain),
            status=decision.status.value if hasattr(decision.status, "value") else str(decision.status),
            raw_prompt=decision.raw_prompt,
            research_depth=decision.research_depth,
            stages=decision.stages or [],
            clarifying_questions=decision.clarifying_questions or [],
            error=decision.error,
            created_at=decision.created_at,
            updated_at=decision.updated_at,
            inputs=inputs,
            criteria=criteria,
            options=options,
            sources=sources,
            evidence=evidence,
            messages=messages,
            result=result,
            saved=saved,
        )

    # ------------------------------------------------------------------

    def _log(self, user: User | None, event_type: str, decision_id: str | None, payload: dict | None = None):
        try:
            self.db.add(
                AnalyticsEvent(
                    user_id=user.id if user else None,
                    event_type=event_type,
                    decision_id=decision_id,
                    payload=payload or {},
                )
            )
            self.db.commit()
        except Exception:  # noqa: BLE001
            self.db.rollback()

    def _log_sync(self, db: Session, user_id: str | None, event_type: str, decision_id: str | None, payload: dict | None = None):
        try:
            db.add(
                AnalyticsEvent(
                    user_id=user_id,
                    event_type=event_type,
                    decision_id=decision_id,
                    payload=payload or {},
                )
            )
            db.commit()
        except Exception:  # noqa: BLE001
            db.rollback()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or "option"


def _kb_attrs(domain, key_or_name: str) -> dict:
    if hasattr(domain, "value"):
        domain = domain.value
    for entry in kb.get_domain_options(domain):
        if entry.key == key_or_name or entry.name.lower() == key_or_name.lower():
            return entry.attrs
    return {}


def _evidence_from_db(decision: Decision) -> dict[str, list]:
    by_key: dict[str, list] = {}
    for ev in decision.evidence:
        key = ev.option.key if ev.option else "_general"
        by_key.setdefault(key, []).append(
            {
                "claim": ev.claim,
                "snippet": ev.snippet,
                "confidence": ev.confidence,
                "relevance_score": ev.relevance_score or 0,
                "conflict": ev.conflict,
            }
        )
    return by_key


def _budget_of(inputs: dict) -> int | None:
    raw = inputs.get("budget")
    if not raw:
        return None
    try:
        return int(str(raw).replace(",", "").replace("₹", "").strip())
    except (ValueError, TypeError):
        return None


def _uses_of(inputs: dict) -> list[str]:
    raw = inputs.get("uses")
    if not raw:
        return []
    return [u.strip() for u in str(raw).split(",") if u.strip()]


def _winner_name(report: dict, winner_key: str | None) -> str:
    for so in report.get("options", []):
        if so.get("key") == winner_key:
            return so.get("name", "")
    return ""


_FILLER_WORDS = {"the", "only", "options", "option", "them", "all", "both", "and", "vs", "top", "two"}


def _classify_follow_up(message: str, criteria_names: list[str]) -> dict:
    text = message.lower()

    budget_m = re.search(
        r"(?:budget|under|within|max(?:imum)?(?: price| budget)?)\s*(?:is|to|of|at|now)?\s*(?:₹|rs\.?|inr)?\s*([\d,]+)",
        text,
    )
    if budget_m and any(w in text for w in ("budget", "under", "within", "max", "price")):
        return {"type": "budget", "value": int(budget_m.group(1).replace(",", ""))}

    if any(w in text for w in ("why", "explain", "reason", "how did you", "why did", "how come", "justify")):
        return {"type": "why"}

    if "show all" in text or "all options" in text or "list all" in text:
        return {"type": "show_all"}

    if "compare" in text or "vs" in text or "versus" in text:
        compare_m = re.search(r"(?:compare(?: only)?|vs\.?|versus)\s+(.+?)(?:\s*$)", text)
        raw = compare_m.group(1) if compare_m else ""
        if re.search(r"top\s+(?:two|2)", text):
            return {"type": "compare_top"}
        if re.search(r"(?:top two|top 2|first two|first 2)", text):
            return {"type": "compare_top"}
        names = []
        if raw:
            parts = re.split(r"\s*(?:and|,|vs\.?|versus|&)\s*", raw)
            names = [
                n.strip().strip("?.,!:")
                for n in parts
                if n.strip() and n.strip().lower() not in _FILLER_WORDS
            ]
        return {"type": "compare_only", "names": names[:4]}

    mentioned = [name for name in criteria_names if name.lower() in text]
    if mentioned and any(
        w in text for w in ("prioritize", "prioritise", "more important", "weight", "care more", "focus", "rank by", "sort by")
    ):
        # "prioritize X over Y" → bump X (the criterion before "over").
        over_pos = text.find(" over ")
        if over_pos != -1:
            before = [name for name in mentioned if text.find(name.lower()) < over_pos]
            if before:
                return {"type": "prioritize", "criterion": before[-1]}
        return {"type": "prioritize", "criterion": mentioned[-1]}

    if "linux" in text and any(w in text for w in ("only", "need", "want", "prefer", "use")):
        return {"type": "filter_os", "value": "Linux"}
    if "macos" in text or ("mac" in text and any(w in text for w in ("only", "need", "want", "prefer", "use"))):
        return {"type": "filter_os", "value": "macOS"}
    if "windows" in text and any(w in text for w in ("only", "need", "want", "prefer", "use")):
        return {"type": "filter_os", "value": "Windows"}

    return {"type": "chat"}


def _why_reply(decision: Decision) -> str:
    r = decision.result
    if not r:
        return "Analysis is still running — check back in a moment."
    winner = next((o for o in decision.options if o.id == r.recommended_option_id), None)
    name = winner.name if winner else "the recommended option"
    fit = r.overall_fit_score or 0
    lines = [f"**{name}** was recommended because it scored highest overall ({fit:.0f}/100)."]
    if r.reasoning:
        lines.append(r.reasoning)
    if winner and winner.strengths:
        top_strengths = winner.strengths[:3]
        lines.append("**Top strengths:** " + " · ".join(top_strengths))
    if winner and winner.criterion_scores:
        top_scores = sorted(winner.criterion_scores, key=lambda s: s.get("score", 0), reverse=True)[:3]
        score_strs = [f"{s.get('name', '?')} ({s.get('score', 0):.0f}/100)" for s in top_scores]
        lines.append("**Highest criteria scores:** " + ", ".join(score_strs))
    if r.caveats:
        lines.append(f"**Caveats:** {r.caveats}")
    return "\n\n".join(lines)


def _smart_local_reply(decision: Decision, message: str) -> str:
    """Generate a context-aware reply from decision data without requiring LLM."""
    text = message.lower().strip()
    opts = sorted(decision.options, key=lambda o: o.fit_score or 0, reverse=True)
    criteria = decision.criteria
    r = decision.result
    winner = next((o for o in opts if o.recommended), opts[0] if opts else None)

    # --- Trade-off / risk questions ---
    if any(w in text for w in ("trade-off", "tradeoff", "trade off", "risk", "downside", "disadvantage", "weakness", "concern", "problem", "issue", "bad")):
        lines = ["**Key trade-offs and risks to consider:**"]
        for opt in opts[:3]:
            weaknesses = opt.weaknesses or []
            risks = opt.risks or []
            if weaknesses or risks:
                all_issues = (weaknesses + risks)[:3]
                lines.append(f"• **{opt.name}**: " + " · ".join(all_issues))
        if r and r.trade_offs:
            lines.append("\n**Analysis trade-offs:**")
            for t in r.trade_offs[:3]:
                lines.append(f"• {t}")
        if len(lines) == 1:
            lines.append("No major risks were flagged. Review source evidence for specific caveats.")
        return "\n".join(lines)

    # --- Comparison questions ---
    if any(w in text for w in ("best", "top", "winner", "recommend", "which one", "choose", "pick", "select")):
        if winner:
            lines = [f"**Best choice: {winner.name}** ({winner.fit_score or 0:.0f}/100 fit score)"]
            if r and r.summary:
                lines.append(r.summary)
            elif winner.strengths:
                lines.append("**Why:** " + " · ".join(winner.strengths[:3]))
            if len(opts) > 1:
                runner_up = opts[1]
                lines.append(f"\n**Runner-up: {runner_up.name}** ({runner_up.fit_score or 0:.0f}/100)")
                if runner_up.strengths:
                    lines.append("Advantage: " + runner_up.strengths[0])
            return "\n".join(lines)

    # --- Score / ranking questions ---
    if any(w in text for w in ("score", "rank", "rating", "point", "number", "how much", "comparison", "table")):
        lines = ["**Option rankings by fit score:**"]
        for i, opt in enumerate(opts, 1):
            lines.append(f"{i}. **{opt.name}** — {opt.fit_score or 0:.0f}/100")
            if opt.criterion_scores:
                top = sorted(opt.criterion_scores, key=lambda s: s.get("score", 0), reverse=True)[:2]
                if top:
                    detail = ", ".join(f"{s.get('name','?')}: {s.get('score',0):.0f}" for s in top)
                    lines.append(f"   Best at: {detail}")
        return "\n".join(lines)

    # --- Pros / strengths questions ---
    if any(w in text for w in ("pros", "strength", "advantage", "good", "benefit", "positive", "plus")):
        lines = ["**Strengths by option:**"]
        for opt in opts:
            strengths = opt.strengths or opt.highlights or []
            if strengths:
                lines.append(f"• **{opt.name}**: " + " · ".join(strengths[:3]))
        return "\n".join(lines) if len(lines) > 1 else "Detailed strengths were not captured in this analysis."

    # --- Criteria questions ---
    if any(w in text for w in ("criteria", "factor", "weight", "what matters", "how scored", "how evaluated")):
        lines = ["**Evaluation criteria used (weighted importance):**"]
        for c in sorted(criteria, key=lambda c: c.weight, reverse=True):
            lines.append(f"• **{c.name}** — {c.weight:.0f}% weight")
            if c.description:
                lines.append(f"  *{c.description}*")
        lines.append("\nYou can adjust these weights using the slider panel to re-rank results.")
        return "\n".join(lines)

    # --- Budget / cost questions ---
    if any(w in text for w in ("cost", "price", "expensive", "cheap", "affordable", "money", "budget", "spend")):
        lines = ["**Cost comparison:**"]
        for opt in opts:
            price = opt.price_info or (f"~₹{opt.price_inr:,}" if opt.price_inr else "Not specified")
            lines.append(f"• **{opt.name}**: {price}")
        if r and r.caveats:
            lines.append(f"\n**Note:** {r.caveats}")
        return "\n".join(lines)

    # --- What could change / scenario questions ---
    if any(w in text for w in ("what if", "scenario", "change", "different", "instead", "alternative", "switch")):
        lines = []
        if r and r.what_could_change:
            lines.append("**Scenarios that could change the recommendation:**")
            for wcc in r.what_could_change[:3]:
                lines.append(f"• {wcc}")
        if len(opts) > 1:
            alt = next((o for o in opts if not o.recommended), None)
            if alt:
                lines.append(f"\n**{alt.name}** would become top if priorities shift toward: " + (" or ".join(alt.strengths[:2]) if alt.strengths else "different criteria"))
        if not lines:
            lines.append("Try adjusting criteria weights with the slider panel to model different priorities.")
        return "\n".join(lines)

    # --- Next steps questions ---
    if any(w in text for w in ("next step", "what should", "action", "do next", "proceed", "how to")):
        lines = []
        if r and r.next_steps:
            lines.append("**Recommended next steps:**")
            for step in r.next_steps[:4]:
                lines.append(f"• {step}")
        else:
            lines.append(f"**Suggested next steps for '{winner.name if winner else 'your choice'}':**")
            lines.append("• Research current pricing and availability")
            lines.append("• Read recent user reviews from verified sources")
            lines.append("• Compare against any new options released since this analysis")
        return "\n".join(lines)

    # --- Generic intelligent fallback using all available data ---
    if winner:
        lines = [
            f"Based on the analysis, **{winner.name}** is the top recommendation "
            f"({winner.fit_score or 0:.0f}/100 fit score)."
        ]
        if winner.summary:
            lines.append(winner.summary)
        if winner.strengths:
            lines.append("**Strengths:** " + " · ".join(winner.strengths[:3]))
        if len(opts) > 1:
            all_names = ", ".join(f"{o.name} ({o.fit_score or 0:.0f}pts)" for o in opts)
            lines.append(f"\n**All options ranked:** {all_names}")
        lines.append(
            "\nTry asking: *why did it win?* · *trade-offs?* · *compare X and Y* · "
            "*what if budget is ₹X?* · *show all scores*"
        )
        return "\n\n".join(lines)

    return (
        "Analysis data is not yet available. Please wait for the analysis to complete, "
        "then ask about trade-offs, scores, why an option won, or next steps."
    )


def _bump_weight(criteria: list[dict], criterion_name: str) -> list[dict]:
    out = []
    for c in criteria:
        w = float(c["weight"])
        if c["name"].lower() == criterion_name.lower():
            w += 10
        out.append({**c, "weight": w})
    total = sum(c["weight"] for c in out) or 1
    return [{**c, "weight": round(c["weight"] / total * 100, 1)} for c in out]


def _os_allowed(option, constraint: str) -> bool:
    name = option.name.lower()
    summary = (option.summary or "").lower()
    text = f"{name} {summary}"
    if constraint.lower() == "macos":
        return "mac" in text or "apple" in text
    if constraint.lower() == "windows":
        return "windows" in text or not any(k in text for k in ("macos", "macbook", "apple"))
    if constraint.lower() == "linux":
        return True  # most laptops run Linux; filter only excludes nothing here
    return True