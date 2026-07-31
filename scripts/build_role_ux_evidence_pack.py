"""Build a sanitized TechSync Ops role UX evidence pack.

This local-only helper inventories the expected role screenshot filenames,
summarizes the sanitized role UX smoke JSON, and writes a Markdown evidence
report. It intentionally avoids storing credentials, bearer tokens, database
URLs, or provider details.
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


DEFAULT_SMOKE_PATH = "role-ux-smoke-evidence.json"
DEFAULT_SCREENSHOT_DIR = "local-role-ux-evidence"
DEFAULT_MANUAL_NOTES_PATH = "local-role-ux-manual-notes.json"
DEFAULT_OUTPUT_PATH = "role-ux-evidence-pack.md"

EXPECTED_SCREENSHOTS = [
    ("org_admin", "WorkOrdersList", "techsync-ops-org_admin-01-queue.png"),
    ("org_admin", "PmcDirectory", "techsync-ops-org_admin-02-directory.png"),
    ("org_admin", "DispatchBoard", "techsync-ops-org_admin-03-dispatch.png"),
    ("org_admin", "OperationsReport", "techsync-ops-org_admin-04-report.png"),
    ("org_admin", "WorkOrderForm", "techsync-ops-org_admin-05-create-work.png"),
    ("coordinator", "WorkOrdersList", "techsync-ops-coordinator-01-queue.png"),
    ("coordinator", "WorkOrderForm", "techsync-ops-coordinator-02-create-work.png"),
    ("coordinator", "DispatchBoard", "techsync-ops-coordinator-03-dispatch.png"),
    ("coordinator", "WorkOrderDetails", "techsync-ops-coordinator-04-detail.png"),
    ("technician", "WorkOrdersList", "techsync-ops-technician-01-assigned-queue.png"),
    ("technician", "WorkOrderDetails", "techsync-ops-technician-02-detail-status.png"),
    ("technician", "WorkOrdersList", "techsync-ops-technician-03-empty-assigned.png"),
    ("client", "WorkOrdersList", "techsync-ops-client-01-client-queue.png"),
    ("client", "WorkOrderDetails", "techsync-ops-client-02-approval-detail.png"),
    ("client", "WorkOrderDetails", "techsync-ops-client-03-client-messages.png"),
    ("viewer", "WorkOrdersList", "techsync-ops-viewer-01-viewer-queue.png"),
    ("viewer", "WorkOrderDetails", "techsync-ops-viewer-02-readonly-detail.png"),
    ("viewer", "WorkOrdersList", "techsync-ops-viewer-03-viewer-empty.png"),
    ("vendor", "WorkOrdersList", "techsync-ops-vendor-01-vendor-queue.png"),
    ("vendor", "WorkOrderDetails", "techsync-ops-vendor-02-vendor-detail.png"),
    ("vendor", "WorkOrdersList", "techsync-ops-vendor-03-vendor-empty.png"),
]

MANUAL_CHECKS = [
    "390px and 320px layouts have no clipped primary controls.",
    "Admin/coordinator manager actions are visible only to manager roles.",
    "Technician queue shows assigned active work only.",
    "Client approval controls appear only for pending approval work.",
    "Viewer detail is read-only.",
    "Vendor detail exposes vendor-visible communication only.",
    "Screen-reader notes are recorded for queue, detail, dispatch, form, and evidence screens.",
    "Screenshot safety review confirms no terminals, secrets, provider dashboards, or real data.",
]

REQUIRED_ROLE_NOTES = ["org_admin", "coordinator", "technician", "client", "viewer", "vendor"]
REQUIRED_VIEWPORT_NOTES = ["mobile_390", "narrow_320", "desktop_review"]

UNSAFE_ARTIFACT_TERMS = (
    "database_url",
    "jwt_secret",
    "secret",
    "token",
    "password",
    "postgresql",
    "neon.tech",
    "bearer",
)


@dataclass(frozen=True)
class ScreenshotInventory:
    expected_count: int
    present: list[str]
    missing: list[str]
    extra_pngs: list[str]
    unsafe_names: list[str]

    @property
    def complete(self) -> bool:
        return not self.missing and not self.unsafe_names


@dataclass(frozen=True)
class SmokeSummary:
    exists: bool
    passed: bool
    check_count: int
    failed_checks: list[str]
    tokens_saved: bool

    @property
    def clean(self) -> bool:
        return self.exists and self.passed and not self.failed_checks and not self.tokens_saved


@dataclass(frozen=True)
class ManualSummary:
    exists: bool
    check_count: int
    failed_checks: list[str]
    missing_notes: list[str]
    malformed_checks: list[str]
    missing_role_notes: list[str]
    missing_viewport_notes: list[str]

    @property
    def clean(self) -> bool:
        return (
            self.exists
            and self.check_count > 0
            and not self.failed_checks
            and not self.missing_notes
            and not self.malformed_checks
            and not self.missing_role_notes
            and not self.missing_viewport_notes
        )


def load_json(path: Path) -> dict[str, Any] | None:
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def summarize_smoke(smoke_path: Path) -> SmokeSummary:
    evidence = load_json(smoke_path)
    if evidence is None:
        return SmokeSummary(
            exists=False,
            passed=False,
            check_count=0,
            failed_checks=["Smoke evidence file was not found."],
            tokens_saved=False,
        )

    failed_checks: list[str] = []
    for role in evidence.get("roles", []):
        for check in role.get("checks", []):
            if not check.get("passed"):
                failed_checks.append(check.get("key", "unknown_check"))

    return SmokeSummary(
        exists=True,
        passed=bool(evidence.get("passed")),
        check_count=int(evidence.get("check_count", 0)),
        failed_checks=failed_checks,
        tokens_saved=bool(evidence.get("tokens_saved")),
    )


def inventory_screenshots(screenshot_dir: Path) -> ScreenshotInventory:
    expected_names = [item[2] for item in EXPECTED_SCREENSHOTS]
    present_names: list[str] = []
    extra_pngs: list[str] = []

    if screenshot_dir.exists():
        png_names = sorted(path.name for path in screenshot_dir.glob("*.png") if path.is_file())
        present_names = [name for name in expected_names if name in png_names]
        extra_pngs = [name for name in png_names if name not in expected_names]

    missing = [name for name in expected_names if name not in present_names]
    unsafe_names = [
        name
        for name in present_names + extra_pngs
        if any(term in name.lower() for term in UNSAFE_ARTIFACT_TERMS)
    ]

    return ScreenshotInventory(
        expected_count=len(expected_names),
        present=present_names,
        missing=missing,
        extra_pngs=extra_pngs,
        unsafe_names=unsafe_names,
    )


def summarize_manual_notes(manual_notes_path: Path) -> ManualSummary:
    evidence = load_json(manual_notes_path)
    if evidence is None:
        return ManualSummary(
            exists=False,
            check_count=0,
            failed_checks=["Manual notes file was not found."],
            missing_notes=[],
            malformed_checks=[],
            missing_role_notes=REQUIRED_ROLE_NOTES,
            missing_viewport_notes=REQUIRED_VIEWPORT_NOTES,
        )

    checks = evidence.get("checks")
    if not isinstance(checks, list):
        return ManualSummary(
            exists=True,
            check_count=0,
            failed_checks=[],
            missing_notes=[],
            malformed_checks=["checks must be a list"],
            missing_role_notes=REQUIRED_ROLE_NOTES,
            missing_viewport_notes=REQUIRED_VIEWPORT_NOTES,
        )

    failed_checks: list[str] = []
    missing_notes: list[str] = []
    malformed_checks: list[str] = []

    for index, check in enumerate(checks, start=1):
        if not isinstance(check, dict):
            malformed_checks.append(f"check_{index}: expected object")
            continue

        key = str(check.get("key") or f"check_{index}")
        if check.get("passed") is not True:
            failed_checks.append(key)
        if not str(check.get("notes") or "").strip():
            missing_notes.append(key)

    role_notes = evidence.get("role_notes")
    viewport_notes = evidence.get("viewport_notes")

    if not isinstance(role_notes, list):
        missing_role_notes = REQUIRED_ROLE_NOTES.copy()
    else:
        role_note_by_key = {
            str(item.get("role")): item
            for item in role_notes
            if isinstance(item, dict) and item.get("role")
        }
        missing_role_notes = [
            role
            for role in REQUIRED_ROLE_NOTES
            if role not in role_note_by_key
            or role_note_by_key[role].get("passed") is not True
            or not str(role_note_by_key[role].get("notes") or "").strip()
        ]

    if not isinstance(viewport_notes, list):
        missing_viewport_notes = REQUIRED_VIEWPORT_NOTES.copy()
    else:
        viewport_note_by_key = {
            str(item.get("key")): item
            for item in viewport_notes
            if isinstance(item, dict) and item.get("key")
        }
        missing_viewport_notes = [
            key
            for key in REQUIRED_VIEWPORT_NOTES
            if key not in viewport_note_by_key
            or viewport_note_by_key[key].get("passed") is not True
            or not str(viewport_note_by_key[key].get("notes") or "").strip()
        ]

    return ManualSummary(
        exists=True,
        check_count=len(checks),
        failed_checks=failed_checks,
        missing_notes=missing_notes,
        malformed_checks=malformed_checks,
        missing_role_notes=missing_role_notes,
        missing_viewport_notes=missing_viewport_notes,
    )


def _status_mark(passed: bool) -> str:
    return "PASS" if passed else "PENDING"


def build_report(
    *,
    smoke_path: Path,
    screenshot_dir: Path,
    manual_notes_path: Path,
    output_path: Path,
    environment: str,
    git_commit: str | None,
) -> dict[str, Any]:
    smoke = summarize_smoke(smoke_path)
    screenshots = inventory_screenshots(screenshot_dir)
    manual = summarize_manual_notes(manual_notes_path)
    generated_at = datetime.now(timezone.utc).isoformat()

    lines = [
        "# TechSync Ops Role UX Evidence Pack",
        "",
        f"Generated: {generated_at}",
        f"Environment: {environment}",
        f"Git commit: {git_commit or 'not recorded'}",
        f"Smoke evidence: `{smoke_path}`",
        f"Screenshot directory: `{screenshot_dir}`",
        f"Manual notes: `{manual_notes_path}`",
        "",
        "## Automated Smoke Summary",
        "",
        f"- Status: {_status_mark(smoke.clean)}",
        f"- Smoke file found: {smoke.exists}",
        f"- Smoke passed: {smoke.passed}",
        f"- Checks reported: {smoke.check_count}",
        f"- Tokens saved: {smoke.tokens_saved}",
        "",
    ]

    if smoke.failed_checks:
        lines.extend(["Failed checks:", ""])
        lines.extend(f"- `{check}`" for check in smoke.failed_checks)
        lines.append("")

    lines.extend(
        [
            "## Screenshot Inventory",
            "",
            f"- Status: {_status_mark(screenshots.complete)}",
            f"- Expected screenshots: {screenshots.expected_count}",
            f"- Present screenshots: {len(screenshots.present)}",
            f"- Missing screenshots: {len(screenshots.missing)}",
            f"- Extra PNG files: {len(screenshots.extra_pngs)}",
            f"- Unsafe artifact names: {len(screenshots.unsafe_names)}",
            "",
            "| Role | Screen | Filename | Status |",
            "|---|---|---|---|",
        ]
    )

    present_set = set(screenshots.present)
    for role, screen, filename in EXPECTED_SCREENSHOTS:
        status = "present" if filename in present_set else "missing"
        lines.append(f"| {role} | {screen} | `{filename}` | {status} |")

    if screenshots.extra_pngs:
        lines.extend(["", "Extra PNGs:", ""])
        lines.extend(f"- `{name}`" for name in screenshots.extra_pngs)

    if screenshots.unsafe_names:
        lines.extend(["", "Unsafe artifact names:", ""])
        lines.extend(f"- `{name}`" for name in screenshots.unsafe_names)

    lines.extend(
        [
            "",
            "## Manual Evidence Checks",
            "",
            f"- Status: {_status_mark(manual.clean)}",
            f"- Manual notes file found: {manual.exists}",
            f"- Checks recorded: {manual.check_count}",
            f"- Failed/manual-pending checks: {len(manual.failed_checks)}",
            f"- Checks missing notes: {len(manual.missing_notes)}",
            f"- Malformed checks: {len(manual.malformed_checks)}",
            f"- Role notes missing/incomplete: {len(manual.missing_role_notes)}",
            f"- Viewport notes missing/incomplete: {len(manual.missing_viewport_notes)}",
            "",
        ]
    )

    if manual.exists:
        lines.extend(["Manual note gaps:", ""])
        if manual.failed_checks:
            lines.extend(f"- Pending: `{check}`" for check in manual.failed_checks)
        if manual.missing_notes:
            lines.extend(f"- Missing notes: `{check}`" for check in manual.missing_notes)
        if manual.malformed_checks:
            lines.extend(f"- Malformed: `{check}`" for check in manual.malformed_checks)
        if manual.missing_role_notes:
            lines.extend(f"- Missing role note: `{role}`" for role in manual.missing_role_notes)
        if manual.missing_viewport_notes:
            lines.extend(f"- Missing viewport note: `{viewport}`" for viewport in manual.missing_viewport_notes)
        if manual.clean:
            lines.append("- All manual checks passed with notes recorded.")
    else:
        lines.extend(f"- [ ] {check}" for check in MANUAL_CHECKS)

    lines.extend(
        [
            "",
            "## Safety Notes",
            "",
            "- This report never includes bearer tokens, database URLs, or passwords.",
            "- Review image contents manually before portfolio or investor use.",
            "- Keep generated evidence artifacts local unless explicitly approved.",
            "",
            "## Next Actions",
            "",
        ]
    )

    if not smoke.clean:
        lines.append("- Re-run `scripts\\smoke_role_ux.py` until all synthetic role checks pass.")
    if screenshots.missing:
        lines.append("- Capture the missing role screenshots listed above.")
    if screenshots.unsafe_names:
        lines.append("- Rename or discard unsafe screenshot artifacts before sharing.")
    if not manual.clean:
        lines.append("- Complete `local-role-ux-manual-notes.json` from the tracked template.")

    output_path.write_text("\n".join(lines) + "\n", encoding="utf-8")

    return {
        "smoke_clean": smoke.clean,
        "screenshots_complete": screenshots.complete,
        "manual_clean": manual.clean,
        "expected_screenshot_count": screenshots.expected_count,
        "present_screenshot_count": len(screenshots.present),
        "extra_pngs": screenshots.extra_pngs,
        "unsafe_names": screenshots.unsafe_names,
        "missing_screenshots": screenshots.missing,
        "manual_failed_checks": manual.failed_checks,
        "manual_missing_notes": manual.missing_notes,
        "manual_malformed_checks": manual.malformed_checks,
        "manual_missing_role_notes": manual.missing_role_notes,
        "manual_missing_viewport_notes": manual.missing_viewport_notes,
        "output_path": str(output_path),
    }


def write_summary_json(*, summary_path: Path, result: dict[str, Any], environment: str) -> None:
    payload = {
        "environment": environment,
        "smoke_clean": result["smoke_clean"],
        "screenshots_complete": result["screenshots_complete"],
        "manual_clean": result["manual_clean"],
        "expected_screenshot_count": result["expected_screenshot_count"],
        "present_screenshot_count": result["present_screenshot_count"],
        "missing_screenshot_count": len(result["missing_screenshots"]),
        "missing_screenshots": result["missing_screenshots"],
        "extra_pngs": result["extra_pngs"],
        "unsafe_names": result["unsafe_names"],
        "manual_failed_checks": result["manual_failed_checks"],
        "manual_missing_notes": result["manual_missing_notes"],
        "manual_malformed_checks": result["manual_malformed_checks"],
        "manual_missing_role_notes": result["manual_missing_role_notes"],
        "manual_missing_viewport_notes": result["manual_missing_viewport_notes"],
        "evidence_report": result["output_path"],
    }
    summary_path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def print_blockers(result: dict[str, Any]) -> None:
    if result["missing_screenshots"]:
        print("Missing screenshot files:")
        for filename in result["missing_screenshots"]:
            print(f"- {filename}")

    manual_blockers = (
        result["manual_failed_checks"]
        or result["manual_missing_notes"]
        or result["manual_malformed_checks"]
        or result["manual_missing_role_notes"]
        or result["manual_missing_viewport_notes"]
    )
    if manual_blockers:
        print("Manual note blockers:")
        for check in result["manual_failed_checks"]:
            print(f"- pending: {check}")
        for check in result["manual_missing_notes"]:
            print(f"- missing note: {check}")
        for check in result["manual_malformed_checks"]:
            print(f"- malformed: {check}")
        for role in result["manual_missing_role_notes"]:
            print(f"- missing role note: {role}")
        for viewport in result["manual_missing_viewport_notes"]:
            print(f"- missing viewport note: {viewport}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Build the TechSync Ops role UX evidence pack.")
    parser.add_argument("--smoke", default=DEFAULT_SMOKE_PATH)
    parser.add_argument("--screenshots", default=DEFAULT_SCREENSHOT_DIR)
    parser.add_argument("--manual-notes", default=DEFAULT_MANUAL_NOTES_PATH)
    parser.add_argument("--output", default=DEFAULT_OUTPUT_PATH)
    parser.add_argument(
        "--summary-json",
        default=None,
        help="Write a sanitized machine-readable readiness summary.",
    )
    parser.add_argument("--environment", default="local")
    parser.add_argument("--commit", default=None)
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Exit non-zero when smoke evidence or screenshots are incomplete.",
    )
    args = parser.parse_args()

    result = build_report(
        smoke_path=Path(args.smoke),
        screenshot_dir=Path(args.screenshots),
        manual_notes_path=Path(args.manual_notes),
        output_path=Path(args.output),
        environment=args.environment,
        git_commit=args.commit,
    )
    print(f"Role UX evidence pack written to {result['output_path']}")
    print(f"Missing screenshots: {len(result['missing_screenshots'])}")
    print_blockers(result)

    if args.summary_json:
        write_summary_json(
            summary_path=Path(args.summary_json),
            result=result,
            environment=args.environment,
        )
        print(f"Role UX summary JSON written to {args.summary_json}")

    if args.strict and (
        not result["smoke_clean"]
        or not result["screenshots_complete"]
        or not result["manual_clean"]
    ):
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
