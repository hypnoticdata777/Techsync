import importlib.util
import json
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPT_PATH = REPO_ROOT / "scripts" / "build_role_ux_evidence_pack.py"
SPEC = importlib.util.spec_from_file_location("build_role_ux_evidence_pack", SCRIPT_PATH)
evidence_pack = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = evidence_pack
SPEC.loader.exec_module(evidence_pack)


def _write_smoke(path: Path, *, passed=True, tokens_saved=False, failed_key=None):
    checks = [{"key": "health", "passed": True, "detail": "/health returned 200"}]
    if failed_key:
        checks.append({"key": failed_key, "passed": False, "detail": "synthetic failure"})
    path.write_text(
        json.dumps(
            {
                "passed": passed,
                "check_count": len(checks),
                "tokens_saved": tokens_saved,
                "roles": [{"role": "org_admin", "email": "admin.demo@example.dev", "checks": checks}],
            }
        ),
        encoding="utf-8",
    )


def _write_manual_notes(path: Path, *, passed=True, missing_notes=False):
    path.write_text(
        json.dumps(
            {
                "environment": "local",
                "reviewer": "test",
                "completed_at": "2026-07-30T00:00:00Z",
                "checks": [
                    {
                        "key": "mobile_layout_390",
                        "label": "390px layout has no clipped controls.",
                        "passed": passed,
                        "notes": "" if missing_notes else "Verified at 390px.",
                    },
                    {
                        "key": "screenshot_safety",
                        "label": "Screenshots are sanitized.",
                        "passed": True,
                        "notes": "No secrets, terminals, or provider dashboards visible.",
                    },
                ],
            }
        ),
        encoding="utf-8",
    )


def test_smoke_summary_requires_passed_checks_and_no_saved_tokens(tmp_path):
    smoke_path = tmp_path / "role-ux-smoke-evidence.json"
    _write_smoke(smoke_path)

    summary = evidence_pack.summarize_smoke(smoke_path)

    assert summary.clean is True
    assert summary.check_count == 1
    assert summary.failed_checks == []

    _write_smoke(smoke_path, passed=False, tokens_saved=True, failed_key="client:queue")
    summary = evidence_pack.summarize_smoke(smoke_path)

    assert summary.clean is False
    assert summary.tokens_saved is True
    assert summary.failed_checks == ["client:queue"]


def test_manual_notes_require_passed_checks_and_notes(tmp_path):
    manual_notes_path = tmp_path / "local-role-ux-manual-notes.json"
    _write_manual_notes(manual_notes_path)

    summary = evidence_pack.summarize_manual_notes(manual_notes_path)

    assert summary.clean is True
    assert summary.check_count == 2
    assert summary.failed_checks == []
    assert summary.missing_notes == []

    _write_manual_notes(manual_notes_path, passed=False, missing_notes=True)
    summary = evidence_pack.summarize_manual_notes(manual_notes_path)

    assert summary.clean is False
    assert summary.failed_checks == ["mobile_layout_390"]
    assert summary.missing_notes == ["mobile_layout_390"]


def test_screenshot_inventory_tracks_expected_missing_extra_and_unsafe_names(tmp_path):
    screenshot_dir = tmp_path / "screenshots"
    screenshot_dir.mkdir()
    expected_name = evidence_pack.EXPECTED_SCREENSHOTS[0][2]
    (screenshot_dir / expected_name).write_bytes(b"fake png")
    (screenshot_dir / "unexpected-extra.png").write_bytes(b"fake png")
    (screenshot_dir / "database_url-leak.png").write_bytes(b"fake png")

    inventory = evidence_pack.inventory_screenshots(screenshot_dir)

    assert expected_name in inventory.present
    assert len(inventory.missing) == len(evidence_pack.EXPECTED_SCREENSHOTS) - 1
    assert "unexpected-extra.png" in inventory.extra_pngs
    assert "database_url-leak.png" in inventory.unsafe_names
    assert inventory.complete is False


def test_build_report_writes_sanitized_markdown_with_missing_screenshot_list(tmp_path):
    smoke_path = tmp_path / "role-ux-smoke-evidence.json"
    screenshot_dir = tmp_path / "screenshots"
    manual_notes_path = tmp_path / "local-role-ux-manual-notes.json"
    output_path = tmp_path / "role-ux-evidence-pack.md"
    screenshot_dir.mkdir()
    _write_smoke(smoke_path)
    _write_manual_notes(manual_notes_path)
    (screenshot_dir / evidence_pack.EXPECTED_SCREENSHOTS[0][2]).write_bytes(b"fake png")

    result = evidence_pack.build_report(
        smoke_path=smoke_path,
        screenshot_dir=screenshot_dir,
        manual_notes_path=manual_notes_path,
        output_path=output_path,
        environment="local",
        git_commit="abc123",
    )

    body = output_path.read_text(encoding="utf-8")
    assert result["smoke_clean"] is True
    assert result["screenshots_complete"] is False
    assert result["manual_clean"] is True
    assert "TechSync Ops Role UX Evidence Pack" in body
    assert "Missing screenshots: 20" in body
    assert "Capture the missing role screenshots" in body
    assert "All manual checks passed with notes recorded" in body
    assert "Bearer" not in body
    assert "postgresql://" not in body
