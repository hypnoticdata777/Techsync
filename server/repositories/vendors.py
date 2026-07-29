"""Data access for vendors, always scoped by organization_id."""

from typing import Optional

from database import fetch_all, fetch_one, insert_row, update_row


def create(organization_id: int, patch: dict) -> dict:
    return insert_row("vendors", {"organization_id": organization_id, **patch})


def get_by_id_in_org(vendor_id: int, organization_id: int) -> Optional[dict]:
    return fetch_one(
        "SELECT * FROM vendors WHERE id = :vendor_id AND organization_id = :organization_id",
        {"vendor_id": vendor_id, "organization_id": organization_id},
    )


def list_by_org(organization_id: int, active_only: bool = False) -> list[dict]:
    where = ["organization_id = :organization_id"]
    params = {"organization_id": organization_id}
    if active_only:
        where.append("is_active = true")

    return fetch_all(
        f"SELECT * FROM vendors WHERE {' AND '.join(where)} ORDER BY name ASC",
        params,
    )


def update(vendor_id: int, organization_id: int, patch: dict) -> Optional[dict]:
    return update_row("vendors", patch, {"id": vendor_id, "organization_id": organization_id})
