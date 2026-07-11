"""Data access for work order attachments (RF-19)."""

from database import fetch_all, insert_row


def create(organization_id: int, work_order_id: int, uploaded_by: int, patch: dict) -> dict:
    return insert_row(
        "work_order_attachments",
        {
            "organization_id": organization_id,
            "work_order_id": work_order_id,
            "uploaded_by": uploaded_by,
            **patch,
        },
    )


def list_for_work_order(organization_id: int, work_order_id: int) -> list[dict]:
    return fetch_all(
        """
        SELECT *
        FROM work_order_attachments
        WHERE organization_id = :organization_id AND work_order_id = :work_order_id
        ORDER BY created_at DESC
        """,
        {"organization_id": organization_id, "work_order_id": work_order_id},
    )
