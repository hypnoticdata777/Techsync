"""Data access for work orders, always scoped by organization_id (RF-05, RF-18, RF-21)."""

from datetime import date, datetime, timedelta, timezone
from typing import Optional

from database import fetch_all, fetch_one, fetch_scalar, insert_row, update_row

ALL_WORK_ORDER_STATUSES = (
    "open",
    "in_progress",
    "paused",
    "escalated",
    "completed",
    "cancelled",
    "archived",
)


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
    property_id: Optional[int] = None,
    client_id: Optional[int] = None,
    vendor_id: Optional[int] = None,
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
    if property_id:
        where.append("property_id = :property_id")
        params["property_id"] = property_id
    if client_id:
        where.append("client_id = :client_id")
        params["client_id"] = client_id
    if vendor_id:
        where.append("vendor_id = :vendor_id")
        params["vendor_id"] = vendor_id
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
          AND status IN ('open', 'in_progress', 'paused', 'escalated')
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
    counts = {status: 0 for status in ALL_WORK_ORDER_STATUSES}
    for row in rows:
        status_value = row.get("status")
        if status_value in counts:
            counts[status_value] = int(row.get("count") or 0)
    return counts


def count_sla_at_risk(organization_id: int) -> int:
    soon = datetime.now(timezone.utc) + timedelta(hours=2)
    count = fetch_scalar(
        """
        SELECT COUNT(*)
        FROM work_orders
        WHERE organization_id = :organization_id
          AND status IN ('open', 'in_progress', 'escalated')
          AND sla_due_at IS NOT NULL
          AND sla_due_at <= :soon
        """,
        {"organization_id": organization_id, "soon": soon},
    )
    return int(count or 0)


def list_stale_work_orders(
    organization_id: int,
    older_than_days: int = 7,
    limit: int = 20,
) -> list[dict]:
    cutoff = datetime.now(timezone.utc) - timedelta(days=older_than_days)
    return fetch_all(
        """
        SELECT
            id,
            title,
            status,
            priority,
            assigned_technician_id,
            property_id,
            client_id,
            created_at,
            sla_due_at
        FROM work_orders
        WHERE organization_id = :organization_id
          AND status IN ('open', 'in_progress', 'paused', 'escalated')
          AND created_at <= :cutoff
        ORDER BY CASE priority
            WHEN 'emergency' THEN 0
            WHEN 'high' THEN 1
            WHEN 'medium' THEN 2
            WHEN 'low' THEN 3
            ELSE 99
        END, created_at ASC
        LIMIT :limit
        """,
        {"organization_id": organization_id, "cutoff": cutoff, "limit": limit},
    )


def list_overloaded_technicians(organization_id: int, limit: int = 20) -> list[dict]:
    return fetch_all(
        """
        SELECT
            t.id AS technician_id,
            t.user_id,
            u.full_name,
            u.email,
            t.availability_status,
            t.max_daily_jobs,
            COUNT(wo.id) AS active_work_order_count
        FROM technicians t
        JOIN users u ON u.id = t.user_id AND u.organization_id = t.organization_id
        LEFT JOIN work_orders wo
            ON wo.assigned_technician_id = t.id
           AND wo.organization_id = t.organization_id
           AND wo.status IN ('open', 'in_progress', 'escalated')
        WHERE t.organization_id = :organization_id
        GROUP BY t.id, t.user_id, u.full_name, u.email, t.availability_status, t.max_daily_jobs
        HAVING COUNT(wo.id) > t.max_daily_jobs
        ORDER BY active_work_order_count DESC, t.max_daily_jobs ASC
        LIMIT :limit
        """,
        {"organization_id": organization_id, "limit": limit},
    )


def list_property_hotspots(
    organization_id: int,
    since_days: int = 90,
    limit: int = 10,
) -> list[dict]:
    cutoff = datetime.now(timezone.utc) - timedelta(days=since_days)
    return fetch_all(
        """
        SELECT
            p.id AS property_id,
            p.name AS property_name,
            p.address_line1,
            COUNT(wo.id) AS total_work_orders,
            SUM(CASE WHEN wo.status = 'open' THEN 1 ELSE 0 END) AS open_count,
            SUM(CASE WHEN wo.status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_count,
            SUM(CASE WHEN wo.status = 'completed' THEN 1 ELSE 0 END) AS completed_count,
            MAX(wo.created_at) AS latest_work_order_at
        FROM properties p
        JOIN work_orders wo
            ON wo.property_id = p.id
           AND wo.organization_id = p.organization_id
           AND wo.created_at >= :cutoff
        WHERE p.organization_id = :organization_id
        GROUP BY p.id, p.name, p.address_line1
        HAVING COUNT(wo.id) > 0
        ORDER BY total_work_orders DESC, latest_work_order_at DESC
        LIMIT :limit
        """,
        {"organization_id": organization_id, "cutoff": cutoff, "limit": limit},
    )


def list_completion_cycles(
    organization_id: int,
    since_days: int = 90,
    limit: int = 10,
) -> list[dict]:
    cutoff = datetime.now(timezone.utc) - timedelta(days=since_days)
    return fetch_all(
        """
        SELECT
            COALESCE(NULLIF(service_type, ''), 'general') AS service_type,
            COUNT(id) AS completed_count,
            ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600.0)::numeric, 1)
                AS average_cycle_hours,
            ROUND(MIN(EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600.0)::numeric, 1)
                AS fastest_cycle_hours,
            ROUND(MAX(EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600.0)::numeric, 1)
                AS slowest_cycle_hours,
            MAX(completed_at) AS latest_completed_at
        FROM work_orders
        WHERE organization_id = :organization_id
          AND status = 'completed'
          AND completed_at IS NOT NULL
          AND completed_at >= :cutoff
          AND completed_at >= created_at
        GROUP BY COALESCE(NULLIF(service_type, ''), 'general')
        HAVING COUNT(id) > 0
        ORDER BY average_cycle_hours DESC, completed_count DESC
        LIMIT :limit
        """,
        {"organization_id": organization_id, "cutoff": cutoff, "limit": limit},
    )


def list_dispatch_board_work_orders(organization_id: int) -> list[dict]:
    """v1.3 dispatch board: active work enriched with PMC context."""
    return fetch_all(
        """
        SELECT
            wo.id,
            wo.title,
            wo.status,
            wo.priority,
            wo.assigned_technician_id,
            wo.property_id,
            p.name AS property_name,
            wo.client_id,
            c.display_name AS client_display_name,
            wo.vendor_id,
            v.name AS vendor_name,
            wo.created_at,
            wo.sla_due_at
        FROM work_orders wo
        LEFT JOIN properties p
            ON p.id = wo.property_id
           AND p.organization_id = wo.organization_id
        LEFT JOIN clients c
            ON c.id = wo.client_id
           AND c.organization_id = wo.organization_id
        LEFT JOIN vendors v
            ON v.id = wo.vendor_id
           AND v.organization_id = wo.organization_id
        WHERE wo.organization_id = :organization_id
          AND wo.status IN ('open', 'in_progress', 'paused', 'escalated')
        ORDER BY
            CASE
                WHEN wo.sla_due_at IS NOT NULL AND wo.sla_due_at <= NOW() THEN 0
                WHEN wo.sla_due_at IS NOT NULL AND wo.sla_due_at <= NOW() + INTERVAL '2 hours' THEN 1
                ELSE 2
            END,
            CASE wo.priority
                WHEN 'emergency' THEN 0
                WHEN 'high' THEN 1
                WHEN 'medium' THEN 2
                WHEN 'low' THEN 3
                ELSE 99
            END,
            wo.created_at ASC
        """,
        {"organization_id": organization_id},
    )


def list_potential_duplicates(
    organization_id: int,
    *,
    property_id: Optional[int] = None,
    address: Optional[str] = None,
    service_type: str = "general",
    window_days: int = 30,
    limit: int = 5,
) -> list[dict]:
    """v1.3 duplicate warning: recent active/recent work matching location and service."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=window_days)
    normalized_address = address.strip() if address else None
    if not property_id and not normalized_address:
        return []

    location_clauses = []
    params = {
        "organization_id": organization_id,
        "property_id": property_id,
        "address": f"%{normalized_address}%" if normalized_address else None,
        "service_type": service_type,
        "cutoff": cutoff,
        "limit": limit,
    }
    if property_id:
        location_clauses.append("wo.property_id = :property_id")
    if normalized_address:
        location_clauses.append("wo.address ILIKE :address")

    return fetch_all(
        f"""
        SELECT
            wo.id,
            wo.title,
            wo.status,
            wo.priority,
            wo.property_id,
            p.name AS property_name,
            wo.customer_name,
            wo.address,
            wo.service_type,
            wo.created_at,
            CASE
                WHEN wo.property_id IS NOT NULL
                 AND wo.property_id = :property_id
                 AND lower(wo.service_type) = lower(:service_type)
                    THEN 'same property and service type'
                WHEN wo.address IS NOT NULL
                 AND wo.address ILIKE :address
                 AND lower(wo.service_type) = lower(:service_type)
                    THEN 'similar address and service type'
                ELSE 'similar active or recent work'
            END AS similarity_reason
        FROM work_orders wo
        LEFT JOIN properties p
            ON p.id = wo.property_id
           AND p.organization_id = wo.organization_id
        WHERE wo.organization_id = :organization_id
          AND wo.created_at >= :cutoff
          AND wo.status IN ('open', 'in_progress', 'paused', 'escalated', 'completed')
          AND lower(wo.service_type) = lower(:service_type)
          AND ({' OR '.join(location_clauses)})
        ORDER BY
            CASE wo.status
                WHEN 'open' THEN 0
                WHEN 'in_progress' THEN 1
                WHEN 'escalated' THEN 2
                WHEN 'paused' THEN 3
                WHEN 'completed' THEN 4
                ELSE 99
            END,
            wo.created_at DESC
        LIMIT :limit
        """,
        params,
    )
