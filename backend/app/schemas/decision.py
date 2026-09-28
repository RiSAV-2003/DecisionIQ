from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


# ---------- Pipeline progress ----------

class StageSchema(BaseModel):
    key: str
    label: str
    description: str
    status: str = "pending"  # pending | active | completed | failed
    detail: str | None = None


class ClarifyingQuestionSchema(BaseModel):
    key: str
    label: str
    type: str = "text"  # text | number | select | chips
    options: list[str] = []
    placeholder: str | None = None
    required: bool = True
    help: str | None = None


# ---------- Research ----------

class SourceSchema(BaseModel):
    id: str
    title: str
    publisher: str | None = None
    url: str
    domain_name: str | None = None
    source_type: str | None = None
    snippet: str | None = None
    authority_score: float = 0
    freshness_score: float = 0
    relevance_score: float = 0
    reliability_score: float = 0
    overall_score: float = 0
    published_date: datetime | None = None
    retrieved_date: datetime | None = None


class EvidenceSchema(BaseModel):
    id: str
    claim: str
    snippet: str | None = None
    evidence_key: str | None = None
    confidence: float | None = None
    relevance_score: float = 0
    conflict: bool = False
    source: SourceSchema | None = None


# ---------- Comparison ----------

class CriterionScoreSchema(BaseModel):
    criterionId: str
    name: str
    score: float
    note: str | None = None


class OptionSchema(BaseModel):
    id: str
    name: str
    summary: str | None = None
    price_info: str | None = None
    badge: str | None = None
    highlights: list[str] = []
    strengths: list[str] = []
    weaknesses: list[str] = []
    risks: list[str] = []
    criterion_scores: list[CriterionScoreSchema] = []
    fit_score: float | None = None
    recommended: bool = False
    position: int = 0


class CriterionSchema(BaseModel):
    id: str
    name: str
    weight: float
    description: str | None = None
    position: int = 0


class MessageSchema(BaseModel):
    id: str
    role: str
    content: str
    changed_recommendation: bool = False
    created_at: datetime


class RecommendationSchema(BaseModel):
    recommended_option_id: str | None = None
    summary: str
    reasoning: str
    caveats: str | None = None
    confidence_score: float | None = None
    overall_fit_score: float | None = None
    what_could_change: list[str] = []
    next_steps: list[str] = []
    trade_offs: list[str] = []
    assumptions: list[str] = []


# ---------- Decisions ----------

class DecisionCreateRequest(BaseModel):
    raw_prompt: str = ""
    domain: str | None = None
    answers: dict[str, Any] = {}
    research_depth: str | None = None


class DecisionAnswersRequest(BaseModel):
    answers: dict[str, Any]


class DecisionSummary(BaseModel):
    id: str
    title: str
    domain: str
    status: str
    created_at: datetime
    updated_at: datetime
    fit_score: float | None = None
    recommended_title: str | None = None
    saved: bool = False


class DecisionListResponse(BaseModel):
    items: list[DecisionSummary]
    total: int


class DecisionDetailResponse(BaseModel):
    id: str
    title: str
    domain: str
    status: str
    raw_prompt: str
    research_depth: str
    stages: list[StageSchema] = []
    clarifying_questions: list[ClarifyingQuestionSchema] = []
    error: str | None = None
    created_at: datetime
    updated_at: datetime
    inputs: dict[str, Any] = {}
    criteria: list[CriterionSchema] = []
    options: list[OptionSchema] = []
    sources: list[SourceSchema] = []
    evidence: list[EvidenceSchema] = []
    messages: list[MessageSchema] = []
    result: RecommendationSchema | None = None
    saved: bool = False


class FollowUpRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


class FollowUpResponse(BaseModel):
    reply: str
    changed_recommendation: bool = False
    decision: DecisionDetailResponse


class ReweightRequest(BaseModel):
    criteria_weights: dict[str, float]  # criterion_id -> new weight (0..100)


class SaveDecisionRequest(BaseModel):
    decision_id: str


class SavedDecisionSummary(BaseModel):
    id: str
    decision: DecisionSummary
    saved_at: datetime


class SavedListResponse(BaseModel):
    items: list[SavedDecisionSummary]
    total: int