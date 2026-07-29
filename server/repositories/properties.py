"""Data access for managed properties, always scoped by organization_id."""

from typing import Optional

from database import fetch_all, fetch_one, insert_row, update_row


def create(organization_id: int, patch: dict) -> dict:
    return insert_row("properties", {"organization_id": organization_id, **patch})


def get_by_id_in_org(property_id: int, organization_id: int) -> Optional[dict]:
    return fetch_one(
        "SELECT * FROM properties WHERE id = :property_id AND organization_id = :organization_id",
        {"property_id": property_id, "organization_id": organization_id},
    )


def list_by_org(
    organization_id: int,
    client_id: Optional[int] = None,
    active_only: bool = False,
) -> list[dict]:
    where = ["organization_id = :organization_id"]
    params = {"organization_id": organization_id}
    if client_id:
        where.append("client_id = :client_id")
        params["client_id"] = client_id
    if active_only:
        where.append("is_active = true")

    return fetch_all(
        f"SELECT * FROM properties WHERE {' AND '.join(where)} ORDER BY name ASC",
        params,
    )


def update(property_id: int, organization_id: int, patch: dict) -> Optional[dict]:
    return update_row("properties", patch, {"id": property_id, "organization_id": organization_id})
