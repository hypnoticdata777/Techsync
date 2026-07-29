"""Tenant-owned JSON export bundle without auth/provider secrets."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from repositories import (
    attachments as attachments_repo,
    clients as clients_repo,
    properties as properties_repo,
    technicians as technicians_repo,
    users as users_repo,
    vendors as vendors_repo,
    work_order_events as events_repo,
    work_order_messages as messages_repo,
    work_orders as work_orders_repo,
)

OMITTED_SENSITIVE_FIELDS = {
    "api_key",
    "password_hash",
    "stripe_customer_id",
    "stripe_subscription_id",
    "storage_path",
    "token_hash",
}

ORGANIZATION_FIELDS = [
    "id",
    "name",
    "slug",
    "industry",
    "timezone",
    "settings",
    "plan",
    "subscription_status",
    "trial_ends_at",
    "technician_limit",
]

USER_FIELDS = [
    "id",
    "organization_id",
    "email",
    "full_name",
    "role",
    "is_active",
    "created_at",
    "updated_at",
]

TECHNICIAN_FIELDS = [
    "id",
    "organization_id",
    "user_id",
    "skills",
    "zone",
    "latitude",
    "longitude",
    "availability_status",
    "max_daily_jobs",
    "created_at",
    "updated_at",
    "users",
]

ATTACHMENT_METADATA_FIELDS = [
    "id",
    "work_order_id",
    "uploaded_by",
    "file_name",
    "content_type",
    "size_bytes",
    "created_at",
]


def _pick(row: dict[str, Any], fields: list[str]) -> dict[str, Any]:
    return {field: row.get(field) for field in fields if field in row}


def _sanitize(row: dict[str, Any]) -> dict[str, Any]:
    clean = {}
    for key, value in row.items():
        if key in OMITTED_SENSITIVE_FIELDS:
            continue
        clean[key] = value
    return clean


def build_tenant_export(organization: dict[str, Any]) -> dict[str, Any]:
    """Build an org-scoped export bundle for admin-controlled data portability.

    The bundle intentionally excludes credential-bearing fields and attachment
    storage paths. It is suitable for demo evidence and customer data export
    workflows, but binary files still need a provider-specific storage export.
    """

    organization_id = organization["id"]
    users = [_pick(row, USER_FIELDS) for row in users_repo.list_by_org(organization_id)]
    technicians = [_pick(row, TECHNICIAN_FIELDS) for row in technicians_repo.list_by_org(organization_id)]
    clients = [_sanitize(row) for row in clients_repo.list_by_org(organization_id)]
    properties = [_sanitize(row) for row in properties_repo.list_by_org(organization_id)]
    vendors = [_sanitize(row) for row in vendors_repo.list_by_org(organization_id)]
    work_orders = [_sanitize(row) for row in work_orders_repo.list_filtered(organization_id)]
    messages = [_sanitize(row) for row in messages_repo.list_by_org(organization_id)]
    audit_events = [_sanitize(row) for row in events_repo.list_by_org(organization_id)]
    attachment_metadata = [
        _pick(row, ATTACHMENT_METADATA_FIELDS) for row in attachments_repo.list_metadata_by_org(organization_id)
    ]

    data = {
        "users": users,
        "technicians": technicians,
        "clients": clients,
        "properties": properties,
        "vendors": vendors,
        "work_orders": work_orders,
        "work_order_messages": messages,
        "work_order_events": audit_events,
        "attachment_metadata": attachment_metadata,
    }

    return {
        "schema_version": "techsync_ops_tenant_export.v1",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "organization": _pick(organization, ORGANIZATION_FIELDS),
        "record_counts": {key: len(rows) for key, rows in data.items()},
        "data": data,
        "omitted_sensitive_fields": sorted(OMITTED_SENSITIVE_FIELDS),
        "notes": [
            "Attachment binary files are not embedded in this JSON bundle.",
            "Attachment storage paths, API keys, password hashes, provider IDs, and token hashes are omitted.",
        ],
    }
