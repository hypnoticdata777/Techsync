"""Data access for organizations (tenants)."""

import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from core.config import settings
from supabase_client import get_supabase_client


def slugify(name: str) -> str:
    import re

    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug or "org"


def create_organization(
    name: str,
    industry: Optional[str],
    org_timezone: str,
) -> dict:
    client = get_supabase_client()

    base_slug = slugify(name)
    slug = base_slug
    suffix = 1
    while client.table("organizations").select("id").eq("slug", slug).execute().data:
        suffix += 1
        slug = f"{base_slug}-{suffix}"

    trial_ends_at = datetime.now(timezone.utc) + timedelta(days=settings.TRIAL_LENGTH_DAYS)

    response = (
        client.table("organizations")
        .insert(
            {
                "name": name,
                "slug": slug,
                "industry": industry,
                "timezone": org_timezone,
                "plan": "trial",
                "subscription_status": "trialing",
                "trial_ends_at": trial_ends_at.isoformat(),
                "technician_limit": settings.DEFAULT_TECHNICIAN_LIMIT,
                "api_key": secrets.token_urlsafe(24),
            }
        )
        .execute()
    )
    return response.data[0]


def get_by_api_key(api_key: str) -> Optional[dict]:
    client = get_supabase_client()
    response = client.table("organizations").select("*").eq("api_key", api_key).execute()
    return response.data[0] if response.data else None


def regenerate_api_key(organization_id: int) -> Optional[dict]:
    client = get_supabase_client()
    response = (
        client.table("organizations")
        .update({"api_key": secrets.token_urlsafe(24)})
        .eq("id", organization_id)
        .execute()
    )
    return response.data[0] if response.data else None


def get_by_id(organization_id: int) -> Optional[dict]:
    client = get_supabase_client()
    response = client.table("organizations").select("*").eq("id", organization_id).execute()
    return response.data[0] if response.data else None


def get_by_stripe_customer_id(stripe_customer_id: str) -> Optional[dict]:
    client = get_supabase_client()
    response = (
        client.table("organizations")
        .select("*")
        .eq("stripe_customer_id", stripe_customer_id)
        .execute()
    )
    return response.data[0] if response.data else None


def update_settings(organization_id: int, settings_patch: dict) -> Optional[dict]:
    client = get_supabase_client()
    current = get_by_id(organization_id)
    if not current:
        return None

    merged = {**(current.get("settings") or {}), **settings_patch}
    response = (
        client.table("organizations")
        .update({"settings": merged})
        .eq("id", organization_id)
        .execute()
    )
    return response.data[0] if response.data else None


def update_timezone(organization_id: int, org_timezone: str) -> Optional[dict]:
    client = get_supabase_client()
    response = (
        client.table("organizations")
        .update({"timezone": org_timezone})
        .eq("id", organization_id)
        .execute()
    )
    return response.data[0] if response.data else None


def update_billing(organization_id: int, patch: dict) -> Optional[dict]:
    client = get_supabase_client()
    response = client.table("organizations").update(patch).eq("id", organization_id).execute()
    return response.data[0] if response.data else None


def soft_delete(organization_id: int) -> bool:
    """RNF-13: allow deletion of a tenant's data on request."""
    client = get_supabase_client()
    now = datetime.now(timezone.utc).isoformat()
    response = (
        client.table("organizations")
        .update({"deleted_at": now})
        .eq("id", organization_id)
        .execute()
    )
    return bool(response.data)


def hard_delete(organization_id: int) -> bool:
    """Actually erase a tenant's rows (cascades via FK) -- used for POC test cleanup."""
    client = get_supabase_client()
    response = client.table("organizations").delete().eq("id", organization_id).execute()
    return bool(response.data)
