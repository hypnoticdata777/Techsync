"""Data access for work orders, always scoped by organization_id (RF-05, RF-18, RF-21)."""

from datetime import date
from typing import Optional

from database import fetch_all, fetch_one, fetch_scalar, insert_row, update_row


def create(organization_id: int, patch: dict) -> dict:
    return insert_row("work_orders", {"organization_id": organization_id, **patch})


def get_by_id_in_org(work_order_id: int, organization_id: int) -> Optional[dict]:
    return fetch_one(
        "SELECT * FROM work_orders WHERE id = :work_order_id AND organization_id = :organization_id",
        {"work_order_id": work_order_id, "organization_id": organization_id},
    )


def update(work_order_id: int, organization_id: int, patch: dict) -> Optional[dict]:
    return update_row("work_orders", patch, {"id": work_order_id, "organization_id": organization_id})


def list_filtered(
    organization_id: int,
    status: Optional[str] = None,
    technician_id: Optional[int] = None,
    customer_name: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
) -> list[dict]:
    """RF-21: combined filter by status, technician, customer, date range."""
    where = ["organization_id = :organization_id"]
    params = {"organization_id": organization_id}

    if status:
        where.append("status = :status")
        params["status"] = status
    if technician_id:
        where.append("assigned_technician_id = :technician_id")
        params["technician_id"] = technician_id
    if customer_name:
        where.append("customer_name ILIKE :customer_name")
        params["customer_name"] = f"%{customer_name}%"
    if date_from:
        where.append("created_at >= :date_from")
        params["date_from"] = date_from
    if date_to:
        where.append("created_at <= :date_to")
        params["date_to"] = date_to

    return fetch_all(
        f"SELECT * FROM work_orders WHERE {' AND '.join(where)} ORDER BY created_at DESC",
        params,
    )


def list_for_technician(organization_id: int, technician_id: int) -> list[dict]:
    """RF-22: technician's assigned work orders ordered by priority."""
    return fetch_all(
        """
        SELECT *
        FROM work_orders
        WHERE organization_id = :organization_id
          AND assigned_technician_id = :technician_id
          AND status IN ('open', 'in_progress')
        ORDER BY CASE priority
            WHEN 'emergency' THEN 0
            WHEN 'high' THEN 1
            WHEN 'medium' THEN 2
            WHEN 'low' THEN 3
            ELSE 99
        END, created_at DESC
        """,
        {"organization_id": organization_id, "technician_id": technician_id},
    )


def counts_by_status(organization_id: int) -> dict[str, int]:
    rows = fetch_all(
        """
        SELECT status, COUNT(*) AS count
        FROM work_orders
        WHERE organization_id = :organization_id
        GROUP BY status
        """,
        {"organization_id": organization_id},
    )
    counts = {"open": 0, "in_progress": 0, "completed": 0, "cancelled": 0}
    for row in rows:
        status_value = row.get("status")
        if status_value in counts:
            counts[status_value] = int(row.get("count") or 0)
    return counts


def count_sla_at_risk(organization_id: int) -> int:
    from datetime import datetime, timedelta, timezone

    soon = datetime.now(timezone.utc) + timedelta(hours=2)
    count = fetch_scalar(
        """
        SELECT COUNT(*)
        FROM work_orders
        WHERE organization_id = :organization_id
          AND status IN ('open', 'in_progress')
          AND sla_due_at IS NOT NULL
          AND sla_due_at <= :soon
        """,
        {"organization_id": organization_id, "soon": soon},
    )
    return int(count or 0)
