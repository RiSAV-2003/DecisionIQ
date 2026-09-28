"""Authentication service: register, login, token issuing + refresh."""
import hashlib
from datetime import datetime, timedelta, timezone

from fastapi import Request
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.platform import AuthSession
from app.models.user import User, UserPreference


def _hash_refresh(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    # ---------- register / login ----------

    def register(self, full_name: str, email: str, password: str, request: Request | None = None) -> User:
        existing = self.db.query(User).filter(User.email == email.lower()).first()
        if existing:
            raise ValueError("An account with this email already exists.")
        user = User(
            full_name=full_name,
            email=email.lower(),
            hashed_password=hash_password(password),
        )
        self.db.add(user)
        self.db.flush()
        # Default preferences so personalization has somewhere to live.
        prefs = UserPreference(user_id=user.id)
        self.db.add(prefs)
        self.db.commit()
        self.db.refresh(user)
        return user

    def authenticate(self, email: str, password: str) -> User | None:
        user = self.db.query(User).filter(User.email == email.lower()).first()
        if not user or not verify_password(password, user.hashed_password):
            return None
        return user

    # ---------- tokens ----------

    def issue_tokens(self, user: User, request: Request | None = None) -> tuple[str, str]:
        access = create_access_token(user.id)
        refresh = create_refresh_token(user.id)
        session = AuthSession(
            user_id=user.id,
            refresh_token_hash=_hash_refresh(refresh),
            user_agent=request.headers.get("user-agent", "")[:512] if request else None,
            ip=request.client.host if request and request.client else None,
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
        self.db.add(session)
        self.db.commit()
        return access, refresh

    def refresh(self, refresh_token: str, request: Request | None = None) -> tuple[str, str] | None:
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            return None
        user = self.db.get(User, payload.get("sub"))
        if not user or not user.is_active:
            return None
        session = (
            self.db.query(AuthSession)
            .filter(AuthSession.refresh_token_hash == _hash_refresh(refresh_token), AuthSession.revoked == False)  # noqa: E712
            .first()
        )
        if not session:
            return None
        expires = session.expires_at
        if expires.tzinfo is None:
            if expires < datetime.utcnow():
                return None
        elif expires < datetime.now(timezone.utc):
            return None
        access = create_access_token(user.id)
        new_refresh = create_refresh_token(user.id)
        session.refresh_token_hash = _hash_refresh(new_refresh)
        session.expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        self.db.commit()
        return access, new_refresh

    def revoke(self, refresh_token: str) -> None:
        session = self.db.query(AuthSession).filter(
            AuthSession.refresh_token_hash == _hash_refresh(refresh_token)
        ).first()
        if session:
            session.revoked = True
            self.db.commit()