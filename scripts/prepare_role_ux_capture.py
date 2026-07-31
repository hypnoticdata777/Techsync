"""Prepare local-only TechSync Ops role UX capture artifacts.

This helper creates the local screenshot folder, copies the manual notes
template when needed, and writes a capture manifest showing which expected
screenshots are still missing.
"""

from __future__ import annotations

import argparse
import shutil
from dataclasses import dataclass
from pathlib import Path

from build_role_ux_evidence_pack import (
    DEFAULT_MANUAL_NOTES_PATH,
    DEFAULT_SCREENSHOT_DIR,
    EXPECTED_SCREENSHOTS,
    inventory_screenshots,
)


DEFAULT_TEMPLATE_PATH = "ROLE_UX_MANUAL_NOTES_TEMPLATE.json"
DEFAULT_CAPTURE_MANIFEST_PATH = "local-role-ux-capture-manifest.md"

CAPTURE_PREFLIGHT_STEPS = [
    (
        "Strict seed status",
        "Run `python scripts\\seed_demo_data.py status --strict` against the local/demo database.",
    ),
    (
        "Role smoke evidence",
        "Run `scripts\\smoke_role_ux.py` against the local API and review sanitized role/API evidence.",
    ),
    (
        "Capture prep",
        "Generate this manifest, the ignored screenshot folder, and the manual notes copy.",
    ),
    (
        "Manual walkthrough",
        "Walk every synthetic role and capture each missing screenshot filename below.",
    ),
    (
        "Strict evidence pack",
        "Build `role-ux-evidence-pack.md` with `--strict` and resolve every blocker.",
    ),
    (
        "Screenshot safety",
        "Review all images for terminals, secrets, provider pages, real data, URLs, and passwords.",
    ),
]

CAPTURE_VIEWPORTS = [
    (
        "390px mobile",
        "390 x 844",
        "Primary queues, cards, and action rows remain readable without clipped labels.",
    ),
    (
        "320px narrow",
        "320 x 740",
        "Compact controls wrap cleanly and evidence rows do not overlap.",
    ),
    (
        "Desktop review",
        "1365 x 768 or wider",
        "Images are free of terminals, provider dashboards, secrets, and browser devtools.",
    ),
]


@dataclass(frozen=True)
class CapturePrepResult:
    screenshot_dir: Path
    manual_notes_path: Path
    manifest_path: Path
    manual_notes_created: bool
    missing_screenshots: list[str]
    present_count: int
    expected_count: int


def _role_steps() -> dict[str, list[tuple[str, str]]]:
    steps: dict[str, list[tuple[str, str]]] = {}
    for role, screen, filename in EXPECTED_SCREENSHOTS:
        steps.setdefault(role, []).append((screen, filename))
    return steps


def _write_manifest(
    *,
    manifest_path: Path,
    screenshot_dir: Path,
    manual_notes_path: Path,
    missing_screenshots: list[str],
    present_count: int,
    expected_count: int,
) -> None:
    missing_set = set(missing_screenshots)
    lines = [
        "# TechSync Ops Local Role UX Capture Manifest",
        "",
        "This file is generated for local screenshot capture only. Do not commit it.",
        "",
        f"Screenshot folder: `{screenshot_dir}`",
        f"Manual notes file: `{manual_notes_path}`",
        f"Progress: {present_count}/{expected_count} screenshots present",
        f"Missing: {len(missing_screenshots)}",
        "",
        "## Preflight",
        "",
    ]

    for index, (label, detail) in enumerate(CAPTURE_PREFLIGHT_STEPS, start=1):
        lines.append(f"{index}. [ ] {label}: {detail}")

    lines.extend(
        [
            "",
            "## Viewport Gates",
            "",
        ]
    )

    for label, size, detail in CAPTURE_VIEWPORTS:
        lines.append(f"- [ ] {label} (`{size}`): {detail}")

    lines.extend(
        [
            "",
            "## Capture Order",
            "",
        ]
    )

    for role, steps in _role_steps().items():
        lines.extend([f"### {role}", ""])
        for screen, filename in steps:
            mark = "x" if filename not in missing_set else " "
            lines.append(f"- [{mark}] `{filename}` - {screen}")
        lines.append("")

    lines.extend(
        [
            "## Final Local Gate",
            "",
            "- [ ] All 21 screenshots are present in the screenshot folder.",
            "- [ ] `local-role-ux-manual-notes.json` has `passed: true` plus notes for every check, role, and viewport.",
            "- [ ] Evidence pack is rebuilt with `--strict` and exits cleanly.",
            "- [ ] Screenshot safety review confirms no terminals, secrets, provider dashboards, or real data.",
            "",
            "Strict evidence-pack command:",
            "",
            "```powershell",
            "server\\venv\\Scripts\\python.exe scripts\\build_role_ux_evidence_pack.py --smoke role-ux-smoke-evidence.json --screenshots local-role-ux-evidence --manual-notes local-role-ux-manual-notes.json --output role-ux-evidence-pack.md --environment local --strict",
            "```",
            "",
        ]
    )
    manifest_path.write_text("\n".join(lines), encoding="utf-8")


def prepare_capture(
    *,
    screenshot_dir: Path,
    manual_notes_path: Path,
    template_path: Path,
    manifest_path: Path,
    overwrite_manual_notes: bool = False,
) -> CapturePrepResult:
    screenshot_dir.mkdir(parents=True, exist_ok=True)

    manual_notes_created = False
    if overwrite_manual_notes or not manual_notes_path.exists():
        shutil.copyfile(template_path, manual_notes_path)
        manual_notes_created = True

    inventory = inventory_screenshots(screenshot_dir)
    _write_manifest(
        manifest_path=manifest_path,
        screenshot_dir=screenshot_dir,
        manual_notes_path=manual_notes_path,
        missing_screenshots=inventory.missing,
        present_count=len(inventory.present),
        expected_count=inventory.expected_count,
    )

    return CapturePrepResult(
        screenshot_dir=screenshot_dir,
        manual_notes_path=manual_notes_path,
        manifest_path=manifest_path,
        manual_notes_created=manual_notes_created,
        missing_screenshots=inventory.missing,
        present_count=len(inventory.present),
        expected_count=inventory.expected_count,
    )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Prepare local TechSync Ops role UX capture files.")
    parser.add_argument("--screenshots", default=DEFAULT_SCREENSHOT_DIR)
    parser.add_argument("--manual-notes", default=DEFAULT_MANUAL_NOTES_PATH)
    parser.add_argument("--template", default=DEFAULT_TEMPLATE_PATH)
    parser.add_argument("--manifest", default=DEFAULT_CAPTURE_MANIFEST_PATH)
    parser.add_argument(
        "--overwrite-manual-notes",
        action="store_true",
        help="Replace the local manual notes file from the template.",
    )
    args = parser.parse_args(argv)

    result = prepare_capture(
        screenshot_dir=Path(args.screenshots),
        manual_notes_path=Path(args.manual_notes),
        template_path=Path(args.template),
        manifest_path=Path(args.manifest),
        overwrite_manual_notes=args.overwrite_manual_notes,
    )

    print(f"Screenshot folder ready: {result.screenshot_dir}")
    print(f"Manual notes ready: {result.manual_notes_path}")
    print(f"Capture manifest written: {result.manifest_path}")
    print(f"Screenshots present: {result.present_count}/{result.expected_count}")
    print(f"Missing screenshots: {len(result.missing_screenshots)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
