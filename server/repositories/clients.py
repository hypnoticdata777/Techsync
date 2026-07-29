"""Data access for PMC clients, always scoped by organization_id."""

from typing import Optional

from database import fetch_all, fetch_one, insert_row, update_row


def create(organization_id: int, patch: dict) -> dict:
    return insert_row("clients", {"organization_id": organization_id, **patch})


def get_by_id_in_org(client_id: int, organization_id: int) -> Optional[dict]:
    return fetch_one(
        "SELECT * FROM clients WHERE id = :client_id AND organization_id = :organization_id",
        {"client_id": client_id, "organization_id": organization_id},
    )


def get_by_email_in_org(email: str, organization_id: int) -> Optional[dict]:
    return fetch_one(
        """
        SELECT *
        FROM clients
        WHERE organization_id = :organization_id
          AND lower(email) = lower(:email)
          AND is_active = true
        """,
        {"email": email, "organization_id": organization_id},
    )


def list_by_org(organization_id: int, active_only: bool = False) -> list[dict]:
    where = ["organization_id = :organization_id"]
    params = {"organization_id": organization_id}
    if active_only:
        where.append("is_active = true")

    return fetch_all(
        f"SELECT * FROM clients WHERE {' AND '.join(where)} ORDER BY display_name ASC",
        params,
    )


def update(client_id: int, organization_id: int, patch: dict) -> Optional[dict]:
    return update_row("clients", patch, {"id": client_id, "organization_id": organization_id})
