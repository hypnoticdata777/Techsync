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
DEFAULT_REQUEST_TIMEOUT = 30

ROLE_LOGINS = {
    "org_admin": "admin.demo@demo.techsyncops.dev",
    "coordinator": "coordinator.demo@demo.techsyncops.dev",
    "technician": "marco.tech@demo.techsyncops.dev",
    "client": "client.demo@demo.techsyncops.dev",
    "viewer": "owner-group.demo@demo.techsyncops.dev",
    "vendor": "apex.demo@demo.techsyncops.dev",
}

EMPTY_STATE_LOGINS = {
    "technician_empty": {
        "email": "lena.tech@demo.techsyncops.dev",
        "expected_role": "technician",
        "queue_path": "/work-orders/mine",
    },
    "viewer_empty": {
        "email": "quiet-owner.demo@demo.techsyncops.dev",
        "expected_role": "viewer",
        "queue_path": "/work-orders",
    },
    "vendor_empty": {
        "email": "quiet-vendor.demo@demo.techsyncops.dev",
        "expected_role": "vendor",
        "queue_path": "/work-orders",
    },
}

STALE_SEED_LOGIN_KEYS = {
    f"{key}:login": login["email"]
    for key, login in EMPTY_STATE_LOGINS.items()
    if key in {"viewer_empty", "vendor_empty"}
}

MANAGER_ROLES = {"org_admin", "coordinator"}
ACTIVE_FIELD_STATUSES = {"open", "in_progress", "paused", "escalated"}


class RoleSmokeRequestError(RuntimeError):
    pass


def _find_by_title(rows: list[dict[str, Any]], title_fragment: str) -> dict[str, Any] | None:
    fragment = title_fragment.lower()
    for row in rows:
        if fragment in str(row.get("title") or "").lower():
            return row
    return None


def _record_title_presence(
    checks: list[dict[str, Any]],
    key: str,
    rows: list[dict[str, Any]],
    title_fragment: str,
    detail: str,
) -> dict[str, Any] | None:
    row = _find_by_title(rows, title_fragment)
    _record(
        checks,
        key,
        row is not None,
        detail if row else f"Could not find seeded work order containing '{title_fragment}'.",
    )
    return row


def _request(
    method: str,
    base_url: str,
    path: str,
    *,
    token: str | None = None,
    json_body: dict[str, Any] | None = None,
    timeout: int = DEFAULT_REQUEST_TIMEOUT,
) -> requests.Response:
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    try:
        return requests.request(
            method,
            f"{base_url.rstrip('/')}{path}",
            headers=headers,
            json=json_body,
            timeout=timeout,
        )
    except requests.RequestException as exc:
        raise RoleSmokeRequestError(f"{method} {path} failed: {exc}") from exc


def _failed_evidence(base_url: str, error: str) -> dict[str, Any]:
    evidence = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "base_url": base_url,
        "roles": [],
        "tokens_saved": False,
        "passed": False,
        "check_count": 1,
        "error": error,
    }
    evidence["diagnostics"] = diagnose_role_smoke_evidence(evidence)
    return evidence


def _failed_check_keys(evidence: dict[str, Any]) -> list[str]:
    keys: list[str] = []
    for role in evidence.get("roles", []):
        for check in role.get("checks", []):
            if not check.get("passed"):
                keys.append(str(check.get("key", "unknown_check")))
    return keys


def diagnose_role_smoke_evidence(evidence: dict[str, Any]) -> dict[str, Any]:
    failed_keys = _failed_check_keys(evidence)
    stale_keys = [key for key in failed_keys if key in STALE_SEED_LOGIN_KEYS]
    missing_emails = [STALE_SEED_LOGIN_KEYS[key] for key in stale_keys]
    stale_seed_suspected = bool(stale_keys)

    recommended_next_steps = [
        "Run python scripts\\seed_demo_data.py status --strict against the local/demo database.",
        "If strict status is blocked, run python scripts\\seed_demo_data.py seed --reset-existing.",
        "Rerun scripts\\smoke_role_ux.py after the API is still running on http://127.0.0.1:8000.",
    ]
    if stale_seed_suspected:
        recommended_next_steps.insert(
            0,
            "The failed empty-state login checks match a stale demo seed created before the quiet viewer/vendor users existed.",
        )

    return {
        "stale_seed_suspected": stale_seed_suspected,
        "stale_seed_login_keys": stale_keys,
        "missing_empty_state_logins": missing_emails,
        "failed_check_count": len(failed_keys),
        "recommended_next_steps": recommended_next_steps,
    }


def load_smoke_evidence(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def print_diagnosis(diagnosis: dict[str, Any]) -> None:
    print("TechSync Ops role smoke diagnosis")
    print(f"Stale seed suspected: {diagnosis['stale_seed_suspected']}")
    if diagnosis["stale_seed_login_keys"]:
        print("Blocked checks:")
        for key in diagnosis["stale_seed_login_keys"]:
            print(f"- {key}")
    if diagnosis["missing_empty_state_logins"]:
        print("Missing empty-state login emails:")
        for email in diagnosis["missing_empty_state_logins"]:
            print(f"- {email}")
    print("Recommended next steps:")
    for step in diagnosis["recommended_next_steps"]:
        print(f"- {step}")


def _failed_checks_with_details(evidence: dict[str, Any], *, limit: int = 8) -> list[str]:
    rows: list[str] = []
    for role in evidence.get("roles", []):
        for check in role.get("checks", []):
            if check.get("passed"):
                continue
            key = str(check.get("key", "unknown_check"))
            detail = str(check.get("detail", "No detail recorded."))
            rows.append(f"{key}: {detail}")

    hidden_count = max(len(rows) - limit, 0)
    visible = rows[:limit]
    if hidden_count:
        visible.append(f"+{hidden_count} more failed check(s); inspect the sanitized JSON for full details.")
    return visible


def print_smoke_result(evidence: dict[str, Any], output_path: str) -> None:
    status = "passed" if evidence["passed"] else "failed"
    print(f"Role UX smoke {status}: {evidence['check_count']} checks -> {output_path}")
    if evidence["passed"]:
        return

    failed_rows = _failed_checks_with_details(evidence)
    if failed_rows:
        print("Failed checks:")
        for row in failed_rows:
            print(f"- {row}")

    diagnosis = evidence.get("diagnostics") or diagnose_role_smoke_evidence(evidence)
    if diagnosis["stale_seed_suspected"]:
        print("")
        print_diagnosis(diagnosis)


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


def _check_seeded_screenshot_scenarios(
    base_url: str,
    role: str,
    token: str,
    rows: list[dict[str, Any]],
    checks: list[dict[str, Any]],
) -> None:
    titles = {str(row.get("title") or "") for row in rows}

    if role in MANAGER_ROLES:
        _record(
            checks,
            f"{role}:manager_seed_depth",
            len(rows) >= 8,
            f"Manager queue returned {len(rows)} seeded work orders; expected at least 8 for dashboard screenshots.",
        )
        for status_name in ("open", "in_progress", "paused", "escalated", "completed", "archived"):
            _record(
                checks,
                f"{role}:status_{status_name}",
                any(row.get("status") == status_name for row in rows),
                f"Manager queue includes {status_name} work for status/lifecycle evidence.",
            )
        return

    if role == "technician":
        _record(
            checks,
            "technician:active_assigned_only",
            all(row.get("status") in ACTIVE_FIELD_STATUSES for row in rows),
            "Technician queue contains only active assigned field statuses.",
        )
        _record_title_presence(
            checks,
            "technician:in_progress_detail_target",
            rows,
            "Lobby breaker panel inspection",
            "Technician detail screenshot target is present.",
        )
        _record_title_presence(
            checks,
            "technician:escalated_target",
            rows,
            "Escalated roof access safety review",
            "Technician escalated-work scenario is present.",
        )
        return

    if role == "client":
        pending = [row for row in rows if row.get("client_approval_status") == "pending"]
        _record(
            checks,
            "client:pending_approval_target",
            len(pending) >= 1,
            f"Client queue returned {len(pending)} pending approval work order(s).",
        )
        _record(
            checks,
            "client:unrelated_viewer_work_hidden",
            not any("Townhome" in title or "cabinet" in title.lower() for title in titles),
            "Client queue hides unrelated owner-group work orders.",
        )
        return

    if role == "viewer":
        _record(
            checks,
            "viewer:client_scope_present",
            any("Townhome" in title for title in titles),
            "Viewer queue includes linked owner-group work.",
        )
        _record(
            checks,
            "viewer:unrelated_client_work_hidden",
            not any("Emergency leak" in title or "Riverside" in title for title in titles),
            "Viewer queue hides unrelated Riverside client work.",
        )
        return

    if role == "vendor":
        vendor_target = _record_title_presence(
            checks,
            "vendor:linked_work_target",
            rows,
            "Emergency leak under kitchen sink",
            "Vendor queue includes linked Apex work.",
        )
        _record(
            checks,
            "vendor:unrelated_vendor_work_hidden",
            not any("breaker panel" in title.lower() or "lights flickering" in title.lower() for title in titles),
            "Vendor queue hides BrightLine-only work orders.",
        )
        if vendor_target:
            messages = _request(
                "GET",
                base_url,
                f"/work-orders/{vendor_target['id']}/messages",
                token=token,
            )
            message_rows = _safe_json(messages) or []
            _record(
                checks,
                "vendor:vendor_visible_message_seeded",
                messages.ok
                and isinstance(message_rows, list)
                and any(row.get("visibility") == "vendor" for row in message_rows)
                and all(row.get("visibility") == "vendor" for row in message_rows),
                (
                    f"Vendor target messages returned {messages.status_code} with "
                    f"{len(message_rows) if isinstance(message_rows, list) else 'non-list'} visible row(s)."
                ),
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

    _check_seeded_screenshot_scenarios(base_url, role, token, rows, checks)

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


def _check_empty_state_surface(
    base_url: str,
    key: str,
    login: dict[str, str],
    password: str,
    checks: list[dict[str, Any]],
) -> None:
    token, login_result = _login(base_url, login["email"], password)
    _record(
        checks,
        f"{key}:login",
        bool(token),
        (
            f"Login for {login['email']} returned {login_result['status_code']}"
            f" after {login_result['attempts']} attempt(s)"
        ),
    )
    if not token:
        return

    me = _request("GET", base_url, "/auth/me", token=token)
    me_body = _safe_json(me) or {}
    _record(
        checks,
        f"{key}:me",
        me.ok and me_body.get("role") == login["expected_role"],
        f"/auth/me returned role {me_body.get('role')} with status {me.status_code}",
    )

    response = _request("GET", base_url, login["queue_path"], token=token)
    rows = _safe_json(response) or []
    _record(
        checks,
        f"{key}:empty_queue",
        response.ok and isinstance(rows, list) and len(rows) == 0,
        f"{login['queue_path']} returned {response.status_code} with {len(rows) if isinstance(rows, list) else 'non-list'} rows; expected 0",
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

    for key, login in EMPTY_STATE_LOGINS.items():
        checks = []
        _check_empty_state_surface(base_url, key, login, password, checks)
        all_checks.extend(checks)
        evidence["roles"].append(
            {
                "role": key,
                "email": login["email"],
                "passed": all(check["passed"] for check in checks),
                "checks": checks,
            }
        )

    evidence["passed"] = all(check["passed"] for check in all_checks)
    evidence["check_count"] = len(all_checks)
    evidence["diagnostics"] = diagnose_role_smoke_evidence(evidence)
    return evidence


def main() -> int:
    parser = argparse.ArgumentParser(description="Run synthetic role UX smoke checks.")
    parser.add_argument("--base-url", default=os.getenv("TECHSYNC_API_BASE_URL", DEFAULT_BASE_URL))
    parser.add_argument("--password", default=DEFAULT_PASSWORD)
    parser.add_argument("--output", default=DEFAULT_OUTPUT)
    parser.add_argument(
        "--diagnose",
        metavar="PATH",
        help="Read an existing sanitized smoke evidence JSON and print stale-seed guidance.",
    )
    args = parser.parse_args()

    if args.diagnose:
        evidence = load_smoke_evidence(Path(args.diagnose))
        print_diagnosis(diagnose_role_smoke_evidence(evidence))
        return 0

    try:
        evidence = run_smoke(args.base_url, args.password)
    except RoleSmokeRequestError as exc:
        evidence = _failed_evidence(args.base_url, str(exc))
        Path(args.output).write_text(json.dumps(evidence, indent=2), encoding="utf-8")
        print(f"Role UX smoke failed: {exc} -> {args.output}")
        return 1

    Path(args.output).write_text(json.dumps(evidence, indent=2), encoding="utf-8")
    print_smoke_result(evidence, args.output)
    return 0 if evidence["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
