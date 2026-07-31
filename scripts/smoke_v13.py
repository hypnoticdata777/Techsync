"""TechSync Ops v1.3 hosted API smoke test.

Runs against a deployed API using only synthetic data. The generated evidence
file avoids bearer tokens, passwords, and connection strings so it can be
attached to the investor-readiness trail safely.
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urljoin
from urllib.request import Request, urlopen
from uuid import uuid4


DEFAULT_PASSWORD = "DemoPass123!"
INVITE_EXPIRE_HOURS = 48


@dataclass
class ApiResponse:
    status: int
    data: Any
    content_type: str | None = None


class SmokeFailure(RuntimeError):
    pass


def _json_bytes(payload: Any) -> bytes:
    return json.dumps(payload).encode("utf-8")


def _read_response(response) -> ApiResponse:
    raw = response.read()
    content_type = response.headers.get("content-type")
    if not raw:
        return ApiResponse(response.status, None, content_type)
    text = raw.decode("utf-8", errors="replace")
    try:
        return ApiResponse(response.status, json.loads(text), content_type)
    except json.JSONDecodeError:
        return ApiResponse(response.status, text, content_type)


def request(
    base_url: str,
    method: str,
    path: str,
    payload: Any | None = None,
    token: str | None = None,
    expected: tuple[int, ...] = (200,),
    query: dict[str, Any] | None = None,
) -> ApiResponse:
    clean_path = path.lstrip("/")
    if query:
        clean_path = f"{clean_path}?{urlencode(query)}"
    url = urljoin(base_url.rstrip("/") + "/", clean_path)
    headers = {"Accept": "application/json, text/plain, text/html, application/pdf"}
    data = None
    if payload is not None:
        headers["Content-Type"] = "application/json"
        data = _json_bytes(payload)
    if token:
        headers["Authorization"] = f"Bearer {token}"

    req = Request(url, data=data, headers=headers, method=method)
    try:
        with urlopen(req, timeout=30) as response:
            result = _read_response(response)
    except HTTPError as exc:
        result = _read_response(exc)
    except URLError as exc:
        raise SmokeFailure(f"{method} {path} could not connect: {exc}") from exc

    if result.status not in expected:
        raise SmokeFailure(
            f"{method} {path} returned {result.status}, expected {expected}: {result.data}"
        )
    return result


def assert_detail(name: str, condition: bool, detail: Any) -> None:
    if not condition:
        raise SmokeFailure(f"{name} assertion failed: {detail}")


def hash_opaque_token(token: str) -> str:
    import hashlib

    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_known_client_invitation(
    *,
    database_url: str,
    organization_id: int,
    email: str,
    invited_by: int,
    raw_token: str,
) -> int:
    """Insert a known synthetic invitation for local/demo smoke proof.

    The public invite endpoint intentionally never returns raw tokens. This
    direct DB helper is opt-in and should only be used with synthetic demo data
    when proving invitation acceptance before hosting.
    """
    try:
        import psycopg2
    except ImportError as exc:
        raise SmokeFailure("psycopg2 is required for DB-assisted invite proof") from exc

    with psycopg2.connect(database_url) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO invitations (
                    organization_id,
                    email,
                    role,
                    token_hash,
                    invited_by,
                    expires_at
                )
                VALUES (
                    %s,
                    %s,
                    'client',
                    %s,
                    %s,
                    NOW() + make_interval(hours => %s)
                )
                RETURNING id
                """,
                (
                    organization_id,
                    email,
                    hash_opaque_token(raw_token),
                    invited_by,
                    INVITE_EXPIRE_HOURS,
                ),
            )
            invitation_id = cursor.fetchone()[0]
    return int(invitation_id)


def run_smoke(base_url: str, output_path: Path, invite_database_url: str | None = None) -> dict[str, Any]:
    suffix = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S") + "-" + uuid4().hex[:8]
    admin_email = f"admin+v13-{suffix}@example.com"
    technician_email = f"tech+v13-{suffix}@example.com"
    client_email = f"client+v13-{suffix}@example.com"

    evidence: dict[str, Any] = {
        "run_started_at": datetime.now(timezone.utc).isoformat(),
        "base_url": base_url.rstrip("/"),
        "synthetic": True,
        "checks": [],
        "manual_follow_up": [
            "Run Alembic current against the direct Neon URL and confirm the hosted/demo database is at 0007 or later.",
        ],
    }
    if not invite_database_url:
        evidence["manual_follow_up"].append(
            "Run this smoke with --invite-database-url against synthetic demo data to prove invite accept plus client approve/decline with a real client token."
        )

    def record(name: str, response: ApiResponse, summary: dict[str, Any] | None = None) -> None:
        evidence["checks"].append(
            {
                "name": name,
                "status": response.status,
                "content_type": response.content_type,
                "summary": summary or {},
            }
        )

    health = request(base_url, "GET", "/health")
    assert_detail("health", health.data.get("status") == "ok", health.data)
    record("health", health, {"service": health.data.get("service")})

    onboard = request(
        base_url,
        "POST",
        "/organizations/onboard",
        {
            "company_name": f"TechSync Ops v1.3 Demo {suffix}",
            "industry": "property_management",
            "timezone": "America/New_York",
            "admin_full_name": "V1.3 Demo Admin",
            "admin_email": admin_email,
            "admin_password": DEFAULT_PASSWORD,
        },
        expected=(201,),
    )
    admin_token = onboard.data["tokens"]["access_token"]
    admin_user_id = onboard.data["user"]["id"]
    org_id = onboard.data["organization"]["id"]
    record("organization_onboarding", onboard, {"organization_id": org_id})

    login = request(
        base_url,
        "POST",
        "/auth/login",
        {"email": admin_email, "password": DEFAULT_PASSWORD},
    )
    admin_token = login.data["access_token"]
    record("admin_login", login, {"token_type": login.data.get("token_type")})

    client = request(
        base_url,
        "POST",
        "/clients",
        {
            "display_name": f"V1.3 Synthetic Homeowner {suffix}",
            "contact_name": "Synthetic Client",
            "email": client_email,
            "phone": "555-0100",
            "client_type": "homeowner",
            "notes": "Synthetic v1.3 hosted smoke client.",
        },
        admin_token,
        expected=(201,),
    )
    client_id = client.data["id"]
    record("client_creation", client, {"client_id": client_id})

    property_row = request(
        base_url,
        "POST",
        "/properties",
        {
            "client_id": client_id,
            "name": f"V1.3 Synthetic Unit {suffix}",
            "address_line1": "1300 Demo Ridge",
            "city": "Test City",
            "state": "NY",
            "postal_code": "10001",
            "country": "US",
            "unit": "4B",
            "access_notes": "Synthetic hosted smoke property. No real address.",
            "latitude": 40.713,
            "longitude": -74.006,
        },
        admin_token,
        expected=(201,),
    )
    property_id = property_row.data["id"]
    record("property_creation", property_row, {"property_id": property_id, "client_id": client_id})

    vendor = request(
        base_url,
        "POST",
        "/vendors",
        {
            "name": f"V1.3 Synthetic Vendor {suffix}",
            "contact_name": "Synthetic Vendor Dispatcher",
            "email": f"vendor+v13-{suffix}@example.com",
            "phone": "555-0101",
            "service_types": ["plumbing", "general"],
            "coverage_area": "Synthetic north zone",
            "notes": "Synthetic v1.3 hosted smoke vendor.",
        },
        admin_token,
        expected=(201,),
    )
    vendor_id = vendor.data["id"]
    record("vendor_creation", vendor, {"vendor_id": vendor_id})

    client_export = request(base_url, "GET", "/clients/export", token=admin_token)
    assert_detail(
        "client_csv_export",
        isinstance(client_export.data, str)
        and "id,display_name,contact_name,email" in client_export.data
        and str(client_id) in client_export.data,
        client_export.data[:200] if isinstance(client_export.data, str) else client_export.data,
    )
    record("client_csv_export", client_export, {"contains_created_client": True})

    property_export = request(base_url, "GET", "/properties/export", token=admin_token)
    assert_detail(
        "property_csv_export",
        isinstance(property_export.data, str)
        and "id,client_id,name,address_line1" in property_export.data
        and str(property_id) in property_export.data,
        property_export.data[:200]
        if isinstance(property_export.data, str)
        else property_export.data,
    )
    record("property_csv_export", property_export, {"contains_created_property": True})

    vendor_export = request(base_url, "GET", "/vendors/export", token=admin_token)
    assert_detail(
        "vendor_csv_export",
        isinstance(vendor_export.data, str)
        and "id,name,contact_name,email" in vendor_export.data
        and str(vendor_id) in vendor_export.data,
        vendor_export.data[:200] if isinstance(vendor_export.data, str) else vendor_export.data,
    )
    record("vendor_csv_export", vendor_export, {"contains_created_vendor": True})

    technician = request(
        base_url,
        "POST",
        "/technicians",
        {
            "full_name": "V1.3 Demo Technician",
            "email": technician_email,
            "password": DEFAULT_PASSWORD,
            "skills": ["plumbing", "general"],
            "certifications": ["synthetic-demo"],
            "zone": "north",
            "latitude": 40.7128,
            "longitude": -74.0060,
            "max_daily_jobs": 8,
        },
        admin_token,
        expected=(201,),
    )
    technician_id = technician.data["id"]
    record("technician_creation", technician, {"technician_id": technician_id})

    work_order_payload = {
        "title": f"V1.3 smoke disposal leak {suffix}",
        "description": "Synthetic v1.3 hosted smoke-test work order. No real customer data.",
        "property_id": property_id,
        "client_id": client_id,
        "vendor_id": vendor_id,
        "customer_name": "Synthetic Resident",
        "address": "1300 Demo Ridge Unit 4B, Test City, NY",
        "latitude": 40.7130,
        "longitude": -74.0062,
        "service_type": "plumbing",
        "priority": "high",
        "estimated_cost_cents": 80000,
        "actual_cost_cents": 94000,
        "invoice_reference": f"SYN-V13-{suffix}",
        "auto_assign": False,
    }
    work_order = request(
        base_url,
        "POST",
        "/work-orders",
        work_order_payload,
        admin_token,
        expected=(201,),
    )
    work_order_id = work_order.data["id"]
    assert_detail(
        "work_order_entity_links",
        work_order.data.get("client_id") == client_id
        and work_order.data.get("property_id") == property_id
        and work_order.data.get("vendor_id") == vendor_id,
        work_order.data,
    )
    record(
        "work_order_creation_with_pmc_links",
        work_order,
        {"work_order_id": work_order_id, "client_id": client_id, "property_id": property_id, "vendor_id": vendor_id},
    )

    duplicate_warnings = request(
        base_url,
        "POST",
        "/work-orders/duplicate-warnings",
        work_order_payload,
        admin_token,
    )
    assert_detail(
        "duplicate_warnings",
        any(item.get("id") == work_order_id for item in duplicate_warnings.data),
        duplicate_warnings.data,
    )
    record(
        "duplicate_warning_preflight",
        duplicate_warnings,
        {"warning_count": len(duplicate_warnings.data), "matched_work_order_id": work_order_id},
    )

    assignment = request(
        base_url,
        "POST",
        f"/work-orders/{work_order_id}/assign",
        {"technician_id": technician_id, "notes": "Synthetic v1.3 manual assignment."},
        admin_token,
    )
    assert_detail("assignment", assignment.data.get("assigned_technician_id") == technician_id, assignment.data)
    record("manual_assignment", assignment, {"technician_id": technician_id})

    internal_message = request(
        base_url,
        "POST",
        f"/work-orders/{work_order_id}/messages",
        {"visibility": "internal", "body": "Internal dispatch note for synthetic v1.3 smoke."},
        admin_token,
        expected=(201,),
    )
    record("internal_message", internal_message, {"message_id": internal_message.data.get("id")})

    client_message = request(
        base_url,
        "POST",
        f"/work-orders/{work_order_id}/messages",
        {"visibility": "client", "body": "Client-visible update for synthetic v1.3 smoke."},
        admin_token,
        expected=(201,),
    )
    record("client_visible_message", client_message, {"message_id": client_message.data.get("id")})

    client_messages = request(
        base_url,
        "GET",
        f"/work-orders/{work_order_id}/messages",
        token=admin_token,
        query={"visibility": "client"},
    )
    assert_detail(
        "client_message_visibility",
        all(item.get("visibility") == "client" for item in client_messages.data),
        client_messages.data,
    )
    record("client_message_visibility_filter", client_messages, {"message_count": len(client_messages.data)})

    approval_request = request(
        base_url,
        "POST",
        f"/work-orders/{work_order_id}/approval-request",
        {"notes": "Synthetic client approval requested before closeout."},
        admin_token,
    )
    assert_detail(
        "approval_request",
        approval_request.data.get("client_approval_status") == "pending",
        approval_request.data,
    )
    record("client_approval_request", approval_request, {"status": approval_request.data.get("client_approval_status")})

    if invite_database_url:
        invite_token = f"synthetic-v13-invite-{suffix}"
        invitation_id = create_known_client_invitation(
            database_url=invite_database_url,
            organization_id=org_id,
            email=client_email,
            invited_by=admin_user_id,
            raw_token=invite_token,
        )
        invitation_accept = request(
            base_url,
            "POST",
            "/invitations/accept",
            {
                "token": invite_token,
                "full_name": "V1.3 Synthetic Invited Client",
                "password": DEFAULT_PASSWORD,
            },
            expected=(201,),
        )
        client_token = invitation_accept.data["tokens"]["access_token"]
        assert_detail(
            "client_invitation_accept",
            invitation_accept.data["user"].get("role") == "client"
            and invitation_accept.data["user"].get("email") == client_email,
            invitation_accept.data["user"],
        )
        record(
            "client_invitation_accept",
            invitation_accept,
            {
                "invitation_id": invitation_id,
                "accepted_role": invitation_accept.data["user"].get("role"),
            },
        )

        client_approval = request(
            base_url,
            "PATCH",
            f"/work-orders/{work_order_id}/approval",
            {"decision": "approved", "notes": "Synthetic invited client approval."},
            client_token,
        )
        assert_detail(
            "client_approval_decision",
            client_approval.data.get("client_approval_status") == "approved"
            and client_approval.data.get("client_approval_decision_by") == invitation_accept.data["user"].get("id"),
            client_approval.data,
        )
        record(
            "client_approval_decision",
            client_approval,
            {
                "status": client_approval.data.get("client_approval_status"),
                "used_invited_client_token": True,
            },
        )

    tech_login = request(
        base_url,
        "POST",
        "/auth/login",
        {"email": technician_email, "password": DEFAULT_PASSWORD},
    )
    tech_token = tech_login.data["access_token"]
    record("technician_login", tech_login, {"token_type": tech_login.data.get("token_type")})

    in_progress = request(
        base_url,
        "PATCH",
        f"/work-orders/{work_order_id}/status",
        {"status": "in_progress", "notes": "Synthetic technician started work."},
        tech_token,
    )
    record("status_in_progress", in_progress, {"status": in_progress.data.get("status")})

    proof = request(
        base_url,
        "POST",
        f"/work-orders/{work_order_id}/attachments",
        {
            "file_name": "synthetic-v13-proof.jpg",
            "file_url": "https://example.com/synthetic-techsync-ops-v13-proof.jpg",
            "content_type": "image/jpeg",
        },
        tech_token,
        expected=(201,),
    )
    record("completion_proof_metadata", proof, {"attachment_id": proof.data.get("id")})

    completed = request(
        base_url,
        "PATCH",
        f"/work-orders/{work_order_id}/status",
        {"status": "completed", "notes": "Synthetic technician completed work with proof."},
        tech_token,
    )
    assert_detail("proof_gate_completion", completed.data.get("status") == "completed", completed.data)
    record(
        "proof_gated_completion",
        completed,
        {
            "status": completed.data.get("status"),
            "completion_proof_verified": bool(completed.data.get("completion_proof_verified_at")),
        },
    )

    closeout = request(base_url, "GET", f"/work-orders/{work_order_id}/closeout-package", token=admin_token)
    assert_detail(
        "closeout_package",
        closeout.data["work_order"]["id"] == work_order_id
        and closeout.data["proof_status"] == "verified",
        closeout.data,
    )
    record(
        "closeout_package",
        closeout,
        {
            "proof_status": closeout.data.get("proof_status"),
            "attachment_count": len(closeout.data.get("attachments", [])),
            "client_message_count": len(closeout.data.get("client_messages", [])),
        },
    )

    export_text = request(
        base_url,
        "GET",
        f"/work-orders/{work_order_id}/closeout-package/export",
        token=admin_token,
        query={"format": "text"},
    )
    assert_detail(
        "closeout_text_export",
        isinstance(export_text.data, str) and "Closeout Package" in export_text.data,
        export_text.data[:200] if isinstance(export_text.data, str) else export_text.data,
    )
    record("closeout_text_export", export_text, {"contains_closeout_package": True})

    export_html = request(
        base_url,
        "GET",
        f"/work-orders/{work_order_id}/closeout-package/export",
        token=admin_token,
        query={"format": "html"},
    )
    assert_detail(
        "closeout_html_export",
        isinstance(export_html.data, str) and "TechSync Ops Closeout Package" in export_html.data,
        export_html.data[:200] if isinstance(export_html.data, str) else export_html.data,
    )
    record("closeout_html_export", export_html, {"contains_closeout_package": True})

    export_pdf = request(
        base_url,
        "GET",
        f"/work-orders/{work_order_id}/closeout-package/export",
        token=admin_token,
        query={"format": "pdf"},
    )
    assert_detail(
        "closeout_pdf_export",
        isinstance(export_pdf.data, str) and export_pdf.data.startswith("%PDF"),
        export_pdf.data[:80] if isinstance(export_pdf.data, str) else export_pdf.data,
    )
    record(
        "closeout_pdf_export",
        export_pdf,
        {"contains_pdf_header": True},
    )

    attachment_manifest = request(
        base_url,
        "GET",
        f"/work-orders/{work_order_id}/closeout-package/attachments/export",
        token=admin_token,
        query={"format": "json"},
    )
    assert_detail(
        "closeout_attachment_manifest",
        attachment_manifest.data.get("attachment_count") == 1
        and "storage_path" not in attachment_manifest.data.get("attachments", [{}])[0],
        attachment_manifest.data,
    )
    record(
        "closeout_attachment_manifest",
        attachment_manifest,
        {"attachment_count": attachment_manifest.data.get("attachment_count")},
    )

    operations_report = request(
        base_url,
        "GET",
        "/dashboard/operations-report",
        token=admin_token,
        query={"stale_days": 1, "hotspot_days": 90, "completion_days": 90, "cost_days": 90, "limit": 10},
    )
    assert_detail(
        "operations_report_shape",
        {
            "stale_work_orders",
            "overloaded_technicians",
            "property_hotspots",
            "completion_cycles",
            "cost_summary",
        }.issubset(operations_report.data.keys()),
        operations_report.data,
    )
    record(
        "operations_report",
        operations_report,
        {
            "stale_count": len(operations_report.data.get("stale_work_orders", [])),
            "overloaded_count": len(operations_report.data.get("overloaded_technicians", [])),
            "hotspot_count": len(operations_report.data.get("property_hotspots", [])),
            "completion_cycle_count": len(operations_report.data.get("completion_cycles", [])),
            "cost_summary_count": len(operations_report.data.get("cost_summary", [])),
        },
    )

    operations_report_export = request(
        base_url,
        "GET",
        "/dashboard/operations-report/export",
        token=admin_token,
        query={"stale_days": 1, "hotspot_days": 90, "completion_days": 90, "cost_days": 90, "limit": 10},
    )
    assert_detail(
        "operations_report_csv_export",
        isinstance(operations_report_export.data, str)
        and "section,id,title" in operations_report_export.data
        and "completion_cycle" in operations_report_export.data
        and "cost_summary" in operations_report_export.data,
        operations_report_export.data[:200]
        if isinstance(operations_report_export.data, str)
        else operations_report_export.data,
    )
    record(
        "operations_report_csv_export",
        operations_report_export,
        {"contains_csv_header": True, "contains_completion_cycle": True, "contains_cost_summary": True},
    )

    dispatch_board = request(base_url, "GET", "/dashboard/dispatch-board", token=admin_token)
    assert_detail(
        "dispatch_board_shape",
        {"summary", "unassigned_work_orders", "technician_lanes"}.issubset(
            dispatch_board.data.keys()
        ),
        dispatch_board.data,
    )
    record(
        "dispatch_board",
        dispatch_board,
        {
            "unassigned_count": dispatch_board.data["summary"].get("unassigned_count"),
            "sla_at_risk_count": dispatch_board.data["summary"].get("sla_at_risk_count"),
            "lane_count": len(dispatch_board.data.get("technician_lanes", [])),
        },
    )

    dispatch_board_export = request(
        base_url,
        "GET",
        "/dashboard/dispatch-board/export",
        token=admin_token,
    )
    assert_detail(
        "dispatch_board_csv_export",
        isinstance(dispatch_board_export.data, str)
        and "summary,open_count" in dispatch_board_export.data,
        dispatch_board_export.data[:200]
        if isinstance(dispatch_board_export.data, str)
        else dispatch_board_export.data,
    )
    record(
        "dispatch_board_csv_export",
        dispatch_board_export,
        {"contains_summary_rows": True},
    )

    tenant_export = request(base_url, "GET", "/organizations/me/export", token=admin_token)
    assert_detail(
        "tenant_export",
        tenant_export.data.get("schema_version") == "techsync_ops_tenant_export.v1"
        and tenant_export.data.get("record_counts", {}).get("work_orders", 0) >= 1
        and "api_key" not in tenant_export.data.get("organization", {})
        and "password_hash" not in json.dumps(tenant_export.data.get("data", {}).get("users", [])),
        tenant_export.data,
    )
    record(
        "tenant_json_export",
        tenant_export,
        {
            "schema_version": tenant_export.data.get("schema_version"),
            "work_order_count": tenant_export.data.get("record_counts", {}).get("work_orders"),
            "omits_sensitive_fields": True,
        },
    )

    evidence["run_finished_at"] = datetime.now(timezone.utc).isoformat()
    evidence["result"] = "passed"
    evidence["created"] = {
        "organization_id": org_id,
        "client_id": client_id,
        "property_id": property_id,
        "vendor_id": vendor_id,
        "technician_id": technician_id,
        "work_order_id": work_order_id,
        "admin_email": admin_email,
        "technician_email": technician_email,
        "client_email": client_email,
    }

    output_path.write_text(json.dumps(evidence, indent=2) + "\n", encoding="utf-8")
    return evidence


def main() -> int:
    parser = argparse.ArgumentParser(description="Run TechSync Ops v1.3 hosted API smoke test.")
    parser.add_argument("--base-url", required=True, help="Hosted API base URL, e.g. https://techsync-ops.vercel.app")
    parser.add_argument(
        "--output",
        default="v13-smoke-evidence.json",
        help="Sanitized evidence JSON path. Default: v13-smoke-evidence.json",
    )
    parser.add_argument(
        "--invite-database-url",
        default=None,
        help=(
            "Optional direct demo database URL used only to insert a known synthetic "
            "client invitation token before accepting it through the public API. "
            "Never written to evidence."
        ),
    )
    args = parser.parse_args()

    output_path = Path(args.output)
    try:
        evidence = run_smoke(args.base_url, output_path, invite_database_url=args.invite_database_url)
    except SmokeFailure as exc:
        print(f"SMOKE FAILED: {exc}", file=sys.stderr)
        return 1

    print(f"SMOKE PASSED: {len(evidence['checks'])} checks")
    print(f"Evidence written to: {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
