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


def _status_mark(passed: bool) -> str:
    return "PASS" if passed else "PENDING"


def build_report(
    *,
    smoke_path: Path,
    screenshot_dir: Path,
    output_path: Path,
    environment: str,
    git_commit: str | None,
) -> dict[str, Any]:
    smoke = summarize_smoke(smoke_path)
    screenshots = inventory_screenshots(screenshot_dir)
    generated_at = datetime.now(timezone.utc).isoformat()

    lines = [
        "# TechSync Ops Role UX Evidence Pack",
        "",
        f"Generated: {generated_at}",
        f"Environment: {environment}",
        f"Git commit: {git_commit or 'not recorded'}",
        f"Smoke evidence: `{smoke_path}`",
        f"Screenshot directory: `{screenshot_dir}`",
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

    lines.extend(["", "## Manual Evidence Checks", ""])
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
    lines.append("- Complete the manual screen-reader and screenshot safety checklist.")

    output_path.write_text("\n".join(lines) + "\n", encoding="utf-8")

    return {
        "smoke_clean": smoke.clean,
        "screenshots_complete": screenshots.complete,
        "missing_screenshots": screenshots.missing,
        "output_path": str(output_path),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Build the TechSync Ops role UX evidence pack.")
    parser.add_argument("--smoke", default=DEFAULT_SMOKE_PATH)
    parser.add_argument("--screenshots", default=DEFAULT_SCREENSHOT_DIR)
    parser.add_argument("--output", default=DEFAULT_OUTPUT_PATH)
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
        output_path=Path(args.output),
        environment=args.environment,
        git_commit=args.commit,
    )
    print(f"Role UX evidence pack written to {result['output_path']}")
    print(f"Missing screenshots: {len(result['missing_screenshots'])}")

    if args.strict and (not result["smoke_clean"] or not result["screenshots_complete"]):
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
