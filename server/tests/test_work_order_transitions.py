import pytest

from models.work_order import ALLOWED_STATUS_TRANSITIONS


@pytest.mark.parametrize(
    "from_status,to_status",
    [
        ("open", "in_progress"),
        ("open", "cancelled"),
        ("in_progress", "completed"),
        ("in_progress", "cancelled"),
        ("in_progress", "open"),
    ],
)
def test_allowed_transitions(from_status, to_status):
    assert to_status in ALLOWED_STATUS_TRANSITIONS[from_status]


@pytest.mark.parametrize(
    "from_status,to_status",
    [
        ("open", "completed"),
        ("completed", "open"),
        ("completed", "in_progress"),
        ("cancelled", "open"),
        ("cancelled", "completed"),
    ],
)
def test_disallowed_transitions(from_status, to_status):
    assert to_status not in ALLOWED_STATUS_TRANSITIONS[from_status]


def test_completed_and_cancelled_are_terminal():
    assert ALLOWED_STATUS_TRANSITIONS["completed"] == set()
    assert ALLOWED_STATUS_TRANSITIONS["cancelled"] == set()
