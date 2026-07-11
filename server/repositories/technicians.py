"""Data access for technician profiles (RF-14, RF-26)."""

from typing import Optional

from database import fetch_all, fetch_one, insert_row, update_row

TECHNICIAN_SELECT = """
    SELECT
        t.*,
        u.full_name AS user_full_name,
        u.email AS user_email,
        u.is_active AS user_is_active
    FROM technicians t
    JOIN users u ON u.id = t.user_id AND u.organization_id = t.organization_id
"""


def create_technician(organization_id: int, user_id: int, patch: dict) -> dict:
    return insert_row("technicians", {"organization_id": organization_id, "user_id": user_id, **patch})


def get_by_id_in_org(technician_id: int, organization_id: int) -> Optional[dict]:
    row = fetch_one(
        TECHNICIAN_SELECT + " WHERE t.id = :technician_id AND t.organization_id = :organization_id",
        {"technician_id": technician_id, "organization_id": organization_id},
    )
    return _with_user(row) if row else None


def get_by_user_id(user_id: int, organization_id: int) -> Optional[dict]:
    row = fetch_one(
        TECHNICIAN_SELECT + " WHERE t.user_id = :user_id AND t.organization_id = :organization_id",
        {"user_id": user_id, "organization_id": organization_id},
    )
    return _with_user(row) if row else None


def list_by_org(organization_id: int) -> list[dict]:
    rows = fetch_all(
        TECHNICIAN_SELECT + " WHERE t.organization_id = :organization_id ORDER BY t.created_at DESC",
        {"organization_id": organization_id},
    )
    return [_with_user(row) for row in rows]


def update(technician_id: int, organization_id: int, patch: dict) -> Optional[dict]:
    return update_row("technicians", patch, {"id": technician_id, "organization_id": organization_id})


def _with_user(row: dict) -> dict:
    row = dict(row)
    row["users"] = {
        "full_name": row.pop("user_full_name", ""),
        "email": row.pop("user_email", ""),
        "is_active": row.pop("user_is_active", True),
    }
    return row
