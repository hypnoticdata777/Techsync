"""Data access for configurable per-org priority rules (RF-17)."""

from typing import Optional

from database import fetch_all, fetch_one, fetch_one_in_transaction


def get_forced_priority(organization_id: int, service_type: str) -> Optional[str]:
    row = fetch_one(
        """
        SELECT forced_priority
        FROM org_priority_rules
        WHERE organization_id = :organization_id AND service_type = :service_type
        LIMIT 1
        """,
        {"organization_id": organization_id, "service_type": service_type},
    )
    return row["forced_priority"] if row else None


def upsert_rule(organization_id: int, service_type: str, forced_priority: str) -> dict:
    return fetch_one_in_transaction(
        """
        INSERT INTO org_priority_rules (organization_id, service_type, forced_priority)
        VALUES (:organization_id, :service_type, :forced_priority)
        ON CONFLICT (organization_id, service_type)
        DO UPDATE SET forced_priority = EXCLUDED.forced_priority
        RETURNING *
        """,
        {
            "organization_id": organization_id,
            "service_type": service_type,
            "forced_priority": forced_priority,
        },
    )


def list_by_org(organization_id: int) -> list[dict]:
    return fetch_all(
        "SELECT * FROM org_priority_rules WHERE organization_id = :organization_id ORDER BY service_type",
        {"organization_id": organization_id},
    )
