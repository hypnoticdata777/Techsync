"""Data access for work orders, always scoped by organization_id (RF-05, RF-18, RF-21)."""

from datetime import date
from typing import Optional

from supabase_client import get_supabase_client


def create(organization_id: int, patch: dict) -> dict:
    client = get_supabase_client()
    response = client.table("work_orders").insert({"organization_id": organization_id, **patch}).execute()
    return response.data[0]


def get_by_id_in_org(work_order_id: int, organization_id: int) -> Optional[dict]:
    client = get_supabase_client()
    response = (
        client.table("work_orders")
        .select("*")
        .eq("id", work_order_id)
        .eq("organization_id", organization_id)
        .execute()
    )
    return response.data[0] if response.data else None


def update(work_order_id: int, organization_id: int, patch: dict) -> Optional[dict]:
    client = get_supabase_client()
    response = (
        client.table("work_orders")
        .update(patch)
        .eq("id", work_order_id)
        .eq("organization_id", organization_id)
        .execute()
    )
    return response.data[0] if response.data else None


def list_filtered(
    organization_id: int,
    status: Optional[str] = None,
    technician_id: Optional[int] = None,
    customer_name: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
) -> list[dict]:
    """RF-21: combined filter by status, technician, customer, date range."""
    client = get_supabase_client()
    query = client.table("work_orders").select("*").eq("organization_id", organization_id)

    if status:
        query = query.eq("status", status)
    if technician_id:
        query = query.eq("assigned_technician_id", technician_id)
    if customer_name:
        query = query.ilike("customer_name", f"%{customer_name}%")
    if date_from:
        query = query.gte("created_at", date_from.isoformat())
    if date_to:
        query = query.lte("created_at", date_to.isoformat())

    response = query.order("created_at", desc=True).execute()
    return response.data or []


def list_for_technician(organization_id: int, technician_id: int) -> list[dict]:
    """RF-22: technician's assigned work orders ordered by priority."""
    client = get_supabase_client()
    priority_order = {"emergency": 0, "high": 1, "medium": 2, "low": 3}
    response = (
        client.table("work_orders")
        .select("*")
        .eq("organization_id", organization_id)
        .eq("assigned_technician_id", technician_id)
        .in_("status", ["open", "in_progress"])
        .execute()
    )
    rows = response.data or []
    return sorted(rows, key=lambda r: priority_order.get(r.get("priority"), 99))


def counts_by_status(organization_id: int) -> dict[str, int]:
    client = get_supabase_client()
    response = (
        client.table("work_orders").select("status").eq("organization_id", organization_id).execute()
    )
    rows = response.data or []
    counts = {"open": 0, "in_progress": 0, "completed": 0, "cancelled": 0}
    for row in rows:
        status_value = row.get("status")
        if status_value in counts:
            counts[status_value] += 1
    return counts


def count_sla_at_risk(organization_id: int) -> int:
    from datetime import datetime, timedelta, timezone

    client = get_supabase_client()
    soon = (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
    response = (
        client.table("work_orders")
        .select("id", count="exact")
        .eq("organization_id", organization_id)
        .in_("status", ["open", "in_progress"])
        .not_.is_("sla_due_at", "null")
        .lte("sla_due_at", soon)
        .execute()
    )
    return response.count or 0
