"""Role-by-role UX smoke probe for the synthetic TechSync Ops demo tenant.

This script logs in as each synthetic role, checks the role-scoped API paths
that back the mobile walkthrough, and writes sanitized evidence. It does not
save bearer tokens or provider secrets.
"""

from __future__ import annotations

import argparse
import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests


DEFAULT_BASE_URL = "http://localhost:8000"
DEFAULT_OUTPUT = "role-ux-smoke-evidence.json"
DEFAULT_PASSWORD = os.getenv("TECHSYNC_DEMO_PASSWORD", "DemoPass123!")

ROLE_LOGINS = {
    "org_admin": "admin.demo@demo.techsyncops.dev",
    "coordinator": "coordinator.demo@demo.techsyncops.dev",
    "technician": "lena.tech@demo.techsyncops.dev",
    "client": "client.demo@demo.techsyncops.dev",
    "viewer": "owner-group.demo@demo.techsyncops.dev",
    "vendor": "apex.demo@demo.techsyncops.dev",
}

MANAGER_ROLES = {"org_admin", "coordinator"}


def _request(
    method: str,
    base_url: str,
    path: str,
    *,
    token: str | None = None,
    json_body: dict[str, Any] | None = None,
    timeout: int = 10,
) -> requests.Response:
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return requests.request(
        method,
        f"{base_url.rstrip('/')}{path}",
        headers=headers,
        json=json_body,
        timeout=timeout,
    )


def _record(checks: list[dict[str, Any]], key: str, passed: bool, detail: str) -> None:
    checks.append({"key": key, "passed": passed, "detail": detail})


def _login(base_url: str, email: str, password: str) -> tuple[str | None, dict[str, Any]]:
    attempts = 0
    delayed_by = 0
    while True:
        attempts += 1
        response = _request(
            "POST",
            base_url,
            "/auth/login",
            json_body={"email": email, "password": password},
        )
        if response.status_code != 429 or attempts >= 2:
            break

        retry_after = int(response.headers.get("Retry-After", "60"))
        delayed_by += retry_after
        time.sleep(retry_after)

    body = response.json() if response.headers.get("content-type", "").startswith("application/json") else {}
    return body.get("access_token"), {
        "status_code": response.status_code,
        "ok": response.ok,
        "attempts": attempts,
        "delayed_by_seconds": delayed_by,
    }


def _safe_json(response: requests.Response) -> Any:
    if not response.headers.get("content-type", "").startswith("application/json"):
        return None
    return response.json()


def _check_manager_boundaries(base_url: str, role: str, token: str, checks: list[dict[str, Any]]) -> None:
    manager_paths = [
        "/dashboard/operations-report",
        "/dashboard/dispatch-board",
        "/clients",
        "/properties",
        "/vendors",
    ]
    expected = 200 if role in MANAGER_ROLES else 403
    for path in manager_paths:
        response = _request("GET", base_url, path, token=token)
        _record(
            checks,
            f"{role}:{path}",
            response.status_code == expected,
            f"{path} returned {response.status_code}; expected {expected}",
        )


def _check_work_order_surface(base_url: str, role: str, token: str, checks: list[dict[str, Any]]) -> None:
    queue_path = "/work-orders/mine" if role == "technician" else "/work-orders"
    response = _request("GET", base_url, queue_path, token=token)
    rows = _safe_json(response) or []
    _record(
        checks,
        f"{role}:queue",
        response.ok and isinstance(rows, list),
        f"{queue_path} returned {response.status_code} with {len(rows) if isinstance(rows, list) else 'non-list'} rows",
    )

    if not response.ok or not isinstance(rows, list) or not rows:
        _record(
            checks,
            f"{role}:detail_skipped",
            True,
            "No visible work orders for this role; detail/message/attachment checks skipped.",
        )
        return

    work_order_id = rows[0]["id"]
    detail = _request("GET", base_url, f"/work-orders/{work_order_id}", token=token)
    _record(
        checks,
        f"{role}:detail",
        detail.ok,
        f"GET /work-orders/{work_order_id} returned {detail.status_code}",
    )

    messages = _request("GET", base_url, f"/work-orders/{work_order_id}/messages", token=token)
    _record(
        checks,
        f"{role}:messages",
        messages.ok,
        f"GET /work-orders/{work_order_id}/messages returned {messages.status_code}",
    )

    attachments = _request("GET", base_url, f"/work-orders/{work_order_id}/attachments", token=token)
    _record(
        checks,
        f"{role}:attachments",
        attachments.ok,
        f"GET /work-orders/{work_order_id}/attachments returned {attachments.status_code}",
    )

    if role == "viewer":
        blocked_message = _request(
            "POST",
            base_url,
            f"/work-orders/{work_order_id}/messages",
            token=token,
            json_body={"visibility": "client", "body": "Synthetic viewer blocked smoke check"},
        )
        _record(
            checks,
            f"{role}:message_mutation_blocked",
            blocked_message.status_code == 403,
            f"Viewer message POST returned {blocked_message.status_code}; expected 403",
        )

    if role == "vendor":
        blocked_attachment = _request(
            "POST",
            base_url,
            f"/work-orders/{work_order_id}/attachments",
            token=token,
            json_body={
                "file_name": "vendor-smoke-proof.txt",
                "file_url": "https://example.com/vendor-smoke-proof.txt",
                "content_type": "text/plain",
            },
        )
        _record(
            checks,
            f"{role}:attachment_mutation_blocked",
            blocked_attachment.status_code == 403,
            f"Vendor attachment POST returned {blocked_attachment.status_code}; expected 403",
        )


def run_smoke(base_url: str, password: str) -> dict[str, Any]:
    evidence: dict[str, Any] = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "base_url": base_url,
        "roles": [],
        "tokens_saved": False,
    }
    all_checks: list[dict[str, Any]] = []

    health = _request("GET", base_url, "/health")
    _record(all_checks, "health", health.ok, f"/health returned {health.status_code}")

    for role, email in ROLE_LOGINS.items():
        checks: list[dict[str, Any]] = []
        token, login_result = _login(base_url, email, password)
        _record(
            checks,
            f"{role}:login",
            bool(token),
            (
                f"Login for {email} returned {login_result['status_code']}"
                f" after {login_result['attempts']} attempt(s)"
            ),
        )

        if token:
            me = _request("GET", base_url, "/auth/me", token=token)
            me_body = _safe_json(me) or {}
            _record(
                checks,
                f"{role}:me",
                me.ok and me_body.get("role") == role,
                f"/auth/me returned role {me_body.get('role')} with status {me.status_code}",
            )
            _check_work_order_surface(base_url, role, token, checks)
            _check_manager_boundaries(base_url, role, token, checks)

        all_checks.extend(checks)
        evidence["roles"].append(
            {
                "role": role,
                "email": email,
                "passed": all(check["passed"] for check in checks),
                "checks": checks,
            }
        )

    evidence["passed"] = all(check["passed"] for check in all_checks)
    evidence["check_count"] = len(all_checks)
    return evidence


def main() -> int:
    parser = argparse.ArgumentParser(description="Run synthetic role UX smoke checks.")
    parser.add_argument("--base-url", default=os.getenv("TECHSYNC_API_BASE_URL", DEFAULT_BASE_URL))
    parser.add_argument("--password", default=DEFAULT_PASSWORD)
    parser.add_argument("--output", default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    evidence = run_smoke(args.base_url, args.password)
    Path(args.output).write_text(json.dumps(evidence, indent=2), encoding="utf-8")
    print(
        f"Role UX smoke {'passed' if evidence['passed'] else 'failed'}: "
        f"{evidence['check_count']} checks -> {args.output}"
    )
    return 0 if evidence["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
