"""Data access for password reset tokens (RF-03)."""

from datetime import datetime, timedelta, timezone
from typing import Optional

from core.config import settings
from supabase_client import get_supabase_client


def create_reset_token(user_id: int, token_hash: str) -> dict:
    client = get_supabase_client()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.RESET_TOKEN_EXPIRE_MINUTES)
    response = (
        client.table("password_reset_tokens")
        .insert({"user_id": user_id, "token_hash": token_hash, "expires_at": expires_at.isoformat()})
        .execute()
    )
    return response.data[0]


def get_valid_by_token_hash(token_hash: str) -> Optional[dict]:
    client = get_supabase_client()
    now = datetime.now(timezone.utc).isoformat()
    response = (
        client.table("password_reset_tokens")
        .select("*")
        .eq("token_hash", token_hash)
        .is_("used_at", "null")
        .gt("expires_at", now)
        .execute()
    )
    return response.data[0] if response.data else None


def mark_used(token_id: int) -> None:
    client = get_supabase_client()
    now = datetime.now(timezone.utc).isoformat()
    client.table("password_reset_tokens").update({"used_at": now}).eq("id", token_id).execute()
