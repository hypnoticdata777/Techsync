"""Data access for work order attachments (RF-19)."""

from supabase_client import get_supabase_client


def create(organization_id: int, work_order_id: int, uploaded_by: int, patch: dict) -> dict:
    client = get_supabase_client()
    response = (
        client.table("work_order_attachments")
        .insert(
            {
                "organization_id": organization_id,
                "work_order_id": work_order_id,
                "uploaded_by": uploaded_by,
                **patch,
            }
        )
        .execute()
    )
    return response.data[0]


def list_for_work_order(organization_id: int, work_order_id: int) -> list[dict]:
    client = get_supabase_client()
    response = (
        client.table("work_order_attachments")
        .select("*")
        .eq("organization_id", organization_id)
        .eq("work_order_id", work_order_id)
        .order("created_at", desc=True)
        .execute()
    )
    return response.data or []
