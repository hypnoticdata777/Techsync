"""Data access for org invitations (RF-07)."""

from datetime import datetime, timedelta, timezone
from typing import Optional

from core.config import settings
from supabase_client import get_supabase_client


def create_invitation(organization_id: int, email: str, role: str, token_hash: str, invited_by: int) -> dict:
    client = get_supabase_client()
    expires_at = datetime.now(timezone.utc) + timedelta(hours=settings.INVITE_EXPIRE_HOURS)
    response = (
        client.table("invitations")
        .insert(
            {
                "organization_id": organization_id,
                "email": email,
                "role": role,
                "token_hash": token_hash,
                "invited_by": invited_by,
                "expires_at": expires_at.isoformat(),
            }
        )
        .execute()
    )
    return response.data[0]


def get_valid_by_token_hash(token_hash: str) -> Optional[dict]:
    client = get_supabase_client()
    now = datetime.now(timezone.utc).isoformat()
    response = (
        client.table("invitations")
        .select("*")
        .eq("token_hash", token_hash)
        .is_("accepted_at", "null")
        .gt("expires_at", now)
        .execute()
    )
    return response.data[0] if response.data else None


def mark_accepted(invitation_id: int) -> None:
    client = get_supabase_client()
    now = datetime.now(timezone.utc).isoformat()
    client.table("invitations").update({"accepted_at": now}).eq("id", invitation_id).execute()


def list_by_org(organization_id: int) -> list[dict]:
    client = get_supabase_client()
    response = (
        client.table("invitations")
        .select("*")
        .eq("organization_id", organization_id)
        .order("created_at", desc=True)
        .execute()
    )
    return response.data or []
