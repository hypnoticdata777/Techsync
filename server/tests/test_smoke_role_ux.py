import importlib.util
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPT_PATH = REPO_ROOT / "scripts" / "smoke_role_ux.py"
SPEC = importlib.util.spec_from_file_location("smoke_role_ux", SCRIPT_PATH)
smoke_role_ux = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = smoke_role_ux
SPEC.loader.exec_module(smoke_role_ux)


def _check_map(checks):
    return {check["key"]: check for check in checks}


def test_client_scenario_requires_pending_approval_and_hides_unrelated_work():
    checks = []

    smoke_role_ux._check_seeded_screenshot_scenarios(
        "http://example.invalid",
        "client",
        "token",
        [
            {
                "id": 1,
                "title": "Emergency leak under kitchen sink",
                "client_approval_status": "pending",
            }
        ],
        checks,
    )

    by_key = _check_map(checks)
    assert by_key["client:pending_approval_target"]["passed"] is True
    assert by_key["client:unrelated_viewer_work_hidden"]["passed"] is True


def test_vendor_scenario_requires_linked_vendor_message(monkeypatch):
    checks = []

    class FakeResponse:
        ok = True
        status_code = 200
        headers = {"content-type": "application/json"}

        def json(self):
            return [{"visibility": "vendor", "body": "Synthetic vendor update"}]

    monkeypatch.setattr(
        smoke_role_ux,
        "_request",
        lambda *args, **kwargs: FakeResponse(),
    )

    smoke_role_ux._check_seeded_screenshot_scenarios(
        "http://example.invalid",
        "vendor",
        "token",
        [{"id": 7, "title": "Emergency leak under kitchen sink"}],
        checks,
    )

    by_key = _check_map(checks)
    assert by_key["vendor:linked_work_target"]["passed"] is True
    assert by_key["vendor:unrelated_vendor_work_hidden"]["passed"] is True
    assert by_key["vendor:vendor_visible_message_seeded"]["passed"] is True


def test_manager_scenario_requires_full_lifecycle_depth():
    checks = []

    smoke_role_ux._check_seeded_screenshot_scenarios(
        "http://example.invalid",
        "org_admin",
        "token",
        [
            {"id": index, "title": f"Work {index}", "status": status}
            for index, status in enumerate(
                [
                    "open",
                    "in_progress",
                    "paused",
                    "escalated",
                    "completed",
                    "archived",
                    "open",
                    "open",
                ],
                start=1,
            )
        ],
        checks,
    )

    assert all(check["passed"] for check in checks)


def test_failed_evidence_is_sanitized():
    evidence = smoke_role_ux._failed_evidence(
        "http://127.0.0.1:8000",
        "POST /auth/login failed: timed out",
    )

    assert evidence["passed"] is False
    assert evidence["tokens_saved"] is False
    assert evidence["roles"] == []
    assert "password" not in str(evidence).lower()
    assert "bearer" not in str(evidence).lower()


def test_smoke_diagnosis_flags_stale_empty_state_seed():
    evidence = {
        "passed": False,
        "roles": [
            {
                "role": "viewer_empty",
                "checks": [{"key": "viewer_empty:login", "passed": False, "detail": "401"}],
            },
            {
                "role": "vendor_empty",
                "checks": [{"key": "vendor_empty:login", "passed": False, "detail": "401"}],
            },
        ],
    }

    diagnosis = smoke_role_ux.diagnose_role_smoke_evidence(evidence)

    assert diagnosis["stale_seed_suspected"] is True
    assert diagnosis["stale_seed_login_keys"] == ["viewer_empty:login", "vendor_empty:login"]
    assert diagnosis["missing_empty_state_logins"] == [
        "quiet-owner.demo@demo.techsyncops.dev",
        "quiet-vendor.demo@demo.techsyncops.dev",
    ]
    assert "password" not in str(diagnosis).lower()
    assert "token" not in str(diagnosis).lower()


def test_smoke_diagnosis_stays_clean_for_passed_evidence():
    evidence = {
        "passed": True,
        "roles": [
            {
                "role": "viewer_empty",
                "checks": [{"key": "viewer_empty:login", "passed": True, "detail": "200"}],
            }
        ],
    }

    diagnosis = smoke_role_ux.diagnose_role_smoke_evidence(evidence)

    assert diagnosis["stale_seed_suspected"] is False
    assert diagnosis["stale_seed_login_keys"] == []
    assert diagnosis["missing_empty_state_logins"] == []
