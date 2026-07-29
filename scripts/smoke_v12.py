"""TechSync Ops v1.2 hosted API smoke test.

Runs against a deployed API using only synthetic data. The evidence file omits
bearer tokens and passwords so it can be reviewed without exposing secrets.
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
from urllib.parse import urljoin
from urllib.request import Request, urlopen
from uuid import uuid4


DEFAULT_PASSWORD = "DemoPass123!"


@dataclass
class ApiResponse:
    status: int
    data: Any


class SmokeFailure(RuntimeError):
    pass


def _json_bytes(payload: Any) -> bytes:
    return json.dumps(payload).encode("utf-8")


def _read_response(response) -> ApiResponse:
    raw = response.read()
    if not raw:
        return ApiResponse(response.status, None)
    try:
        return ApiResponse(response.status, json.loads(raw.decode("utf-8")))
    except json.JSONDecodeError:
        return ApiResponse(response.status, raw.decode("utf-8", errors="replace"))


def request_json(
    base_url: str,
    method: str,
    path: str,
    payload: Any | None = None,
    token: str | None = None,
    expected: tuple[int, ...] = (200,),
) -> ApiResponse:
    url = urljoin(base_url.rstrip("/") + "/", path.lstrip("/"))
    headers = {"Accept": "application/json"}
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


def request_csv(
    base_url: str,
    path: str,
    csv_content: str,
    token: str,
    expected: tuple[int, ...] = (200,),
) -> ApiResponse:
    boundary = f"----techsyncops{uuid4().hex}"
    body = (
        f"--{boundary}\r\n"
        'Content-Disposition: form-data; name="file"; filename="v12-smoke-work-orders.csv"\r\n'
        "Content-Type: text/csv\r\n\r\n"
        f"{csv_content}\r\n"
        f"--{boundary}--\r\n"
    ).encode("utf-8")
    url = urljoin(base_url.rstrip("/") + "/", path.lstrip("/"))
    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {token}",
        "Content-Type": f"multipart/form-data; boundary={boundary}",
    }
    req = Request(url, data=body, headers=headers, method="POST")
    try:
        with urlopen(req, timeout=30) as response:
            result = _read_response(response)
    except HTTPError as exc:
        result = _read_response(exc)
    except URLError as exc:
        raise SmokeFailure(f"POST {path} could not connect: {exc}") from exc

    if result.status not in expected:
        raise SmokeFailure(
            f"POST {path} returned {result.status}, expected {expected}: {result.data}"
        )
    return result


def assert_detail(name: str, condition: bool, detail: Any) -> None:
    if not condition:
        raise SmokeFailure(f"{name} assertion failed: {detail}")


def run_smoke(base_url: str, output_path: Path) -> dict[str, Any]:
    suffix = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S") + "-" + uuid4().hex[:8]
    admin_email = f"admin+v12-{suffix}@example.com"
    technician_email = f"tech+v12-{suffix}@example.com"

    evidence: dict[str, Any] = {
        "run_started_at": datetime.now(timezone.utc).isoformat(),
        "base_url": base_url.rstrip("/"),
        "synthetic": True,
        "checks": [],
    }

    def record(name: str, response: ApiResponse, summary: dict[str, Any] | None = None) -> None:
        evidence["checks"].append(
            {
                "name": name,
                "status": response.status,
                "summary": summary or {},
            }
        )

    health = request_json(base_url, "GET", "/health")
    assert_detail("health", health.data.get("status") == "ok", health.data)
    record("health", health, {"service": health.data.get("service")})

    onboard_payload = {
        "company_name": f"TechSync Ops v1.2 Demo {suffix}",
        "industry": "property_management",
        "timezone": "America/New_York",
        "admin_full_name": "V1.2 Demo Admin",
        "admin_email": admin_email,
        "admin_password": DEFAULT_PASSWORD,
    }
    onboard = request_json(base_url, "POST", "/organizations/onboard", onboard_payload, expected=(201,))
    admin_token = onboard.data["tokens"]["access_token"]
    refresh_token = onboard.data["tokens"]["refresh_token"]
    org_id = onboard.data["organization"]["id"]
    admin_user_id = onboard.data["user"]["id"]
    record("organization_onboarding", onboard, {"organization_id": org_id, "admin_user_id": admin_user_id})

    login = request_json(
        base_url,
        "POST",
        "/auth/login",
        {"email": admin_email, "password": DEFAULT_PASSWORD},
    )
    admin_token = login.data["access_token"]
    record("admin_login", login, {"token_type": login.data.get("token_type")})

    refresh = request_json(base_url, "POST", "/auth/refresh", {"refresh_token": refresh_token})
    record("refresh_token", refresh, {"token_type": refresh.data.get("token_type")})

    technician_payload = {
        "full_name": "V1.2 Demo Technician",
        "email": technician_email,
        "password": DEFAULT_PASSWORD,
        "skills": ["plumbing", "hvac", "general"],
        "certifications": ["synthetic-demo"],
        "zone": "north",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "max_daily_jobs": 8,
    }
    technician = request_json(base_url, "POST", "/technicians", technician_payload, admin_token, expected=(201,))
    technician_id = technician.data["id"]
    record("technician_creation", technician, {"technician_id": technician_id})

    work_order_payload = {
        "title": f"V1.2 smoke leak repair {suffix}",
        "description": "Synthetic hosted smoke-test work order. No real customer data.",
        "customer_name": "Synthetic Homeowner",
        "address": "100 Demo Way, Test City, NY",
        "latitude": 40.7130,
        "longitude": -74.0062,
        "service_type": "plumbing",
        "priority": "high",
        "auto_assign": False,
    }
    work_order = request_json(base_url, "POST", "/work-orders", work_order_payload, admin_token, expected=(201,))
    work_order_id = work_order.data["id"]
    record("work_order_creation", work_order, {"work_order_id": work_order_id})

    assignment = request_json(
        base_url,
        "POST",
        f"/work-orders/{work_order_id}/assign",
        {"technician_id": technician_id, "notes": "Synthetic v1.2 manual assignment smoke test."},
        admin_token,
    )
    assert_detail("assignment", assignment.data.get("assigned_technician_id") == technician_id, assignment.data)
    record("manual_assignment", assignment, {"work_order_id": work_order_id, "technician_id": technician_id})

    tech_login = request_json(
        base_url,
        "POST",
        "/auth/login",
        {"email": technician_email, "password": DEFAULT_PASSWORD},
    )
    tech_token = tech_login.data["access_token"]
    record("technician_login", tech_login, {"token_type": tech_login.data.get("token_type")})

    mine = request_json(base_url, "GET", "/work-orders/mine", token=tech_token)
    assert_detail(
        "technician_queue",
        any(item["id"] == work_order_id for item in mine.data),
        {"work_order_id": work_order_id, "mine_count": len(mine.data)},
    )
    record("technician_queue", mine, {"assigned_count": len(mine.data)})

    in_progress = request_json(
        base_url,
        "PATCH",
        f"/work-orders/{work_order_id}/status",
        {"status": "in_progress", "notes": "Synthetic technician started work."},
        tech_token,
    )
    record("status_in_progress", in_progress, {"status": in_progress.data.get("status")})

    completed = request_json(
        base_url,
        "PATCH",
        f"/work-orders/{work_order_id}/status",
        {"status": "completed", "notes": "Synthetic technician completed work with proof."},
        tech_token,
    )
    record("status_completed", completed, {"status": completed.data.get("status")})

    attachment = request_json(
        base_url,
        "POST",
        f"/work-orders/{work_order_id}/attachments",
        {
            "file_name": "synthetic-before-after.jpg",
            "file_url": "https://example.com/synthetic-techsync-ops-proof.jpg",
            "content_type": "image/jpeg",
        },
        admin_token,
        expected=(201,),
    )
    record("attachment_metadata", attachment, {"attachment_id": attachment.data.get("id")})

    events = request_json(base_url, "GET", f"/work-orders/{work_order_id}/events", token=admin_token)
    assert_detail("audit_events", len(events.data) >= 4, {"event_count": len(events.data)})
    record("audit_events", events, {"event_count": len(events.data)})

    csv_content = (
        "title,description,customer_name,address,service_type,priority\n"
        f"V1.2 synthetic CSV work order {suffix},Generated by smoke script,Synthetic Resident,"
        "200 Demo Ave,HVAC,medium\n"
    )
    csv_result = request_csv(base_url, "/ingestion/csv", csv_content, admin_token)
    assert_detail("csv_ingestion", csv_result.data.get("created_count", 0) >= 1, csv_result.data)
    record(
        "csv_ingestion",
        csv_result,
        {
            "created_count": csv_result.data.get("created_count"),
            "failed_count": csv_result.data.get("failed_count"),
        },
    )

    metrics = request_json(base_url, "GET", "/dashboard/metrics", token=admin_token)
    assert_detail("dashboard_metrics", metrics.data.get("total_work_orders", 0) >= 2, metrics.data)
    record("dashboard_metrics", metrics, metrics.data)

    evidence["run_finished_at"] = datetime.now(timezone.utc).isoformat()
    evidence["result"] = "passed"
    evidence["created"] = {
        "organization_id": org_id,
        "admin_user_id": admin_user_id,
        "technician_id": technician_id,
        "work_order_id": work_order_id,
        "admin_email": admin_email,
        "technician_email": technician_email,
    }

    output_path.write_text(json.dumps(evidence, indent=2) + "\n", encoding="utf-8")
    return evidence


def main() -> int:
    parser = argparse.ArgumentParser(description="Run TechSync Ops v1.2 hosted API smoke test.")
    parser.add_argument("--base-url", required=True, help="Hosted API base URL, e.g. https://app.vercel.app")
    parser.add_argument(
        "--output",
        default="v12-smoke-evidence.json",
        help="Sanitized evidence JSON path. Default: v12-smoke-evidence.json",
    )
    args = parser.parse_args()

    output_path = Path(args.output)
    try:
        evidence = run_smoke(args.base_url, output_path)
    except SmokeFailure as exc:
        print(f"SMOKE FAILED: {exc}", file=sys.stderr)
        return 1

    print(f"SMOKE PASSED: {len(evidence['checks'])} checks")
    print(f"Evidence written to: {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
