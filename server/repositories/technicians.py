"""Data access for technician profiles (RF-14, RF-26)."""

from typing import Optional

from supabase_client import get_supabase_client


def create_technician(organization_id: int, user_id: int, patch: dict) -> dict:
    client = get_supabase_client()
    response = (
        client.table("technicians")
        .insert({"organization_id": organization_id, "user_id": user_id, **patch})
        .execute()
    )
    return response.data[0]


def get_by_id_in_org(technician_id: int, organization_id: int) -> Optional[dict]:
    client = get_supabase_client()
    response = (
        client.table("technicians")
        .select("*, users!inner(full_name, email, is_active)")
        .eq("id", technician_id)
        .eq("organization_id", organization_id)
        .execute()
    )
    return response.data[0] if response.data else None


def get_by_user_id(user_id: int, organization_id: int) -> Optional[dict]:
    client = get_supabase_client()
    response = (
        client.table("technicians")
        .select("*, users!inner(full_name, email, is_active)")
        .eq("user_id", user_id)
        .eq("organization_id", organization_id)
        .execute()
    )
    return response.data[0] if response.data else None


def list_by_org(organization_id: int) -> list[dict]:
    client = get_supabase_client()
    response = (
        client.table("technicians")
        .select("*, users!inner(full_name, email, is_active)")
        .eq("organization_id", organization_id)
        .execute()
    )
    return response.data or []


def update(technician_id: int, organization_id: int, patch: dict) -> Optional[dict]:
    client = get_supabase_client()
    response = (
        client.table("technicians")
        .update(patch)
        .eq("id", technician_id)
        .eq("organization_id", organization_id)
        .execute()
    )
    return response.data[0] if response.data else None
