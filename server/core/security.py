"""
Password hashing and JWT helpers shared across the API (RF-01, RNF-06).

Three token "types" are minted, all signed with the same secret but
distinguished by a `type` claim so one can't be replayed as another:
  - access:  short-lived (15 min default), used to authenticate API calls
  - refresh: long-lived (7 days default), used only against /auth/refresh
  - reset:   short-lived (60 min default), used only against /auth/reset-password
"""

import hashlib
import re
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from core.config import settings

if not settings.JWT_SECRET_KEY:
    raise ValueError(
        "JWT_SECRET_KEY environment variable is required. "
        "Generate one with: openssl rand -hex 32"
    )

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def validate_password_strength(v: str) -> str:
    if len(v) < 8:
        raise ValueError("Password must be at least 8 characters")
    if not re.search(r"[a-zA-Z]", v):
        raise ValueError("Password must contain at least one letter")
    if not re.search(r"[0-9]", v):
        raise ValueError("Password must contain at least one number")
    return v


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def _create_token(data: dict, token_type: str, expires_delta: timedelta) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire, "type": token_type, "iat": datetime.now(timezone.utc)})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_access_token(user_id: int, email: str, organization_id: int, role: str) -> str:
    return _create_token(
        {"sub": email, "user_id": user_id, "organization_id": organization_id, "role": role},
        token_type="access",
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )


def create_refresh_token(user_id: int, email: str, organization_id: int) -> str:
    return _create_token(
        {"sub": email, "user_id": user_id, "organization_id": organization_id},
        token_type="refresh",
        expires_delta=timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES),
    )


def decode_token(token: str, expected_type: str) -> Optional[dict]:
    """Decode a JWT and verify it matches the expected `type` claim."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        return None

    if payload.get("type") != expected_type:
        return None
    return payload


def generate_opaque_token() -> str:
    """A random URL-safe token for invitations / password reset links."""
    return secrets.token_urlsafe(32)


def hash_opaque_token(token: str) -> str:
    """Hash an opaque token before persisting it (never store raw tokens)."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
