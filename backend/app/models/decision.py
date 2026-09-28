import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String, Text, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class DecisionDomain(str, PyEnum):
    EDUCATION = "education"
    CAREER = "career"
    FINANCE = "finance"
    TRAVEL = "travel"
    LIFESTYLE = "lifestyle"
    BUSINESS = "business"
    TECHNOLOGY = "technology"
    PRODUCTS = "products"
    OTHER = "other"


class DecisionStatus(str, PyEnum):
    DRAFT = "draft"
    ANALYZING = "analyzing"
    COMPLETED = "completed"
    FAILED = "failed"


class Decision(Base):
    __tablename__ = "decisions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(500))
    domain: Mapped[DecisionDomain] = mapped_column(Enum(DecisionDomain), default=DecisionDomain.OTHER)
    status: Mapped[DecisionStatus] = mapped_column(Enum(DecisionStatus), default=DecisionStatus.DRAFT)
    raw_prompt: Mapped[str] = mapped_column(Text)
    # [{key, label, description, status: pending|active|completed, detail}]
    stages: Mapped[list] = mapped_column(JSON, default=list)
    # [{key, label, type: text|select|number, options, placeholder, required, help}]
    clarifying_questions: Mapped[list] = mapped_column(JSON, default=list)
    research_depth: Mapped[str] = mapped_column(String(20), default="standard")
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )

    user: Mapped["User"] = relationship(back_populates="decisions")
    inputs: Mapped[list["DecisionInput"]] = relationship(back_populates="decision", cascade="all, delete-orphan")
    criteria: Mapped[list["DecisionCriterion"]] = relationship(back_populates="decision", cascade="all, delete-orphan")
    options: Mapped[list["Option"]] = relationship(back_populates="decision", cascade="all, delete-orphan")
    messages: Mapped[list["DecisionMessage"]] = relationship(back_populates="decision", cascade="all, delete-orphan")
    result: Mapped["DecisionResult"] = relationship(back_populates="decision", uselist=False, cascade="all, delete-orphan")
    sources: Mapped[list["Source"]] = relationship(back_populates="decision", cascade="all, delete-orphan")
    evidence: Mapped[list["Evidence"]] = relationship(back_populates="decision", cascade="all, delete-orphan")


class DecisionInput(Base):
    """Clarifying answers collected from the user (budget, location, constraints...)."""

    __tablename__ = "decision_inputs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    decision_id: Mapped[str] = mapped_column(String(36), ForeignKey("decisions.id"), index=True)
    key: Mapped[str] = mapped_column(String(255))
    value: Mapped[str] = mapped_column(Text)

    decision: Mapped["Decision"] = relationship(back_populates="inputs")


class DecisionCriterion(Base):
    """A weighted criterion used in the transparent comparison (price, reliability...)."""

    __tablename__ = "decision_criteria"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    decision_id: Mapped[str] = mapped_column(String(36), ForeignKey("decisions.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    weight: Mapped[float] = mapped_column(Float, default=1.0)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    position: Mapped[int] = mapped_column(Integer, default=0)

    decision: Mapped["Decision"] = relationship(back_populates="criteria")


class Option(Base):
    """One candidate being compared within a Decision (e.g. one laptop, one job offer)."""

    __tablename__ = "decision_options"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    decision_id: Mapped[str] = mapped_column(String(36), ForeignKey("decisions.id"), index=True)
    key: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)  # KB linkage for recompute
    name: Mapped[str] = mapped_column(String(500))
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    price_info: Mapped[str | None] = mapped_column(String(255), nullable=True)
    price_inr: Mapped[int | None] = mapped_column(Integer, nullable=True)
    badge: Mapped[str | None] = mapped_column(String(50), nullable=True)
    highlights: Mapped[list] = mapped_column(JSON, default=list)
    strengths: Mapped[list] = mapped_column(JSON, default=list)
    weaknesses: Mapped[list] = mapped_column(JSON, default=list)
    risks: Mapped[list] = mapped_column(JSON, default=list)
    # [{criterionId, name, score, note}]
    criterion_scores: Mapped[list] = mapped_column(JSON, default=list)
    fit_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    recommended: Mapped[bool] = mapped_column(default=False)
    position: Mapped[int] = mapped_column(Integer, default=0)

    decision: Mapped["Decision"] = relationship(back_populates="options")


class DecisionMessage(Base):
    """AI chat messages that persist with the decision (follow-up context)."""

    __tablename__ = "decision_messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    decision_id: Mapped[str] = mapped_column(String(36), ForeignKey("decisions.id"), index=True)
    role: Mapped[str] = mapped_column(String(20))  # user | assistant | system
    content: Mapped[str] = mapped_column(Text)
    # set when a follow-up caused a recompute of scores/recommendation
    changed_recommendation: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    decision: Mapped["Decision"] = relationship(back_populates="messages")