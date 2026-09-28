import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class SavedDecision(Base):
    __tablename__ = "saved_decisions"
    __table_args__ = (UniqueConstraint("user_id", "decision_id", name="uq_saved_user_decision"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    decision_id: Mapped[str] = mapped_column(String(36), ForeignKey("decisions.id"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user: Mapped["User"] = relationship(back_populates="saved_decisions")
    decision: Mapped["Decision"] = relationship()