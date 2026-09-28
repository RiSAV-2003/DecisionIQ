"""Central app configuration, loaded from environment variables.

Never hardcode secrets here. Everything sensitive comes from the environment
(see .env.example). The defaults below are safe for local development only.
"""
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    ENVIRONMENT: str = "development"

    # SQLite by default so the app runs with zero setup; switch to Postgres in
    # production via DATABASE_URL (e.g. postgresql://user:pass@localhost:5432/decisioniq).
    DATABASE_URL: str = "sqlite:///./decisioniq.db"

    @property
    def effective_database_url(self) -> str:
        if self.DATABASE_URL.startswith("sqlite:///./"):
            db_name = self.DATABASE_URL.replace("sqlite:///./", "")
            base_dir = Path(__file__).resolve().parent.parent.parent
            return f"sqlite:///{base_dir / db_name}"
        return self.DATABASE_URL

    JWT_SECRET: str = "CHANGE_ME_dev_only"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 14

    # AI provider — supports Google Gemini (free tier via Google AI Studio)
    # as well as OpenAI-compatible APIs.
    GEMINI_API_KEY: str | None = None
    AI_API_KEY: str | None = None
    AI_BASE_URL: str = "https://generativelanguage.googleapis.com/v1beta/openai/"
    AI_MODEL: str = "gemini-1.5-flash"

    # Optional research provider (e.g. Tavily). When unset, research uses
    # dynamic keyless web search and Wikipedia API so sources are always real.
    SEARCH_API_KEY: str | None = None

    # Optional Redis URL for distributed rate limiting / caching.
    # Falls back to an in-process limiter when unset.
    REDIS_URL: str | None = None

    CORS_ORIGINS: str = "http://localhost:3000"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def cors_origin_regex(self) -> str | None:
        """Dev servers run on random ports (this environment sets PORT=0), so
        allow any localhost origin during development. Production should set
        explicit CORS_ORIGINS; the regex only ever matches localhost anyway."""
        if self.ENVIRONMENT == "development":
            return r"https?://(localhost|127\.0\.0\.1)(:\d+)?"
        return None

    @property
    def effective_ai_key(self) -> str | None:
        return self.GEMINI_API_KEY or self.AI_API_KEY

    @property
    def missing_keys(self) -> list[str]:
        """Reported by /health so the app boots cleanly without keys."""
        missing = []
        if not self.effective_ai_key:
            missing.append("GEMINI_API_KEY (optional: get free key at aistudio.google.com)")
        if not self.SEARCH_API_KEY:
            missing.append("SEARCH_API_KEY (optional: keyless web & wiki search active)")
        if self.JWT_SECRET == "CHANGE_ME_dev_only":
            missing.append("JWT_SECRET (set a real value before production)")
        return missing


settings = Settings()