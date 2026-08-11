"""Seed or reset a synthetic TechSync Ops demo tenant.

This script is intentionally scoped to one deterministic synthetic organization
slug. Reset mode deletes only that organization, relying on tenant FK cascades.
It is for local/demo databases only, never real customer data.
"""

from __future__ import annotations

import argparse
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from types import SimpleNamespace
from typing import Any


SERVER_DIR = Path(__file__).resolve().parents[1] / "server"


DEMO_ORG_NAME = "TechSync Ops Demo PMC"
DEMO_ORG_SLUG = "techsync-ops-demo-pmc"
DEFAULT_PASSWORD = os.getenv("TECHSYNC_DEMO_PASSWORD", "DemoPass123!")
APP_MODULES: SimpleNamespace | None = None

EXPECTED_COUNTS = {
    "users": 10,
    "technicians": 3,
    "clients": 3,
    "properties": 3,
    "vendors": 3,
    "work_orders": 8,
    "messages": 4,
    "attachments": 1,
    "events": 13,
}

EXPECTED_LOGIN_EMAILS = (
    "admin.demo@demo.techsyncops.dev",
    "coordinator.demo@demo.techsyncops.dev",
    "client.demo@demo.techsyncops.dev",
    "owner-group.demo@demo.techsyncops.dev",
    "apex.demo@demo.techsyncops.dev",
    "quiet-owner.demo@demo.techsyncops.dev",
    "quiet-vendor.demo@demo.techsyncops.dev",
    "lena.tech@demo.techsyncops.dev",
    "marco.tech@demo.techsyncops.dev",
    "priya.tech@demo.techsyncops.dev",
)

EXPECTED_SCENARIO_LABELS = {
    "manager_lifecycle_depth": "manager queue has open, in-progress, paused, escalated, completed, and archived work",
    "technician_active_targets": "technician screenshot targets include active assigned work",
    "client_pending_approval": "client screenshot target includes pending approval work",
    "viewer_scoped_work": "viewer screenshot target includes linked owner-group work",
    "quiet_viewer_empty": "no-work viewer account has no linked work",
    "vendor_linked_work": "vendor screenshot target includes linked Apex work",
    "vendor_visible_message": "vendor screenshot target includes a vendor-visible message",
    "quiet_vendor_empty": "no-work vendor account has no linked work",
}


class SeedError(RuntimeError):
    pass


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _app() -> SimpleNamespace:
    global APP_MODULES
    if APP_MODULES is not None:
        return APP_MODULES

    sys.path.insert(0, str(SERVER_DIR))
    os.environ.setdefault("JWT_SECRET_KEY", "local-demo-seed-script-only-not-for-hosting")

    from core.security import get_password_hash
    from database import fetch_one, fetch_scalar
    from repositories import (
        attachments as attachments_repo,
        clients as clients_repo,
        organizations as organizations_repo,
        properties as properties_repo,
        technicians as technicians_repo,
        users as users_repo,
        vendors as vendors_repo,
        work_order_events as events_repo,
        work_order_messages as messages_repo,
        work_orders as work_orders_repo,
    )

    APP_MODULES = SimpleNamespace(
        attachments_repo=attachments_repo,
        clients_repo=clients_repo,
        events_repo=events_repo,
        fetch_one=fetch_one,
        fetch_scalar=fetch_scalar,
        get_password_hash=get_password_hash,
        messages_repo=messages_repo,
        organizations_repo=organizations_repo,
        properties_repo=properties_repo,
        technicians_repo=technicians_repo,
        users_repo=users_repo,
        vendors_repo=vendors_repo,
        work_orders_repo=work_orders_repo,
    )
    return APP_MODULES


def _get_demo_org() -> dict | None:
    return _app().fetch_one("SELECT * FROM organizations WHERE slug = :slug", {"slug": DEMO_ORG_SLUG})


def _count(table: str, organization_id: int) -> int:
    return int(
        _app().fetch_scalar(
            f"SELECT COUNT(*) FROM {table} WHERE organization_id = :organization_id",
            {"organization_id": organization_id},
        )
        or 0
    )


def _scalar_bool(sql: str, params: dict[str, Any]) -> bool:
    return bool(_app().fetch_scalar(sql, params))


def _count_scalar(sql: str, params: dict[str, Any]) -> int:
    return int(_app().fetch_scalar(sql, params) or 0)


def evaluate_demo_readiness(status: dict[str, Any]) -> dict[str, Any]:
    failures: list[str] = []
    if not status.get("exists"):
        return {"ready": False, "failures": ["Demo organization is not seeded."]}

    counts = status.get("counts", {})
    for name, expected in EXPECTED_COUNTS.items():
        actual = counts.get(name)
        if actual != expected:
            failures.append(f"{name} count is {actual}; expected {expected}.")

    for email, present in status.get("expected_users", {}).items():
        if not present:
            failures.append(f"Missing synthetic login user: {email}.")

    for key, passed in status.get("scenario_checks", {}).items():
        if not passed:
            label = EXPECTED_SCENARIO_LABELS.get(key, key)
            failures.append(f"Missing scenario: {label}.")

    return {"ready": not failures, "failures": failures}


def _expected_user_presence(organization_id: int) -> dict[str, bool]:
    return {
        email: _scalar_bool(
            """
            SELECT EXISTS (
                SELECT 1 FROM users
                WHERE organization_id = :organization_id AND email = :email
            )
            """,
            {"organization_id": organization_id, "email": email},
        )
        for email in EXPECTED_LOGIN_EMAILS
    }


def _work_order_exists(organization_id: int, title: str, extra_where: str = "", extra_params: dict[str, Any] | None = None) -> bool:
    params = {"organization_id": organization_id, "title": title}
    params.update(extra_params or {})
    return _scalar_bool(
        f"""
        SELECT EXISTS (
            SELECT 1 FROM work_orders
            WHERE organization_id = :organization_id
              AND title = :title
              {extra_where}
        )
        """,
        params,
    )


def _client_has_no_work(organization_id: int, email: str) -> bool:
    return _count_scalar(
        """
        SELECT COUNT(*)
        FROM work_orders wo
        JOIN clients c ON c.id = wo.client_id
        WHERE wo.organization_id = :organization_id
          AND c.organization_id = :organization_id
          AND c.email = :email
        """,
        {"organization_id": organization_id, "email": email},
    ) == 0


def _vendor_has_no_work(organization_id: int, email: str) -> bool:
    return _count_scalar(
        """
        SELECT COUNT(*)
        FROM work_orders wo
        JOIN vendors v ON v.id = wo.vendor_id
        WHERE wo.organization_id = :organization_id
          AND v.organization_id = :organization_id
          AND v.email = :email
        """,
        {"organization_id": organization_id, "email": email},
    ) == 0


def _scenario_checks(organization_id: int) -> dict[str, bool]:
    expected_users = _expected_user_presence(organization_id)
    lifecycle_statuses = (
        "open",
        "in_progress",
        "paused",
        "escalated",
        "completed",
        "archived",
    )
    return {
        "manager_lifecycle_depth": all(
            _count_scalar(
                """
                SELECT COUNT(*) FROM work_orders
                WHERE organization_id = :organization_id AND status = :status
                """,
                {"organization_id": organization_id, "status": status},
            )
            > 0
            for status in lifecycle_statuses
        ),
        "technician_active_targets": _work_order_exists(
            organization_id,
            "Lobby breaker panel inspection",
            "AND assigned_technician_id IS NOT NULL AND status = 'in_progress'",
        )
        and _work_order_exists(
            organization_id,
            "Escalated roof access safety review",
            "AND assigned_technician_id IS NOT NULL AND status = 'escalated'",
        ),
        "client_pending_approval": _work_order_exists(
            organization_id,
            "Emergency leak under kitchen sink",
            "AND client_approval_status = 'pending'",
        ),
        "viewer_scoped_work": _scalar_bool(
            """
            SELECT EXISTS (
                SELECT 1
                FROM work_orders wo
                JOIN clients c ON c.id = wo.client_id
                WHERE wo.organization_id = :organization_id
                  AND c.organization_id = :organization_id
                  AND c.email = 'owner-group.demo@demo.techsyncops.dev'
                  AND wo.title = 'Townhome HVAC noise follow-up'
            )
            """,
            {"organization_id": organization_id},
        ),
        "quiet_viewer_empty": expected_users.get(
            "quiet-owner.demo@demo.techsyncops.dev",
            False,
        )
        and _client_has_no_work(organization_id, "quiet-owner.demo@demo.techsyncops.dev"),
        "vendor_linked_work": _scalar_bool(
            """
            SELECT EXISTS (
                SELECT 1
                FROM work_orders wo
                JOIN vendors v ON v.id = wo.vendor_id
                WHERE wo.organization_id = :organization_id
                  AND v.organization_id = :organization_id
                  AND v.email = 'apex.demo@demo.techsyncops.dev'
                  AND wo.title = 'Emergency leak under kitchen sink'
            )
            """,
            {"organization_id": organization_id},
        ),
        "vendor_visible_message": _scalar_bool(
            """
            SELECT EXISTS (
                SELECT 1
                FROM work_order_messages wom
                JOIN work_orders wo ON wo.id = wom.work_order_id
                WHERE wom.organization_id = :organization_id
                  AND wo.organization_id = :organization_id
                  AND wo.title = 'Emergency leak under kitchen sink'
                  AND wom.visibility = 'vendor'
            )
            """,
            {"organization_id": organization_id},
        ),
        "quiet_vendor_empty": expected_users.get(
            "quiet-vendor.demo@demo.techsyncops.dev",
            False,
        )
        and _vendor_has_no_work(organization_id, "quiet-vendor.demo@demo.techsyncops.dev"),
    }


def reset_demo_org() -> dict[str, Any]:
    org = _get_demo_org()
    if not org:
        return {"deleted": False, "slug": DEMO_ORG_SLUG}
    _app().organizations_repo.hard_delete(org["id"])
    return {"deleted": True, "organization_id": org["id"], "slug": DEMO_ORG_SLUG}


def seed_demo_org(*, reset_existing: bool = False) -> dict[str, Any]:
    existing = _get_demo_org()
    if existing and not reset_existing:
        raise SeedError(
            f"Demo org '{DEMO_ORG_SLUG}' already exists. "
            "Run with --reset-existing to rebuild it."
        )
    if existing:
        reset_demo_org()

    app = _app()
    current_time = _now()
    password_hash = app.get_password_hash(DEFAULT_PASSWORD)

    org = app.organizations_repo.create_organization(
        DEMO_ORG_NAME,
        "property_management",
        "America/New_York",
    )
    organization_id = org["id"]

    admin = app.users_repo.create_user(
        organization_id,
        "admin.demo@demo.techsyncops.dev",
        password_hash,
        "Avery Morgan",
        "org_admin",
    )
    coordinator = app.users_repo.create_user(
        organization_id,
        "coordinator.demo@demo.techsyncops.dev",
        password_hash,
        "Jordan Lee",
        "coordinator",
    )
    client_user = app.users_repo.create_user(
        organization_id,
        "client.demo@demo.techsyncops.dev",
        password_hash,
        "Riley Homeowner",
        "client",
    )
    viewer_user = app.users_repo.create_user(
        organization_id,
        "owner-group.demo@demo.techsyncops.dev",
        password_hash,
        "Morgan Board",
        "viewer",
    )
    vendor_user = app.users_repo.create_user(
        organization_id,
        "apex.demo@demo.techsyncops.dev",
        password_hash,
        "Sam Dispatcher",
        "vendor",
    )
    empty_viewer_user = app.users_repo.create_user(
        organization_id,
        "quiet-owner.demo@demo.techsyncops.dev",
        password_hash,
        "No-Work Owner Group",
        "viewer",
    )
    empty_vendor_user = app.users_repo.create_user(
        organization_id,
        "quiet-vendor.demo@demo.techsyncops.dev",
        password_hash,
        "No-Work Vendor Desk",
        "vendor",
    )

    tech_user_lena = app.users_repo.create_user(
        organization_id,
        "lena.tech@demo.techsyncops.dev",
        password_hash,
        "Lena Ortiz",
        "technician",
    )
    tech_user_marco = app.users_repo.create_user(
        organization_id,
        "marco.tech@demo.techsyncops.dev",
        password_hash,
        "Marco Vega",
        "technician",
    )
    tech_user_priya = app.users_repo.create_user(
        organization_id,
        "priya.tech@demo.techsyncops.dev",
        password_hash,
        "Priya Singh",
        "technician",
    )

    lena = app.technicians_repo.create_technician(
        organization_id,
        tech_user_lena["id"],
        {
            "skills": ["plumbing", "general"],
            "certifications": ["backflow"],
            "zone": "north",
            "latitude": 40.713,
            "longitude": -74.006,
            "availability_status": "available",
            "max_daily_jobs": 4,
        },
    )
    marco = app.technicians_repo.create_technician(
        organization_id,
        tech_user_marco["id"],
        {
            "skills": ["electrical", "hvac"],
            "certifications": ["epa-608"],
            "zone": "central",
            "latitude": 40.721,
            "longitude": -74.01,
            "availability_status": "busy",
            "max_daily_jobs": 1,
        },
    )
    priya = app.technicians_repo.create_technician(
        organization_id,
        tech_user_priya["id"],
        {
            "skills": ["general", "appliance"],
            "certifications": ["osha-10"],
            "zone": "south",
            "latitude": 40.7,
            "longitude": -74.0,
            "availability_status": "available",
            "max_daily_jobs": 3,
        },
    )

    riverside_client = app.clients_repo.create(
        organization_id,
        {
            "display_name": "Riverside HOA",
            "contact_name": "Riley Homeowner",
            "email": client_user["email"],
            "phone": "555-0100",
            "client_type": "homeowner",
            "notes": "Synthetic owner contact for client visibility and approval demo.",
        },
    )
    west_client = app.clients_repo.create(
        organization_id,
        {
            "display_name": "West Garden Owner Group",
            "contact_name": "Morgan Board",
            "email": viewer_user["email"],
            "phone": "555-0101",
            "client_type": "owner",
            "notes": "Synthetic owner group for property hotspot reporting.",
        },
    )
    quiet_client = app.clients_repo.create(
        organization_id,
        {
            "display_name": "No-Work Owner Group",
            "contact_name": "No-Work Owner Group",
            "email": empty_viewer_user["email"],
            "phone": "555-0102",
            "client_type": "owner",
            "notes": "Synthetic no-work viewer profile for empty-state evidence.",
        },
    )

    riverside_unit = app.properties_repo.create(
        organization_id,
        {
            "client_id": riverside_client["id"],
            "name": "Riverside Tower Unit 4B",
            "address_line1": "1300 Demo Ridge",
            "city": "Test City",
            "state": "NY",
            "postal_code": "10001",
            "country": "US",
            "unit": "4B",
            "access_notes": "Use synthetic lockbox code DEMO-0000.",
            "latitude": 40.713,
            "longitude": -74.0062,
        },
    )
    riverside_roof = app.properties_repo.create(
        organization_id,
        {
            "client_id": riverside_client["id"],
            "name": "Riverside Tower Roof",
            "address_line1": "1300 Demo Ridge",
            "city": "Test City",
            "state": "NY",
            "postal_code": "10001",
            "country": "US",
            "unit": "Roof",
            "access_notes": "Synthetic roof access through maintenance stairwell.",
            "latitude": 40.7134,
            "longitude": -74.0065,
        },
    )
    west_townhome = app.properties_repo.create(
        organization_id,
        {
            "client_id": west_client["id"],
            "name": "West Garden Townhome 12",
            "address_line1": "77 Sample Green",
            "city": "Test City",
            "state": "NY",
            "postal_code": "10002",
            "country": "US",
            "unit": "12",
            "access_notes": "Synthetic resident available after 3 PM.",
            "latitude": 40.706,
            "longitude": -74.002,
        },
    )

    apex = app.vendors_repo.create(
        organization_id,
        {
            "name": "Apex Demo Plumbing",
            "contact_name": "Sam Dispatcher",
            "email": vendor_user["email"],
            "phone": "555-0110",
            "service_types": ["plumbing", "general"],
            "coverage_area": "North and central synthetic zones",
            "notes": "Synthetic external vendor for overflow plumbing.",
        },
    )
    brightline = app.vendors_repo.create(
        organization_id,
        {
            "name": "BrightLine Demo Electrical",
            "contact_name": "Casey Electric",
            "email": "brightline.demo@demo.techsyncops.dev",
            "phone": "555-0111",
            "service_types": ["electrical", "hvac"],
            "coverage_area": "All synthetic zones",
            "notes": "Synthetic electrical and HVAC partner.",
        },
    )
    quiet_vendor = app.vendors_repo.create(
        organization_id,
        {
            "name": "No-Work Demo Vendor",
            "contact_name": "No-Work Vendor Desk",
            "email": empty_vendor_user["email"],
            "phone": "555-0112",
            "service_types": ["general"],
            "coverage_area": "Synthetic standby coverage only",
            "notes": "Synthetic no-work vendor profile for empty-state evidence.",
        },
    )

    # Keep no-work scoped personas active without linking work orders. These
    # rows make viewer/vendor empty-state screenshots deterministic after each
    # seed reset.
    _ = quiet_client
    _ = quiet_vendor

    work_orders = []
    work_orders.append(
        app.work_orders_repo.create(
            organization_id,
            {
                "title": "Emergency leak under kitchen sink",
                "description": "Synthetic active leak for SLA-risk and duplicate-warning demos.",
                "property_id": riverside_unit["id"],
                "client_id": riverside_client["id"],
                "vendor_id": apex["id"],
                "customer_name": "Riley Homeowner",
                "address": "1300 Demo Ridge Unit 4B, Test City, NY",
                "latitude": 40.713,
                "longitude": -74.0062,
                "service_type": "plumbing",
                "priority": "emergency",
                "status": "open",
                "created_by": coordinator["id"],
                "source": "manual",
                "external_ref": "DEMO-WO-001",
                "estimated_cost_cents": 47500,
                "actual_cost_cents": 0,
                "sla_due_at": current_time + timedelta(hours=1),
                "client_approval_status": "pending",
                "client_approval_requested_at": current_time - timedelta(hours=1),
                "client_approval_requested_by": coordinator["id"],
                "created_at": current_time - timedelta(days=9),
            },
        )
    )
    work_orders.append(
        app.work_orders_repo.create(
            organization_id,
            {
                "title": "Lobby breaker panel inspection",
                "description": "Synthetic assigned electrical work that makes Marco overloaded.",
                "property_id": riverside_roof["id"],
                "client_id": riverside_client["id"],
                "vendor_id": brightline["id"],
                "customer_name": "Riverside HOA",
                "address": "1300 Demo Ridge Roof, Test City, NY",
                "service_type": "electrical",
                "priority": "high",
                "status": "in_progress",
                "assigned_technician_id": marco["id"],
                "created_by": admin["id"],
                "source": "csv",
                "external_ref": "DEMO-WO-002",
                "estimated_cost_cents": 82500,
                "actual_cost_cents": 91000,
                "invoice_reference": "SYN-BRIGHT-002",
                "sla_due_at": current_time - timedelta(hours=2),
                "created_at": current_time - timedelta(days=5),
            },
        )
    )
    work_orders.append(
        app.work_orders_repo.create(
            organization_id,
            {
                "title": "Common hallway lights flickering",
                "description": "Synthetic second active job for the same technician overload report.",
                "property_id": riverside_roof["id"],
                "client_id": riverside_client["id"],
                "vendor_id": brightline["id"],
                "customer_name": "Riverside HOA",
                "address": "1300 Demo Ridge Floor 8, Test City, NY",
                "service_type": "electrical",
                "priority": "medium",
                "status": "open",
                "assigned_technician_id": marco["id"],
                "created_by": coordinator["id"],
                "source": "manual",
                "external_ref": "DEMO-WO-003",
                "estimated_cost_cents": 35000,
                "sla_due_at": current_time + timedelta(hours=6),
                "created_at": current_time - timedelta(days=2),
            },
        )
    )
    work_orders.append(
        app.work_orders_repo.create(
            organization_id,
            {
                "title": "Completed disposal replacement with proof",
                "description": "Synthetic completed work for closeout package proof.",
                "property_id": riverside_unit["id"],
                "client_id": riverside_client["id"],
                "vendor_id": apex["id"],
                "customer_name": "Riley Homeowner",
                "address": "1300 Demo Ridge Unit 4B, Test City, NY",
                "service_type": "plumbing",
                "priority": "medium",
                "status": "completed",
                "assigned_technician_id": lena["id"],
                "created_by": coordinator["id"],
                "source": "manual",
                "external_ref": "DEMO-WO-004",
                "estimated_cost_cents": 42500,
                "actual_cost_cents": 39800,
                "invoice_reference": "SYN-APEX-004",
                "completed_at": current_time - timedelta(hours=18),
                "completion_notes": "Synthetic disposal replaced and leak test passed.",
                "completion_proof_verified_at": current_time - timedelta(hours=18),
                "client_approval_status": "approved",
                "client_approval_requested_at": current_time - timedelta(days=1, hours=2),
                "client_approval_requested_by": coordinator["id"],
                "client_approval_decision_at": current_time - timedelta(hours=19),
                "client_approval_decision_by": client_user["id"],
                "client_approval_notes": "Synthetic approval accepted.",
                "created_at": current_time - timedelta(days=4),
            },
        )
    )
    work_orders.append(
        app.work_orders_repo.create(
            organization_id,
            {
                "title": "Townhome HVAC noise follow-up",
                "description": "Synthetic active work at a second client property.",
                "property_id": west_townhome["id"],
                "client_id": west_client["id"],
                "vendor_id": brightline["id"],
                "customer_name": "Morgan Board",
                "address": "77 Sample Green Unit 12, Test City, NY",
                "service_type": "hvac",
                "priority": "low",
                "status": "open",
                "assigned_technician_id": priya["id"],
                "created_by": admin["id"],
                "source": "webhook",
                "external_ref": "DEMO-WO-005",
                "estimated_cost_cents": 27500,
                "sla_due_at": current_time + timedelta(days=2),
                "created_at": current_time - timedelta(days=1),
            },
        )
    )
    work_orders.append(
        app.work_orders_repo.create(
            organization_id,
            {
                "title": "Paused cabinet repair waiting on parts",
                "description": "Synthetic paused work to prove hold-state visibility without capacity pressure.",
                "property_id": west_townhome["id"],
                "client_id": west_client["id"],
                "vendor_id": apex["id"],
                "customer_name": "Morgan Board",
                "address": "77 Sample Green Unit 12, Test City, NY",
                "service_type": "general",
                "priority": "medium",
                "status": "paused",
                "assigned_technician_id": priya["id"],
                "created_by": coordinator["id"],
                "source": "manual",
                "external_ref": "DEMO-WO-006",
                "estimated_cost_cents": 18000,
                "actual_cost_cents": 12400,
                "sla_due_at": current_time + timedelta(days=3),
                "created_at": current_time - timedelta(days=6),
            },
        )
    )
    work_orders.append(
        app.work_orders_repo.create(
            organization_id,
            {
                "title": "Escalated roof access safety review",
                "description": "Synthetic escalated work for SLA and coordinator review evidence.",
                "property_id": riverside_roof["id"],
                "client_id": riverside_client["id"],
                "vendor_id": brightline["id"],
                "customer_name": "Riverside HOA",
                "address": "1300 Demo Ridge Roof, Test City, NY",
                "service_type": "general",
                "priority": "high",
                "status": "escalated",
                "assigned_technician_id": marco["id"],
                "created_by": admin["id"],
                "source": "manual",
                "external_ref": "DEMO-WO-007",
                "estimated_cost_cents": 120000,
                "actual_cost_cents": 150000,
                "invoice_reference": "SYN-BRIGHT-007",
                "sla_due_at": current_time + timedelta(hours=90),
                "created_at": current_time - timedelta(days=10),
            },
        )
    )
    work_orders.append(
        app.work_orders_repo.create(
            organization_id,
            {
                "title": "Archived seasonal gutter check",
                "description": "Synthetic archived work retained for historical traceability.",
                "property_id": west_townhome["id"],
                "client_id": west_client["id"],
                "vendor_id": apex["id"],
                "customer_name": "Morgan Board",
                "address": "77 Sample Green Exterior, Test City, NY",
                "service_type": "general",
                "priority": "low",
                "status": "archived",
                "assigned_technician_id": lena["id"],
                "created_by": admin["id"],
                "source": "manual",
                "external_ref": "DEMO-WO-008",
                "estimated_cost_cents": 22000,
                "actual_cost_cents": 20500,
                "invoice_reference": "SYN-APEX-008",
                "completed_at": current_time - timedelta(days=20),
                "completion_notes": "Synthetic historical closeout retained for archive proof.",
                "completion_override_reason": "Archived synthetic history for demo evidence.",
                "client_approval_status": "not_required",
                "created_at": current_time - timedelta(days=25),
            },
        )
    )

    for item in work_orders:
        app.events_repo.create_event(
            organization_id,
            item["id"],
            "created",
            actor_user_id=item.get("created_by"),
            notes=f"Synthetic seed created {item['external_ref']}.",
        )

    app.events_repo.create_event(
        organization_id,
        work_orders[1]["id"],
        "status_changed",
        actor_user_id=tech_user_marco["id"],
        from_status="open",
        to_status="in_progress",
        notes="Synthetic technician started breaker inspection.",
    )
    app.events_repo.create_event(
        organization_id,
        work_orders[3]["id"],
        "status_changed",
        actor_user_id=tech_user_lena["id"],
        from_status="in_progress",
        to_status="completed",
        notes="Synthetic technician completed work with proof.",
    )
    app.events_repo.create_event(
        organization_id,
        work_orders[5]["id"],
        "status_changed",
        actor_user_id=coordinator["id"],
        from_status="in_progress",
        to_status="paused",
        notes="Synthetic coordinator paused work while waiting on parts.",
    )
    app.events_repo.create_event(
        organization_id,
        work_orders[6]["id"],
        "status_changed",
        actor_user_id=admin["id"],
        from_status="open",
        to_status="escalated",
        notes="Synthetic admin escalated for safety review.",
    )
    app.events_repo.create_event(
        organization_id,
        work_orders[7]["id"],
        "status_changed",
        actor_user_id=admin["id"],
        from_status="completed",
        to_status="archived",
        notes="Synthetic completed work archived for historical traceability.",
    )

    app.messages_repo.create(
        organization_id,
        work_orders[0]["id"],
        coordinator["id"],
        {
            "visibility": "internal",
            "body": "Synthetic dispatcher note: verify shutoff before vendor arrival.",
        },
    )
    app.messages_repo.create(
        organization_id,
        work_orders[0]["id"],
        coordinator["id"],
        {
            "visibility": "client",
            "body": "We flagged this as emergency priority and requested approval for immediate dispatch.",
        },
    )
    app.messages_repo.create(
        organization_id,
        work_orders[0]["id"],
        vendor_user["id"],
        {
            "visibility": "vendor",
            "body": "Synthetic vendor update: Apex confirmed ETA and requested shutoff access.",
        },
    )
    app.messages_repo.create(
        organization_id,
        work_orders[3]["id"],
        tech_user_lena["id"],
        {
            "visibility": "client",
            "body": "Synthetic completion note: disposal replaced, leak test passed.",
        },
    )

    app.attachments_repo.create(
        organization_id,
        work_orders[3]["id"],
        tech_user_lena["id"],
        {
            "file_name": "synthetic-disposal-after.jpg",
            "file_url": "https://example.com/techsync-ops-demo/synthetic-disposal-after.jpg",
            "content_type": "image/jpeg",
        },
    )

    return {
        "organization_id": organization_id,
        "organization_slug": org["slug"],
        "users": {
            "admin": admin["email"],
            "coordinator": coordinator["email"],
            "client": client_user["email"],
            "viewer": viewer_user["email"],
            "vendor": vendor_user["email"],
            "empty_viewer": empty_viewer_user["email"],
            "empty_vendor": empty_vendor_user["email"],
            "technicians": [tech_user_lena["email"], tech_user_marco["email"], tech_user_priya["email"]],
        },
        "counts": get_demo_status()["counts"],
    }


def get_demo_status() -> dict[str, Any]:
    org = _get_demo_org()
    if not org:
        return {"exists": False, "slug": DEMO_ORG_SLUG, "counts": {}}

    organization_id = org["id"]
    counts = {
        "users": _count("users", organization_id),
        "technicians": _count("technicians", organization_id),
        "clients": _count("clients", organization_id),
        "properties": _count("properties", organization_id),
        "vendors": _count("vendors", organization_id),
        "work_orders": _count("work_orders", organization_id),
        "messages": _count("work_order_messages", organization_id),
        "attachments": _count("work_order_attachments", organization_id),
        "events": _count("work_order_events", organization_id),
    }
    status = {
        "exists": True,
        "organization_id": organization_id,
        "slug": org["slug"],
        "name": org["name"],
        "counts": counts,
        "expected_users": _expected_user_presence(organization_id),
        "scenario_checks": _scenario_checks(organization_id),
    }
    status["readiness"] = evaluate_demo_readiness(status)
    return status


def _print_status(result: dict[str, Any]) -> None:
    print(f"Demo org slug: {result['slug']}")
    if not result.get("exists"):
        print("Status: not seeded")
        return
    print(f"Status: seeded organization_id={result['organization_id']}")
    for name, count in result["counts"].items():
        print(f"- {name}: {count}")
    readiness = result.get("readiness") or {"ready": False, "failures": ["Readiness was not evaluated."]}
    print(f"Capture readiness: {'ready' if readiness['ready'] else 'not ready'}")
    if not readiness["ready"]:
        print("Readiness blockers:")
        for failure in readiness["failures"]:
            print(f"- {failure}")


def _print_seed_summary(result: dict[str, Any], show_credentials: bool) -> None:
    print(f"Seeded {DEMO_ORG_NAME} ({result['organization_slug']})")
    print(f"Organization ID: {result['organization_id']}")
    print("Synthetic login emails:")
    print(f"- admin: {result['users']['admin']}")
    print(f"- coordinator: {result['users']['coordinator']}")
    print(f"- client: {result['users']['client']}")
    print(f"- viewer: {result['users']['viewer']}")
    print(f"- vendor: {result['users']['vendor']}")
    print(f"- empty-state viewer: {result['users']['empty_viewer']}")
    print(f"- empty-state vendor: {result['users']['empty_vendor']}")
    for email in result["users"]["technicians"]:
        print(f"- technician: {email}")
    if show_credentials:
        print(f"Synthetic shared password: {DEFAULT_PASSWORD}")
    else:
        print("Synthetic shared password: hidden; pass --show-credentials to print it.")
    print("Seed counts:")
    for name, count in result["counts"].items():
        print(f"- {name}: {count}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Seed/reset the synthetic TechSync Ops demo tenant.")
    parser.add_argument(
        "action",
        choices=("seed", "reset", "status"),
        help="seed creates the demo org, reset deletes it, status prints counts.",
    )
    parser.add_argument(
        "--reset-existing",
        action="store_true",
        help="Delete the existing synthetic demo org before seeding it again.",
    )
    parser.add_argument(
        "--show-credentials",
        action="store_true",
        help="Print synthetic demo login password after seeding.",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Exit non-zero when status/seed readiness is not capture-ready.",
    )
    args = parser.parse_args()

    try:
        if args.action == "status":
            result = get_demo_status()
            _print_status(result)
            if args.strict and not result.get("readiness", {}).get("ready"):
                return 1
            return 0
        if args.action == "reset":
            result = reset_demo_org()
            print(
                f"Deleted demo org '{result['slug']}'"
                if result["deleted"]
                else f"Demo org '{result['slug']}' did not exist"
            )
            return 0

        result = seed_demo_org(reset_existing=args.reset_existing)
        _print_seed_summary(result, args.show_credentials)
        if args.strict:
            status_result = get_demo_status()
            readiness = status_result.get("readiness", {})
            if not readiness.get("ready"):
                for failure in readiness.get("failures", []):
                    print(f"- {failure}")
                return 1
        return 0
    except Exception as exc:
        print(f"DEMO SEED FAILED: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
