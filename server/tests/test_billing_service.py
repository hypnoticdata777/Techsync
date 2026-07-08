import pytest

from services.billing_service import PlanLimitExceeded, enforce_technician_limit


def test_enforce_technician_limit_allows_under_limit():
    org = {"technician_limit": 3}
    enforce_technician_limit(org, current_technician_count=2)  # should not raise


def test_enforce_technician_limit_blocks_at_limit():
    org = {"technician_limit": 3}
    with pytest.raises(PlanLimitExceeded):
        enforce_technician_limit(org, current_technician_count=3)


def test_enforce_technician_limit_ignored_when_no_limit_set():
    org = {"technician_limit": None}
    enforce_technician_limit(org, current_technician_count=1000)  # unlimited plan, no raise
