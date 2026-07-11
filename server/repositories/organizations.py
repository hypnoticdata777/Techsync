"""Data access for organizations (tenants)."""

import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from core.config import settings
from database import delete_rows, fetch_one, insert_row, select_one, update_row


def slugify(name: str) -> str:
    import re

    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug or "org"


def create_organization(
    name: str,
    industry: Optional[str],
    org_timezone: str,
) -> dict:
    base_slug = slugify(name)
    slug = base_slug
    suffix = 1
    while select_one("organizations", {"slug": slug}):
        suffix += 1
        slug = f"{base_slug}-{suffix}"

    trial_ends_at = datetime.now(timezone.utc) + timedelta(days=settings.TRIAL_LENGTH_DAYS)

    return insert_row(
        "organizations",
        {
            "name": name,
            "slug": slug,
            "industry": industry,
            "timezone": org_timezone,
            "plan": "trial",
            "subscription_status": "trialing",
            "trial_ends_at": trial_ends_at,
            "technician_limit": settings.DEFAULT_TECHNICIAN_LIMIT,
            "api_key": secrets.token_urlsafe(24),
        },
    )


def get_by_api_key(api_key: str) -> Optional[dict]:
    return select_one("organizations", {"api_key": api_key})


def regenerate_api_key(organization_id: int) -> Optional[dict]:
    return update_row("organizations", {"api_key": secrets.token_urlsafe(24)}, {"id": organization_id})


def get_by_id(organization_id: int) -> Optional[dict]:
    return select_one("organizations", {"id": organization_id})


def get_by_stripe_customer_id(stripe_customer_id: str) -> Optional[dict]:
    return select_one("organizations", {"stripe_customer_id": stripe_customer_id})


def update_settings(organization_id: int, settings_patch: dict) -> Optional[dict]:
    current = get_by_id(organization_id)
    if not current:
        return None

    merged = {**(current.get("settings") or {}), **settings_patch}
    return update_row("organizations", {"settings": merged}, {"id": organization_id})


def update_timezone(organization_id: int, org_timezone: str) -> Optional[dict]:
    return update_row("organizations", {"timezone": org_timezone}, {"id": organization_id})


def update_billing(organization_id: int, patch: dict) -> Optional[dict]:
    return update_row("organizations", patch, {"id": organization_id})


def soft_delete(organization_id: int) -> bool:
    """RNF-13: allow deletion of a tenant's data on request."""
    updated = update_row("organizations", {"deleted_at": datetime.now(timezone.utc)}, {"id": organization_id})
    return bool(updated)


def hard_delete(organization_id: int) -> bool:
    """Actually erase a tenant's rows (cascades via FK) -- used for POC test cleanup."""
    rows = delete_rows("organizations", {"id": organization_id})
    return bool(rows)
