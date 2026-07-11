"""Data access for password reset tokens (RF-03)."""

from datetime import datetime, timedelta, timezone
from typing import Optional

from core.config import settings
from database import execute, fetch_one, insert_row


def create_reset_token(user_id: int, token_hash: str) -> dict:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.RESET_TOKEN_EXPIRE_MINUTES)
    return insert_row(
        "password_reset_tokens",
        {"user_id": user_id, "token_hash": token_hash, "expires_at": expires_at},
    )


def get_valid_by_token_hash(token_hash: str) -> Optional[dict]:
    return fetch_one(
        """
        SELECT *
        FROM password_reset_tokens
        WHERE token_hash = :token_hash
          AND used_at IS NULL
          AND expires_at > :now
        LIMIT 1
        """,
        {"token_hash": token_hash, "now": datetime.now(timezone.utc)},
    )


def mark_used(token_id: int) -> None:
    execute(
        "UPDATE password_reset_tokens SET used_at = :used_at WHERE id = :token_id",
        {"used_at": datetime.now(timezone.utc), "token_id": token_id},
    )
