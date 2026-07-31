import importlib.util
import json
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPT_PATH = REPO_ROOT / "scripts" / "pre_hosting_readiness.py"
SPEC = importlib.util.spec_from_file_location("pre_hosting_readiness", SCRIPT_PATH)
readiness = importlib.util.module_from_spec(SPEC)
sys.path.insert(0, str(REPO_ROOT / "scripts"))
sys.modules[SPEC.name] = readiness
SPEC.loader.exec_module(readiness)


def _copy_required_files(repo_root: Path):
    for relative in readiness.REQUIRED_TRACKED_FILES:
        path = repo_root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        if relative.endswith(".json"):
            path.write_text("{}", encoding="utf-8")
        else:
            path.write_text("placeholder", encoding="utf-8")

    (repo_root / ".gitignore").write_text(
        "\n".join(readiness.IGNORED_LOCAL_PATTERNS) + "\n",
        encoding="utf-8",
    )
    (repo_root / "ROLE_UX_MANUAL_NOTES_TEMPLATE.json").write_text(
        (REPO_ROOT / "ROLE_UX_MANUAL_NOTES_TEMPLATE.json").read_text(encoding="utf-8"),
        encoding="utf-8",
    )


def _write_clean_smoke(path: Path):
    path.write_text(
        json.dumps(
            {
                "passed": True,
                "check_count": 2,
                "tokens_saved": False,
                "roles": [
                    {
                        "role": "org_admin",
                        "email": "admin.demo@demo.techsyncops.dev",
                        "checks": [
                            {"key": "health", "passed": True, "detail": "ok"},
                            {"key": "queue", "passed": True, "detail": "ok"},
                        ],
                    }
                ],
            }
        ),
        encoding="utf-8",
    )


def _write_stale_seed_smoke(path: Path):
    path.write_text(
        json.dumps(
            {
                "passed": False,
                "check_count": 2,
                "tokens_saved": False,
                "roles": [
                    {
                        "role": "viewer_empty",
                        "email": "quiet-owner.demo@demo.techsyncops.dev",
                        "checks": [
                            {"key": "viewer_empty:login", "passed": False, "detail": "401"}
                        ],
                    },
                    {
                        "role": "vendor_empty",
                        "email": "quiet-vendor.demo@demo.techsyncops.dev",
                        "checks": [
                            {"key": "vendor_empty:login", "passed": False, "detail": "401"}
                        ],
                    },
                ],
            }
        ),
        encoding="utf-8",
    )


def _write_complete_manual_notes(path: Path):
    path.write_text(
        json.dumps(
            {
                "checks": [
                    {"key": f"check_{index}", "passed": True, "notes": "Verified."}
                    for index in range(1, 9)
                ],
                "role_notes": [
                    {"role": role, "passed": True, "notes": f"Verified {role}."}
                    for role in readiness.REQUIRED_ROLE_NOTES
                ],
                "viewport_notes": [
                    {"key": key, "passed": True, "notes": f"Verified {key}."}
                    for key in readiness.REQUIRED_VIEWPORT_NOTES
                ],
            }
        ),
        encoding="utf-8",
    )


def test_readiness_report_separates_tracked_tooling_from_local_artifact_blockers(tmp_path):
    _copy_required_files(tmp_path)

    report = readiness.build_readiness_report(repo_root=tmp_path)
    checks = {check["key"]: check for check in report["checks"]}

    assert report["ready_for_hosting_gate"] is False
    assert checks["tracked_readiness_files"]["passed"] is True
    assert checks["local_evidence_ignored"]["passed"] is True
    assert checks["manual_notes_template"]["passed"] is True
    assert checks["screenshot_plan"]["passed"] is True
    assert checks["capture_manifest_generated"]["passed"] is False
    assert checks["role_smoke_evidence"]["passed"] is False
    assert checks["screenshot_inventory"]["passed"] is False
    assert checks["manual_notes_complete"]["passed"] is False
    assert checks["evidence_summary_json"]["passed"] is False


def test_readiness_report_explains_stale_empty_state_seed_smoke(tmp_path):
    _copy_required_files(tmp_path)
    _write_stale_seed_smoke(tmp_path / "role-ux-smoke-evidence.json")

    report = readiness.build_readiness_report(repo_root=tmp_path)
    smoke = {check["key"]: check for check in report["checks"]}["role_smoke_evidence"]

    assert smoke["passed"] is False
    assert "Stale demo seed suspected" in smoke["detail"]
    assert "quiet-owner.demo@demo.techsyncops.dev" in smoke["detail"]
    assert "quiet-vendor.demo@demo.techsyncops.dev" in smoke["detail"]
    assert "seed_demo_data.py seed --reset-existing" in smoke["detail"]


def test_readiness_report_names_missing_screenshot_rows(tmp_path):
    _copy_required_files(tmp_path)
    screenshots = tmp_path / "local-role-ux-evidence"
    screenshots.mkdir()
    for _role, _screen, filename in readiness.EXPECTED_SCREENSHOTS[:-1]:
        (screenshots / filename).write_bytes(b"fake png")

    report = readiness.build_readiness_report(repo_root=tmp_path)
    screenshot = {check["key"]: check for check in report["checks"]}["screenshot_inventory"]

    assert screenshot["passed"] is False
    assert "vendor/WorkOrdersList:techsync-ops-vendor-03-vendor-empty.png" in screenshot["detail"]


def test_readiness_report_passes_with_complete_local_evidence(tmp_path):
    _copy_required_files(tmp_path)
    (tmp_path / "local-role-ux-capture-manifest.md").write_text("# manifest", encoding="utf-8")
    screenshots = tmp_path / "local-role-ux-evidence"
    screenshots.mkdir()
    for _role, _screen, filename in readiness.EXPECTED_SCREENSHOTS:
        (screenshots / filename).write_bytes(b"fake png")

    _write_clean_smoke(tmp_path / "role-ux-smoke-evidence.json")
    _write_complete_manual_notes(tmp_path / "local-role-ux-manual-notes.json")
    (tmp_path / "role-ux-evidence-summary.json").write_text(
        json.dumps(
            {
                "smoke_clean": True,
                "screenshots_complete": True,
                "manual_clean": True,
            }
        ),
        encoding="utf-8",
    )

    report = readiness.build_readiness_report(repo_root=tmp_path)

    assert report["ready_for_hosting_gate"] is True
    assert report["blocker_count"] == 0
    assert all(check["passed"] for check in report["checks"])
