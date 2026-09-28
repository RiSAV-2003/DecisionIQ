"""LLM integration supporting Google Gemini (free tier via Google AI Studio)
and OpenAI-compatible chat completions APIs.

Provides structured decision intelligence:
- Dynamic option extraction from prompt (no static/mock lists)
- Custom criteria weighting
- Targeted research query generation
- Evidence-based scoring and rationale notes
- Synthesis, pros/cons, trade-offs, and follow-up conversation
"""
from __future__ import annotations

import json
import logging
import re
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger("decisioniq.llm")


class LLMService:
    def __init__(self, api_key: str | None = None, model: str | None = None, base_url: str | None = None) -> None:
        self.api_key = api_key or settings.effective_ai_key
        self.model = model or settings.AI_MODEL or "gemini-1.5-flash"
        self.base_url = (base_url or settings.AI_BASE_URL).rstrip("/")
        self.timeout = httpx.Timeout(30.0)

    @property
    def is_available(self) -> bool:
        return bool(self.api_key)

    async def complete(
        self,
        system: str,
        user: str,
        *,
        json_mode: bool = False,
        max_tokens: int = 2000,
        temperature: float = 0.2,
    ) -> str | None:
        """Call LLM completions endpoint (Gemini via OpenAI-compatible or Google API)."""
        if not self.is_available:
            return None

        clean_model = self.model.replace("models/", "")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ]

        body: dict[str, Any] = {
            "model": clean_model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if json_mode:
            body["response_format"] = {"type": "json_object"}

        # First attempt: OpenAI-compatible endpoint
        endpoints_to_try = [
            f"{self.base_url}/chat/completions",
            "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        ]

        for url in endpoints_to_try:
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.post(url, headers=headers, json=body)
                    if resp.status_code == 200:
                        data = resp.json()
                        choices = data.get("choices", [])
                        if choices:
                            return choices[0]["message"]["content"]
                    else:
                        logger.warning("LLM call to %s returned %s: %s", url, resp.status_code, resp.text[:200])
            except Exception as exc:  # noqa: BLE001
                logger.warning("LLM connection attempt to %s failed: %s", url, exc)

        # Fallback to direct Gemini v1beta native REST API if base_url fails
        models_to_try = [clean_model]
        for m in ("gemini-2.0-flash", "gemini-1.5-flash", "gemini-2.5-flash"):
            if m not in models_to_try:
                models_to_try.append(m)

        for m_name in models_to_try:
            try:
                native_url = f"https://generativelanguage.googleapis.com/v1beta/models/{m_name}:generateContent?key={self.api_key}"
                native_payload = {
                    "contents": [
                        {"role": "user", "parts": [{"text": f"{system}\n\nUser request:\n{user}"}]}
                    ],
                    "generationConfig": {
                        "temperature": temperature,
                        "maxOutputTokens": max_tokens,
                    }
                }
                if json_mode:
                    native_payload["generationConfig"]["responseMimeType"] = "application/json"

                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.post(native_url, json=native_payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            if parts:
                                return parts[0].get("text", "")
                    else:
                        logger.warning("Native Gemini API call for %s returned %s: %s", m_name, resp.status_code, resp.text[:200])
            except Exception as exc:  # noqa: BLE001
                logger.warning("Native Gemini call for %s failed: %s", m_name, exc)

        return None

    async def complete_json(self, system: str, user: str, **kwargs) -> dict | None:
        """Call LLM and parse JSON response safely."""
        raw = await self.complete(system, user, json_mode=True, **kwargs)
        if not raw:
            return None
        return _clean_and_parse_json(raw)

    async def plan_decision(
        self,
        raw_prompt: str,
        detected_domain: str,
        budget: int | None,
        currency: str | None,
        uses: list[str],
        user_prefs: dict | None = None,
    ) -> dict | None:
        """Dynamically extract options, tailored criteria, and research queries for ANY decision."""
        system_prompt = (
            "You are an objective, world-class Decision Intelligence Architect. "
            "Given a user's decision question, identify genuine real-world options, "
            "determine custom evaluation criteria with normalized weights (totaling 100), "
            "and create targeted web research queries to gather verified facts. "
            "Return ONLY a valid JSON object matching the requested schema."
        )

        user_content = f"""User Decision Prompt: "{raw_prompt}"
Detected Category: {detected_domain}
Stated Budget: {budget} {currency or 'INR'}
Primary Uses/Constraints: {', '.join(uses) if uses else 'Not specified'}
User Preferences: {json.dumps(user_prefs or {})}

Schema required:
{{
  "domain": "products" | "education" | "finance" | "career" | "travel" | "lifestyle" | "business" | "technology" | "other",
  "options": [
    {{
      "name": "Full, specific real-world option name (e.g. Acer Nitro V 15 or Sony WH-1000XM5)",
      "summary": "1-2 sentence real-world summary of what this option is and its target user",
      "price_info": "Estimated real market price/cost if applicable (e.g. ~₹68,990 or $350)",
      "price_inr": integer approximate INR value if applicable, else null
    }}
  ],
  "criteria": [
    {{
      "name": "Specific Criterion Name (e.g. Battery Life, Build Quality, ROI, Ease of Use)",
      "weight": integer percentage (must sum to exactly 100 across all criteria),
      "description": "Why this criterion matters for this decision"
    }}
  ],
  "research_queries": [
    "Targeted web search query 1 to find reviews, benchmarks, official specs, or pricing",
    "Targeted web search query 2"
  ]
}}

Ensure 3 to 6 distinct, top-contending real-world options are provided."""

        return await self.complete_json(system_prompt, user_content, max_tokens=1800, temperature=0.1)

    async def evaluate_options_with_evidence(
        self,
        raw_prompt: str,
        options: list[dict],
        criteria: list[dict],
        evidence_snippets: list[str],
        budget: int | None = None,
    ) -> dict | None:
        """Score each option (0-100) on each criterion with evidence-backed notes."""
        system_prompt = (
            "You are an impartial Decision Intelligence Comparator. "
            "Score each option against each criterion from 0 to 100 based on verified facts, "
            "specs, and evidence. Provide a transparent 1-sentence note for every score explaining the rating. "
            "Return ONLY valid JSON."
        )

        user_content = f"""Decision Question: "{raw_prompt}"
Budget: {budget if budget else 'Flexible'}

Options to evaluate:
{json.dumps(options, indent=2)}

Criteria to score:
{json.dumps(criteria, indent=2)}

Research Evidence Collected:
{json.dumps(evidence_snippets[:15], indent=2)}

Schema required:
{{
  "evaluations": [
    {{
      "option_name": "exact name of option",
      "scores": {{
        "Criterion Name": integer score 0-100
      }},
      "notes": {{
        "Criterion Name": "Specific reason and technical fact justifying this score"
      }},
      "highlights": ["Key stand-out feature 1", "Key feature 2"],
      "strengths": ["Top strength with specific detail", "Second strength"],
      "weaknesses": ["Clear limitation or trade-off", "Second drawback"],
      "risks": ["Potential risk or caveat to watch out for"]
    }}
  ]
}}"""

        return await self.complete_json(system_prompt, user_content, max_tokens=2200, temperature=0.1)

    async def synthesize_recommendation(
        self,
        raw_prompt: str,
        ranked_options: list[dict],
        criteria: list[dict],
        analysis: dict,
        budget: int | None = None,
    ) -> dict | None:
        """Synthesize an executive summary, rationale, trade-offs, and actionable next steps."""
        if not ranked_options:
            return None

        system_prompt = (
            "You are an executive Decision Intelligence Advisor. "
            "Write an articulate, balanced, and evidence-grounded recommendation. "
            "Explain exactly why the top option wins, what trade-offs the user must accept, "
            "what assumptions were made, and what conditions would change the recommendation. "
            "Return ONLY valid JSON."
        )

        user_content = f"""Decision Question: "{raw_prompt}"
Budget: {budget}
Ranked Options (Top 3):
{json.dumps(ranked_options[:3], indent=2)}

Criteria:
{json.dumps(criteria, indent=2)}

Schema required:
{{
  "summary": "1-2 sentence crisp executive summary declaring the top recommendation and primary reason",
  "reasoning": "Detailed 3-4 sentence rationale explaining why the winner edges out the competition based on weighted priorities",
  "caveats": "Important limitations or things to check before purchasing/deciding",
  "trade_offs": [
    "Specific trade-off 1 (e.g. by choosing X, you trade away longer battery life for peak GPU wattage)",
    "Specific trade-off 2"
  ],
  "assumptions": [
    "Key assumption made (e.g. Assumes street pricing remains within 10% of listed price)",
    "Key assumption 2"
  ],
  "what_could_change": [
    "Condition that would favor Option 2 instead (e.g. If portability and battery life are prioritized over raw rendering speed, Option B becomes the better choice)"
  ],
  "next_steps": [
    "Immediate actionable verification step 1",
    "Step 2",
    "Step 3"
  ]
}}"""

        return await self.complete_json(system_prompt, user_content, max_tokens=1500, temperature=0.2)

    async def follow_up_chat(
        self,
        decision_context: dict,
        chat_history: list[dict],
        user_message: str,
    ) -> dict | None:
        """Answer follow-up questions about a decision report with contextual grounding."""
        system_prompt = (
            "You are DecisionIQ's AI advisor. The user is asking follow-up questions about their generated "
            "decision report. Give clear, direct, and fact-grounded responses. If the user suggests a change in "
            "constraints (e.g., budget change or priority shift), explain how the rankings and recommendation would change."
        )

        context_summary = f"""Decision Title: {decision_context.get('title')}
Category: {decision_context.get('domain')}
Current Recommended: {decision_context.get('recommended_title')}
Options: {json.dumps([o.get('name') for o in decision_context.get('options', [])])}
Criteria: {json.dumps([c.get('name') for c in decision_context.get('criteria', [])])}
"""

        messages_payload = [
            {"role": "system", "content": f"{system_prompt}\n\nContext:\n{context_summary}"}
        ]
        for msg in chat_history[-6:]:
            messages_payload.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})
        messages_payload.append({"role": "user", "content": user_message})

        clean_model = self.model.replace("models/", "")
        body = {
            "model": clean_model,
            "messages": messages_payload,
            "temperature": 0.3,
            "max_tokens": 800,
        }

        for url in [
            f"{self.base_url}/chat/completions",
            "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        ]:
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.post(
                        url,
                        headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
                        json=body,
                    )
                    if resp.status_code == 200:
                        content = resp.json()["choices"][0]["message"]["content"]
                        return {"reply": content}
            except Exception as exc:  # noqa: BLE001
                logger.warning("Follow-up chat call to %s failed: %s", url, exc)

        return None


def _clean_and_parse_json(text: str) -> dict | None:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    try:
        return json.loads(cleaned)
    except Exception:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start != -1 and end != -1 and end > start:
            slice_text = cleaned[start : end + 1]
            try:
                return json.loads(slice_text)
            except Exception:
                fixed = re.sub(r",\s*([}\]])", r"\1", slice_text)
                try:
                    return json.loads(fixed)
                except Exception as exc:  # noqa: BLE001
                    logger.warning("Failed to parse extracted JSON slice: %s", exc)
    return None