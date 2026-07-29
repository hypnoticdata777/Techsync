"""Data access for work order attachments (RF-19)."""

from database import fetch_all, fetch_scalar, insert_row


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


def list_metadata_by_org(organization_id: int) -> list[dict]:
    return fetch_all(
        """
        SELECT
            id,
            work_order_id,
            uploaded_by,
            file_name,
            content_type,
            size_bytes,
            created_at
        FROM work_order_attachments
        WHERE organization_id = :organization_id
        ORDER BY work_order_id ASC, created_at ASC
        """,
        {"organization_id": organization_id},
    )


def has_for_work_order(organization_id: int, work_order_id: int) -> bool:
    count = fetch_scalar(
        """
        SELECT COUNT(*)
        FROM work_order_attachments
        WHERE organization_id = :organization_id AND work_order_id = :work_order_id
        """,
        {"organization_id": organization_id, "work_order_id": work_order_id},
    )
    return int(count or 0) > 0
