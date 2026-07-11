"""Data access for the work order audit log (RF-20)."""

from database import fetch_all, insert_row


def create_event(
    organization_id: int,
    work_order_id: int,
    event_type: str,
    actor_user_id: int | None = None,
    from_status: str | None = None,
    to_status: str | None = None,
    notes: str | None = None,
) -> dict:
    return insert_row(
        "work_order_events",
        {
            "organization_id": organization_id,
            "work_order_id": work_order_id,
            "event_type": event_type,
            "actor_user_id": actor_user_id,
            "from_status": from_status,
            "to_status": to_status,
            "notes": notes,
        },
    )


def list_for_work_order(organization_id: int, work_order_id: int) -> list[dict]:
    return fetch_all(
        """
        SELECT *
        FROM work_order_events
        WHERE organization_id = :organization_id AND work_order_id = :work_order_id
        ORDER BY created_at DESC
        """,
        {"organization_id": organization_id, "work_order_id": work_order_id},
    )
