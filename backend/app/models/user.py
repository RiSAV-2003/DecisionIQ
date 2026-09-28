import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(default=True)
    plan: Mapped[str] = mapped_column(String(20), default="free")  # free | pro | premium
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )

    decisions: Mapped[list["Decision"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    preferences: Mapped["UserPreference"] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")
    saved_decisions: Mapped[list["SavedDecision"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class UserPreference(Base):
    """Personalization knobs used by the decision engine when scoring options."""

    __tablename__ = "user_preferences"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), unique=True, index=True)

    # e.g. ["education", "career", "finance"]
    decision_interests: Mapped[list] = mapped_column(JSON, default=list)
    # e.g. ["budget", "performance", "reliability", "location", "growth", "risk_tolerance"]
    priorities: Mapped[list] = mapped_column(JSON, default=list)
    # 1 (very price sensitive) .. 5 (quality first)
    budget_sensitivity: Mapped[int] = mapped_column(Integer, default=3)
    # quick | standard | deep
    research_depth: Mapped[str] = mapped_column(String(20), default="standard")
    # preferred categories for exploration
    preferred_categories: Mapped[list] = mapped_column(JSON, default=list)
    # e.g. "INR" | "USD" | "EUR"
    currency: Mapped[str] = mapped_column(String(10), default="INR")
    # free-text notes (location, timeline, risk appetite...)
    extra: Mapped[dict] = mapped_column(JSON, default=dict)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )

    user: Mapped["User"] = relationship(back_populates="preferences")