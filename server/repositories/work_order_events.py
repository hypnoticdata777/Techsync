"""Data access for the work order audit log (RF-20)."""

from supabase_client import get_supabase_client


def create_event(
    organization_id: int,
    work_order_id: int,
    event_type: str,
    actor_user_id: int | None = None,
    from_status: str | None = None,
    to_status: str | None = None,
    notes: str | None = None,
) -> dict:
    client = get_supabase_client()
    response = (
        client.table("work_order_events")
        .insert(
            {
                "organization_id": organization_id,
                "work_order_id": work_order_id,
                "event_type": event_type,
                "actor_user_id": actor_user_id,
                "from_status": from_status,
                "to_status": to_status,
                "notes": notes,
            }
        )
        .execute()
    )
    return response.data[0]


def list_for_work_order(organization_id: int, work_order_id: int) -> list[dict]:
    client = get_supabase_client()
    response = (
        client.table("work_order_events")
        .select("*")
        .eq("organization_id", organization_id)
        .eq("work_order_id", work_order_id)
        .order("created_at", desc=True)
        .execute()
    )
    return response.data or []
