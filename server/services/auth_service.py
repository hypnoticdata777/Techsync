"""Business logic for authentication and password reset (RF-01, RF-03)."""

from typing import Optional

from core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_opaque_token,
    get_password_hash,
    hash_opaque_token,
    verify_password,
)
from models.user import TokenPair
from repositories import password_resets, users as users_repo


def issue_tokens(user_row: dict) -> TokenPair:
    access = create_access_token(
        user_id=user_row["id"],
        email=user_row["email"],
        organization_id=user_row["organization_id"],
        role=user_row["role"],
    )
    refresh = create_refresh_token(
        user_id=user_row["id"], email=user_row["email"], organization_id=user_row["organization_id"]
    )
    return TokenPair(access_token=access, refresh_token=refresh)


def authenticate(email: str, password: str) -> Optional[dict]:
    user_row = users_repo.get_by_email(email)
    if not user_row:
        return None
    if not verify_password(password, user_row["password_hash"]):
        return None
    if not user_row["is_active"]:
        return None
    return user_row


def refresh_access_token(refresh_token: str) -> Optional[TokenPair]:
    payload = decode_token(refresh_token, expected_type="refresh")
    if not payload:
        return None

    user_row = users_repo.get_by_id_in_org(payload["user_id"], payload["organization_id"])
    if not user_row or not user_row["is_active"]:
        return None

    return issue_tokens(user_row)


def request_password_reset(email: str) -> Optional[str]:
    """Returns the raw reset token to be emailed, or None if no such user (caller
    should still respond with a generic success message to avoid user enumeration)."""
    user_row = users_repo.get_by_email(email)
    if not user_row:
        return None

    raw_token = generate_opaque_token()
    password_resets.create_reset_token(user_row["id"], hash_opaque_token(raw_token))
    return raw_token


def reset_password(raw_token: str, new_password: str) -> bool:
    token_row = password_resets.get_valid_by_token_hash(hash_opaque_token(raw_token))
    if not token_row:
        return False

    users_repo.update_password(token_row["user_id"], get_password_hash(new_password))
    password_resets.mark_used(token_row["id"])
    return True
