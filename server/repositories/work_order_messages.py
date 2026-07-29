"""Data access for work-order messages, always scoped by organization_id."""

from typing import Optional

from database import fetch_all, insert_row


def create(
    organization_id: int,
    work_order_id: int,
    author_user_id: int | None,
    patch: dict,
) -> dict:
    return insert_row(
        "work_order_messages",
        {
            "organization_id": organization_id,
            "work_order_id": work_order_id,
            "author_user_id": author_user_id,
            **patch,
        },
    )


def list_for_work_order(
    organization_id: int,
    work_order_id: int,
    visibility: Optional[str] = None,
) -> list[dict]:
    where = ["organization_id = :organization_id", "work_order_id = :work_order_id"]
    params = {"organization_id": organization_id, "work_order_id": work_order_id}

    if visibility:
        where.append("visibility = :visibility")
        params["visibility"] = visibility

    return fetch_all(
        f"""
        SELECT *
        FROM work_order_messages
        WHERE {' AND '.join(where)}
        ORDER BY created_at ASC
        """,
        params,
    )


def list_by_org(organization_id: int) -> list[dict]:
    return fetch_all(
        """
        SELECT *
        FROM work_order_messages
        WHERE organization_id = :organization_id
        ORDER BY work_order_id ASC, created_at ASC
        """,
        {"organization_id": organization_id},
    )
