from typing import Any

from pydantic import BaseModel, Field


class UserUpdateRequest(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=255)


class PreferenceResponse(BaseModel):
    decision_interests: list[str] = []
    priorities: list[str] = []
    budget_sensitivity: int = 3
    research_depth: str = "standard"
    preferred_categories: list[str] = []
    currency: str = "INR"
    extra: dict[str, Any] = {}


class PreferenceUpdateRequest(BaseModel):
    decision_interests: list[str] | None = None
    priorities: list[str] | None = None
    budget_sensitivity: int | None = Field(default=None, ge=1, le=5)
    research_depth: str | None = None
    preferred_categories: list[str] | None = None
    currency: str | None = None
    extra: dict[str, Any] | None = None