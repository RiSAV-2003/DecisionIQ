import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ResearchTask(Base):
    """One research query fired for a decision, with its own status."""

    __tablename__ = "research_tasks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    decision_id: Mapped[str] = mapped_column(String(36), ForeignKey("decisions.id"), index=True)
    query: Mapped[str] = mapped_column(String(1000))
    status: Mapped[str] = mapped_column(String(50), default="pending")  # pending | running | done | failed
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class Source(Base):
    """A single research source with full attribution metadata. Never fabricated."""

    __tablename__ = "sources"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    decision_id: Mapped[str] = mapped_column(String(36), ForeignKey("decisions.id"), index=True)
    research_task_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("research_tasks.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(500))
    publisher: Mapped[str | None] = mapped_column(String(255), nullable=True)
    url: Mapped[str] = mapped_column(String(2048))
    domain_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    source_type: Mapped[str | None] = mapped_column(String(100), nullable=True)  # official | news | review | reference
    snippet: Mapped[str | None] = mapped_column(Text, nullable=True)
    authority_score: Mapped[float] = mapped_column(Float, default=0.0)
    freshness_score: Mapped[float] = mapped_column(Float, default=0.0)
    relevance_score: Mapped[float] = mapped_column(Float, default=0.0)
    reliability_score: Mapped[float] = mapped_column(Float, default=0.0)
    overall_score: Mapped[float] = mapped_column(Float, default=0.0)
    published_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    retrieved_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    decision: Mapped["Decision"] = relationship(back_populates="sources")


class Evidence(Base):
    """Maps a specific claim/snippet to an Option and a Source (claim-to-source mapping)."""

    __tablename__ = "evidence"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    decision_id: Mapped[str] = mapped_column(String(36), ForeignKey("decisions.id"), index=True)
    option_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("decision_options.id"), nullable=True)
    source_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("sources.id"), nullable=True)
    claim: Mapped[str] = mapped_column(Text)
    snippet: Mapped[str | None] = mapped_column(Text, nullable=True)
    evidence_key: Mapped[str | None] = mapped_column(String(50), nullable=True)  # spec | price | pro | con | risk | general
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    relevance_score: Mapped[float] = mapped_column(Float, default=0.0)
    conflict: Mapped[bool] = mapped_column(default=False)

    decision: Mapped["Decision"] = relationship(back_populates="evidence")
    option: Mapped["Option"] = relationship()
    source: Mapped["Source"] = relationship()