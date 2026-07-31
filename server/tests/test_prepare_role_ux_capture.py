import importlib.util
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPT_PATH = REPO_ROOT / "scripts" / "prepare_role_ux_capture.py"
SPEC = importlib.util.spec_from_file_location("prepare_role_ux_capture", SCRIPT_PATH)
prepare_capture_module = importlib.util.module_from_spec(SPEC)
sys.path.insert(0, str(REPO_ROOT / "scripts"))
sys.modules[SPEC.name] = prepare_capture_module
SPEC.loader.exec_module(prepare_capture_module)


def test_prepare_capture_creates_folder_notes_and_manifest(tmp_path):
    screenshot_dir = tmp_path / "local-role-ux-evidence"
    manual_notes_path = tmp_path / "local-role-ux-manual-notes.json"
    template_path = tmp_path / "ROLE_UX_MANUAL_NOTES_TEMPLATE.json"
    manifest_path = tmp_path / "local-role-ux-capture-manifest.md"
    template_path.write_text('{"checks": []}', encoding="utf-8")

    result = prepare_capture_module.prepare_capture(
        screenshot_dir=screenshot_dir,
        manual_notes_path=manual_notes_path,
        template_path=template_path,
        manifest_path=manifest_path,
    )

    assert screenshot_dir.is_dir()
    assert manual_notes_path.read_text(encoding="utf-8") == '{"checks": []}'
    assert result.manual_notes_created is True
    assert result.present_count == 0
    assert result.expected_count == len(prepare_capture_module.EXPECTED_SCREENSHOTS)
    assert len(result.missing_screenshots) == result.expected_count

    body = manifest_path.read_text(encoding="utf-8")
    assert "TechSync Ops Local Role UX Capture Manifest" in body
    assert "Progress: 0/" in body
    assert "## Preflight" in body
    assert "Strict seed status" in body
    assert "## Viewport Gates" in body
    assert "390px mobile" in body
    assert "320px narrow" in body
    assert "--strict" in body


def test_capture_manifest_constants_keep_final_gate_order():
    assert [step[0] for step in prepare_capture_module.CAPTURE_PREFLIGHT_STEPS] == [
        "Strict seed status",
        "Role smoke evidence",
        "Capture prep",
        "Manual walkthrough",
        "Strict evidence pack",
        "Screenshot safety",
    ]
    assert [viewport[1] for viewport in prepare_capture_module.CAPTURE_VIEWPORTS] == [
        "390 x 844",
        "320 x 740",
        "1365 x 768 or wider",
    ]


def test_describe_missing_screenshots_names_role_and_screen():
    missing = [
        "techsync-ops-viewer-03-viewer-empty.png",
        "techsync-ops-vendor-03-vendor-empty.png",
    ]

    descriptions = prepare_capture_module.describe_missing_screenshots(missing)

    assert descriptions == [
        "viewer / WorkOrdersList: techsync-ops-viewer-03-viewer-empty.png",
        "vendor / WorkOrdersList: techsync-ops-vendor-03-vendor-empty.png",
    ]


def test_prepare_capture_keeps_existing_manual_notes_without_overwrite(tmp_path):
    screenshot_dir = tmp_path / "local-role-ux-evidence"
    manual_notes_path = tmp_path / "local-role-ux-manual-notes.json"
    template_path = tmp_path / "ROLE_UX_MANUAL_NOTES_TEMPLATE.json"
    manifest_path = tmp_path / "local-role-ux-capture-manifest.md"
    template_path.write_text('{"checks": []}', encoding="utf-8")
    manual_notes_path.write_text('{"checks": [{"notes": "keep me"}]}', encoding="utf-8")

    result = prepare_capture_module.prepare_capture(
        screenshot_dir=screenshot_dir,
        manual_notes_path=manual_notes_path,
        template_path=template_path,
        manifest_path=manifest_path,
    )

    assert result.manual_notes_created is False
    assert manual_notes_path.read_text(encoding="utf-8") == '{"checks": [{"notes": "keep me"}]}'

    overwritten = prepare_capture_module.prepare_capture(
        screenshot_dir=screenshot_dir,
        manual_notes_path=manual_notes_path,
        template_path=template_path,
        manifest_path=manifest_path,
        overwrite_manual_notes=True,
    )

    assert overwritten.manual_notes_created is True
    assert manual_notes_path.read_text(encoding="utf-8") == '{"checks": []}'
