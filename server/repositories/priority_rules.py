"""Data access for configurable per-org priority rules (RF-17)."""

from typing import Optional

from supabase_client import get_supabase_client


def get_forced_priority(organization_id: int, service_type: str) -> Optional[str]:
    client = get_supabase_client()
    response = (
        client.table("org_priority_rules")
        .select("forced_priority")
        .eq("organization_id", organization_id)
        .eq("service_type", service_type)
        .execute()
    )
    return response.data[0]["forced_priority"] if response.data else None


def upsert_rule(organization_id: int, service_type: str, forced_priority: str) -> dict:
    client = get_supabase_client()
    response = (
        client.table("org_priority_rules")
        .upsert(
            {
                "organization_id": organization_id,
                "service_type": service_type,
                "forced_priority": forced_priority,
            },
            on_conflict="organization_id,service_type",
        )
        .execute()
    )
    return response.data[0]


def list_by_org(organization_id: int) -> list[dict]:
    client = get_supabase_client()
    response = (
        client.table("org_priority_rules").select("*").eq("organization_id", organization_id).execute()
    )
    return response.data or []
