"""Check TechSync Ops local readiness before the final hosting gate.

This local-only helper does not contact Neon, Vercel, Cloudflare, Stripe, or
any external service. It inspects tracked readiness tooling plus ignored local
evidence artifacts and reports what still blocks the pre-hosting gate.
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from build_role_ux_evidence_pack import (
    DEFAULT_MANUAL_NOTES_PATH,
    DEFAULT_OUTPUT_PATH,
    DEFAULT_SCREENSHOT_DIR,
    DEFAULT_SMOKE_PATH,
    EXPECTED_SCREENSHOTS,
    REQUIRED_ROLE_NOTES,
    REQUIRED_VIEWPORT_NOTES,
    inventory_screenshots,
    summarize_manual_notes,
    summarize_smoke,
)
from smoke_role_ux import diagnose_role_smoke_evidence


REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SUMMARY_PATH = "pre-hosting-readiness-summary.json"
DEFAULT_TEMPLATE_PATH = "ROLE_UX_MANUAL_NOTES_TEMPLATE.json"
DEFAULT_CAPTURE_MANIFEST_PATH = "local-role-ux-capture-manifest.md"
DEFAULT_EVIDENCE_SUMMARY_PATH = "role-ux-evidence-summary.json"

REQUIRED_TRACKED_FILES = [
    ".gitleaks.toml",
    "ACCESSIBILITY_EVIDENCE.md",
    "DEMO_DATA_RUNBOOK.md",
    "PORTFOLIO_TECHSYNC_OPS.md",
    "QA_CHECKLIST.md",
    "ROLE_UX_CAPTURE_PASS.md",
    "ROLE_UX_EVIDENCE_TEMPLATE.md",
    "ROLE_UX_MANUAL_NOTES_TEMPLATE.json",
    "scripts/build_role_ux_evidence_pack.py",
    "scripts/prepare_role_ux_capture.py",
    "scripts/seed_demo_data.py",
    "scripts/smoke_role_ux.py",
    "scripts/smoke_v13.py",
    "server/alembic/versions/0008_vendor_visible_messages.py",
    "server/requirements-dev.txt",
    "client/package-lock.json",
]

IGNORED_LOCAL_PATTERNS = [
    "role-ux-smoke-evidence*.json",
    "role-ux-evidence-pack*.md",
    "role-ux-evidence-summary*.json",
    "local-role-ux-capture-manifest*.md",
    "local-role-ux-manual-notes*.json",
    "local-role-ux-evidence/",
    "pre-hosting-readiness*.json",
]


@dataclass(frozen=True)
class ReadinessCheck:
    key: str
    passed: bool
    detail: str
    severity: str = "blocker"


def _load_json(path: Path) -> dict[str, Any] | None:
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def _repo_path(path: str | Path, repo_root: Path) -> Path:
    candidate = Path(path)
    return candidate if candidate.is_absolute() else repo_root / candidate


def _required_files_check(repo_root: Path) -> ReadinessCheck:
    missing = [path for path in REQUIRED_TRACKED_FILES if not (repo_root / path).exists()]
    return ReadinessCheck(
        key="tracked_readiness_files",
        passed=not missing,
        detail="All required tracked readiness files exist."
        if not missing
        else "Missing tracked readiness files: " + ", ".join(missing),
    )


def _gitignore_check(repo_root: Path) -> ReadinessCheck:
    gitignore = (repo_root / ".gitignore").read_text(encoding="utf-8")
    missing = [pattern for pattern in IGNORED_LOCAL_PATTERNS if pattern not in gitignore]
    return ReadinessCheck(
        key="local_evidence_ignored",
        passed=not missing,
        detail="Local smoke, screenshot, manual-note, evidence-pack, and readiness artifacts are ignored."
        if not missing
        else "Missing .gitignore patterns: " + ", ".join(missing),
    )


def _template_check(path: Path) -> ReadinessCheck:
    template = _load_json(path)
    if template is None:
        return ReadinessCheck(
            key="manual_notes_template",
            passed=False,
            detail=f"Manual notes template not found: {path}",
        )

    checks = template.get("checks")
    role_notes = template.get("role_notes")
    viewport_notes = template.get("viewport_notes")
    missing: list[str] = []
    if not isinstance(checks, list) or len(checks) < 8:
        missing.append("at least 8 checklist rows")

    role_keys = {
        str(item.get("role"))
        for item in role_notes or []
        if isinstance(item, dict) and item.get("role")
    }
    missing_roles = [role for role in REQUIRED_ROLE_NOTES if role not in role_keys]
    if missing_roles:
        missing.append("role notes: " + ", ".join(missing_roles))

    viewport_keys = {
        str(item.get("key"))
        for item in viewport_notes or []
        if isinstance(item, dict) and item.get("key")
    }
    missing_viewports = [key for key in REQUIRED_VIEWPORT_NOTES if key not in viewport_keys]
    if missing_viewports:
        missing.append("viewport notes: " + ", ".join(missing_viewports))

    return ReadinessCheck(
        key="manual_notes_template",
        passed=not missing,
        detail="Manual notes template covers checklist, role, and viewport evidence."
        if not missing
        else "Manual notes template missing " + "; ".join(missing),
    )


def _screenshot_plan_check() -> ReadinessCheck:
    names = [item[2] for item in EXPECTED_SCREENSHOTS]
    roles = {item[0] for item in EXPECTED_SCREENSHOTS}
    passed = len(names) == 21 and len(set(names)) == len(names) and roles == set(REQUIRED_ROLE_NOTES)
    return ReadinessCheck(
        key="screenshot_plan",
        passed=passed,
        detail="Screenshot plan has 21 unique files across all six synthetic roles."
        if passed
        else "Screenshot plan must have 21 unique files across all six synthetic roles.",
    )


def _smoke_check(path: Path) -> ReadinessCheck:
    summary = summarize_smoke(path)
    evidence = _load_json(path)
    diagnosis = diagnose_role_smoke_evidence(evidence) if evidence else None
    stale_seed_detail = ""
    if diagnosis and diagnosis["stale_seed_suspected"]:
        stale_seed_detail = (
            " Stale demo seed suspected; missing empty-state logins: "
            + ", ".join(diagnosis["missing_empty_state_logins"])
            + ". Run seed_demo_data.py seed --reset-existing, then rerun role smoke."
        )
    return ReadinessCheck(
        key="role_smoke_evidence",
        passed=summary.clean,
        detail=(
            f"Role smoke evidence is clean with {summary.check_count} checks."
            if summary.clean
            else "Role smoke evidence missing or blocked: "
            + "; ".join(summary.failed_checks or ["run scripts/smoke_role_ux.py"])
            + stale_seed_detail
        ),
    )


def _screenshot_inventory_check(path: Path) -> ReadinessCheck:
    inventory = inventory_screenshots(path)
    return ReadinessCheck(
        key="screenshot_inventory",
        passed=inventory.complete,
        detail=(
            f"All {inventory.expected_count} expected screenshots are present and safely named."
            if inventory.complete
            else f"{len(inventory.present)}/{inventory.expected_count} screenshots present; "
            f"{len(inventory.missing)} missing; {len(inventory.unsafe_names)} unsafe names."
        ),
    )


def _manual_notes_check(path: Path) -> ReadinessCheck:
    summary = summarize_manual_notes(path)
    blockers = (
        summary.failed_checks
        + [f"missing note:{key}" for key in summary.missing_notes]
        + [f"malformed:{key}" for key in summary.malformed_checks]
        + [f"missing role:{role}" for role in summary.missing_role_notes]
        + [f"missing viewport:{key}" for key in summary.missing_viewport_notes]
    )
    return ReadinessCheck(
        key="manual_notes_complete",
        passed=summary.clean,
        detail=(
            f"Manual notes are complete with {summary.check_count} checklist rows."
            if summary.clean
            else "Manual notes incomplete: " + "; ".join(blockers or ["create local-role-ux-manual-notes.json"])
        ),
    )


def _evidence_summary_check(path: Path) -> ReadinessCheck:
    summary = _load_json(path)
    if summary is None:
        return ReadinessCheck(
            key="evidence_summary_json",
            passed=False,
            detail="Evidence summary JSON missing; build the evidence pack with --summary-json.",
        )

    required_true = ["smoke_clean", "screenshots_complete", "manual_clean"]
    failed = [key for key in required_true if summary.get(key) is not True]
    return ReadinessCheck(
        key="evidence_summary_json",
        passed=not failed,
        detail="Evidence summary JSON reports no smoke, screenshot, or manual blockers."
        if not failed
        else "Evidence summary JSON still reports blockers: " + ", ".join(failed),
    )


def build_readiness_report(
    *,
    repo_root: Path = REPO_ROOT,
    smoke_path: Path | str = DEFAULT_SMOKE_PATH,
    screenshot_dir: Path | str = DEFAULT_SCREENSHOT_DIR,
    manual_notes_path: Path | str = DEFAULT_MANUAL_NOTES_PATH,
    template_path: Path | str = DEFAULT_TEMPLATE_PATH,
    capture_manifest_path: Path | str = DEFAULT_CAPTURE_MANIFEST_PATH,
    evidence_summary_path: Path | str = DEFAULT_EVIDENCE_SUMMARY_PATH,
) -> dict[str, Any]:
    smoke = _repo_path(smoke_path, repo_root)
    screenshots = _repo_path(screenshot_dir, repo_root)
    manual_notes = _repo_path(manual_notes_path, repo_root)
    template = _repo_path(template_path, repo_root)
    capture_manifest = _repo_path(capture_manifest_path, repo_root)
    evidence_summary = _repo_path(evidence_summary_path, repo_root)

    checks = [
        _required_files_check(repo_root),
        _gitignore_check(repo_root),
        _template_check(template),
        _screenshot_plan_check(),
        ReadinessCheck(
            key="capture_manifest_generated",
            passed=capture_manifest.exists(),
            detail="Local capture manifest exists."
            if capture_manifest.exists()
            else "Run scripts/prepare_role_ux_capture.py to generate the local capture manifest.",
        ),
        _smoke_check(smoke),
        _screenshot_inventory_check(screenshots),
        _manual_notes_check(manual_notes),
        _evidence_summary_check(evidence_summary),
    ]
    blockers = [check for check in checks if check.severity == "blocker" and not check.passed]

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "repo_root": str(repo_root),
        "ready_for_hosting_gate": not blockers,
        "blocker_count": len(blockers),
        "checks": [check.__dict__ for check in checks],
        "local_artifacts": {
            "smoke": str(smoke),
            "screenshots": str(screenshots),
            "manual_notes": str(manual_notes),
            "capture_manifest": str(capture_manifest),
            "evidence_summary": str(evidence_summary),
        },
    }


def print_report(report: dict[str, Any]) -> None:
    print("TechSync Ops pre-hosting readiness")
    print(f"Ready for hosting gate: {report['ready_for_hosting_gate']}")
    print(f"Blockers: {report['blocker_count']}")
    for check in report["checks"]:
        mark = "PASS" if check["passed"] else "TODO"
        print(f"- {mark} {check['key']}: {check['detail']}")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Check local TechSync Ops readiness before hosting.")
    parser.add_argument("--repo-root", default=str(REPO_ROOT))
    parser.add_argument("--smoke", default=DEFAULT_SMOKE_PATH)
    parser.add_argument("--screenshots", default=DEFAULT_SCREENSHOT_DIR)
    parser.add_argument("--manual-notes", default=DEFAULT_MANUAL_NOTES_PATH)
    parser.add_argument("--template", default=DEFAULT_TEMPLATE_PATH)
    parser.add_argument("--capture-manifest", default=DEFAULT_CAPTURE_MANIFEST_PATH)
    parser.add_argument("--evidence-summary", default=DEFAULT_EVIDENCE_SUMMARY_PATH)
    parser.add_argument("--summary-json", default=None)
    parser.add_argument("--strict", action="store_true", help="Exit non-zero if any blocker remains.")
    args = parser.parse_args(argv)

    repo_root = Path(args.repo_root)
    report = build_readiness_report(
        repo_root=repo_root,
        smoke_path=args.smoke,
        screenshot_dir=args.screenshots,
        manual_notes_path=args.manual_notes,
        template_path=args.template,
        capture_manifest_path=args.capture_manifest,
        evidence_summary_path=args.evidence_summary,
    )
    print_report(report)

    if args.summary_json:
        summary_path = _repo_path(args.summary_json, repo_root)
        summary_path.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
        print(f"Readiness summary JSON written to {summary_path}")

    if args.strict and not report["ready_for_hosting_gate"]:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
