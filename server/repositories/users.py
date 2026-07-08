"""Data access for users, always scoped by organization_id where applicable (RF-05)."""

from typing import Optional

from supabase_client import get_supabase_client


def create_user(organization_id: int, email: str, password_hash: str, full_name: str, role: str) -> dict:
    client = get_supabase_client()
    response = (
        client.table("users")
        .insert(
            {
                "organization_id": organization_id,
                "email": email,
                "password_hash": password_hash,
                "full_name": full_name,
                "role": role,
            }
        )
        .execute()
    )
    return response.data[0]


def get_by_email(email: str) -> Optional[dict]:
    """Email is globally unique, so lookup by email alone is safe (used only at login)."""
    client = get_supabase_client()
    response = client.table("users").select("*").eq("email", email).execute()
    return response.data[0] if response.data else None


def get_by_id_in_org(user_id: int, organization_id: int) -> Optional[dict]:
    client = get_supabase_client()
    response = (
        client.table("users")
        .select("*")
        .eq("id", user_id)
        .eq("organization_id", organization_id)
        .execute()
    )
    return response.data[0] if response.data else None


def list_by_org(organization_id: int) -> list[dict]:
    client = get_supabase_client()
    response = client.table("users").select("*").eq("organization_id", organization_id).execute()
    return response.data or []


def count_by_org_and_role(organization_id: int, role: str) -> int:
    client = get_supabase_client()
    response = (
        client.table("users")
        .select("id", count="exact")
        .eq("organization_id", organization_id)
        .eq("role", role)
        .execute()
    )
    return response.count or 0


def update_password(user_id: int, password_hash: str) -> None:
    client = get_supabase_client()
    client.table("users").update({"password_hash": password_hash}).eq("id", user_id).execute()


def update_role_and_status(user_id: int, organization_id: int, patch: dict) -> Optional[dict]:
    client = get_supabase_client()
    response = (
        client.table("users")
        .update(patch)
        .eq("id", user_id)
        .eq("organization_id", organization_id)
        .execute()
    )
    return response.data[0] if response.data else None
