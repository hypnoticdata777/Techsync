"""Data access for users, always scoped by organization_id where applicable (RF-05)."""

from typing import Optional

from database import execute, fetch_all, fetch_scalar, insert_row, select_one, update_row


def create_user(organization_id: int, email: str, password_hash: str, full_name: str, role: str) -> dict:
    return insert_row(
        "users",
        {
            "organization_id": organization_id,
            "email": email,
            "password_hash": password_hash,
            "full_name": full_name,
            "role": role,
        },
    )


def get_by_email(email: str) -> Optional[dict]:
    """Email is globally unique, so lookup by email alone is safe (used only at login)."""
    return select_one("users", {"email": email})


def get_by_id_in_org(user_id: int, organization_id: int) -> Optional[dict]:
    return select_one("users", {"id": user_id, "organization_id": organization_id})


def list_by_org(organization_id: int) -> list[dict]:
    return fetch_all(
        "SELECT * FROM users WHERE organization_id = :organization_id ORDER BY created_at DESC",
        {"organization_id": organization_id},
    )


def count_by_org_and_role(organization_id: int, role: str) -> int:
    count = fetch_scalar(
        "SELECT COUNT(*) FROM users WHERE organization_id = :organization_id AND role = :role",
        {"organization_id": organization_id, "role": role},
    )
    return int(count or 0)


def update_password(user_id: int, password_hash: str) -> None:
    execute("UPDATE users SET password_hash = :password_hash WHERE id = :user_id", {"password_hash": password_hash, "user_id": user_id})


def update_role_and_status(user_id: int, organization_id: int, patch: dict) -> Optional[dict]:
    return update_row("users", patch, {"id": user_id, "organization_id": organization_id})
