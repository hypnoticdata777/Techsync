import importlib.util
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPT_PATH = REPO_ROOT / "scripts" / "seed_demo_data.py"
SPEC = importlib.util.spec_from_file_location("seed_demo_data", SCRIPT_PATH)
seed_demo_data = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = seed_demo_data
SPEC.loader.exec_module(seed_demo_data)


def _ready_status():
    return {
        "exists": True,
        "counts": dict(seed_demo_data.EXPECTED_COUNTS),
        "expected_users": {email: True for email in seed_demo_data.EXPECTED_LOGIN_EMAILS},
        "scenario_checks": {key: True for key in seed_demo_data.EXPECTED_SCENARIO_LABELS},
    }


def test_evaluate_demo_readiness_passes_for_expected_capture_seed():
    readiness = seed_demo_data.evaluate_demo_readiness(_ready_status())

    assert readiness == {"ready": True, "failures": []}


def test_evaluate_demo_readiness_reports_stale_empty_state_seed():
    status = _ready_status()
    status["counts"]["users"] = 8
    status["expected_users"]["quiet-owner.demo@demo.techsyncops.dev"] = False
    status["scenario_checks"]["quiet_viewer_empty"] = False

    readiness = seed_demo_data.evaluate_demo_readiness(status)

    assert readiness["ready"] is False
    assert "users count is 8; expected 10." in readiness["failures"]
    assert "Missing synthetic login user: quiet-owner.demo@demo.techsyncops.dev." in readiness["failures"]
    assert "Missing scenario: quiet viewer account has no linked work." in readiness["failures"]


def test_evaluate_demo_readiness_reports_unseeded_database():
    readiness = seed_demo_data.evaluate_demo_readiness({"exists": False})

    assert readiness == {
        "ready": False,
        "failures": ["Demo organization is not seeded."],
    }
