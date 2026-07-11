"""Data access for org invitations (RF-07)."""

from datetime import datetime, timedelta, timezone
from typing import Optional

from core.config import settings
from database import execute, fetch_all, fetch_one, insert_row


def create_invitation(organization_id: int, email: str, role: str, token_hash: str, invited_by: int) -> dict:
    expires_at = datetime.now(timezone.utc) + timedelta(hours=settings.INVITE_EXPIRE_HOURS)
    return insert_row(
        "invitations",
        {
            "organization_id": organization_id,
            "email": email,
            "role": role,
            "token_hash": token_hash,
            "invited_by": invited_by,
            "expires_at": expires_at,
        },
    )


def get_valid_by_token_hash(token_hash: str) -> Optional[dict]:
    return fetch_one(
        """
        SELECT *
        FROM invitations
        WHERE token_hash = :token_hash
          AND accepted_at IS NULL
          AND expires_at > :now
        LIMIT 1
        """,
        {"token_hash": token_hash, "now": datetime.now(timezone.utc)},
    )


def mark_accepted(invitation_id: int) -> None:
    execute(
        "UPDATE invitations SET accepted_at = :accepted_at WHERE id = :invitation_id",
        {"accepted_at": datetime.now(timezone.utc), "invitation_id": invitation_id},
    )


def list_by_org(organization_id: int) -> list[dict]:
    return fetch_all(
        "SELECT * FROM invitations WHERE organization_id = :organization_id ORDER BY created_at DESC",
        {"organization_id": organization_id},
    )
