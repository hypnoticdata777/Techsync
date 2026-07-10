import sys
from types import SimpleNamespace

import pytest

from services import billing_service
from services.billing_service import (
    PlanLimitExceeded,
    StripeWebhookNotConfigured,
    StripeWebhookVerificationError,
    construct_stripe_event,
    enforce_technician_limit,
    handle_stripe_event,
    mark_subscription_active,
)


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


def test_mark_subscription_active_stores_customer_and_subscription(monkeypatch):
    calls = []

    def fake_update_billing(organization_id, patch):
        calls.append((organization_id, patch))
        return {"id": organization_id, **patch}

    monkeypatch.setattr(billing_service.organizations_repo, "update_billing", fake_update_billing)

    updated = mark_subscription_active(42, "cus_123", "sub_123")

    assert updated["subscription_status"] == "active"
    assert calls == [
        (
            42,
            {
                "plan": "pro",
                "subscription_status": "active",
                "technician_limit": 9999,
                "stripe_customer_id": "cus_123",
                "stripe_subscription_id": "sub_123",
            },
        )
    ]


def test_handle_checkout_completed_activates_subscription(monkeypatch):
    calls = []

    def fake_mark_subscription_active(organization_id, stripe_customer_id=None, stripe_subscription_id=None):
        calls.append((organization_id, stripe_customer_id, stripe_subscription_id))
        return {"id": organization_id}

    monkeypatch.setattr(billing_service, "mark_subscription_active", fake_mark_subscription_active)

    result = handle_stripe_event(
        {
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "client_reference_id": "42",
                    "customer": "cus_123",
                    "subscription": "sub_123",
                }
            },
        }
    )

    assert result == {"action": "subscription_activated", "organization_id": 42, "updated": True}
    assert calls == [(42, "cus_123", "sub_123")]


def test_handle_checkout_completed_ignores_missing_org_id(monkeypatch):
    monkeypatch.setattr(
        billing_service,
        "mark_subscription_active",
        lambda *args, **kwargs: pytest.fail("should not update billing"),
    )

    result = handle_stripe_event({"type": "checkout.session.completed", "data": {"object": {}}})

    assert result == {"action": "ignored", "reason": "missing_organization_id"}


def test_handle_invoice_payment_failed_marks_past_due(monkeypatch):
    monkeypatch.setattr(
        billing_service.organizations_repo,
        "get_by_stripe_customer_id",
        lambda customer_id: {"id": 42} if customer_id == "cus_123" else None,
    )
    calls = []
    monkeypatch.setattr(
        billing_service.organizations_repo,
        "update_billing",
        lambda organization_id, patch: calls.append((organization_id, patch)) or {"id": organization_id},
    )

    result = handle_stripe_event(
        {"type": "invoice.payment_failed", "data": {"object": {"customer": "cus_123"}}}
    )

    assert result == {"action": "subscription_past_due", "stripe_customer_id": "cus_123", "updated": True}
    assert calls == [(42, {"subscription_status": "past_due"})]


def test_handle_subscription_deleted_marks_canceled_and_restores_default_limit(monkeypatch):
    monkeypatch.setattr(billing_service.settings, "DEFAULT_TECHNICIAN_LIMIT", 3)
    monkeypatch.setattr(
        billing_service.organizations_repo,
        "get_by_stripe_customer_id",
        lambda customer_id: {"id": 42} if customer_id == "cus_123" else None,
    )
    calls = []
    monkeypatch.setattr(
        billing_service.organizations_repo,
        "update_billing",
        lambda organization_id, patch: calls.append((organization_id, patch)) or {"id": organization_id},
    )

    result = handle_stripe_event(
        {"type": "customer.subscription.deleted", "data": {"object": {"customer": "cus_123"}}}
    )

    assert result == {"action": "subscription_canceled", "stripe_customer_id": "cus_123", "updated": True}
    assert calls == [(42, {"subscription_status": "canceled", "plan": "free", "technician_limit": 3})]


def test_construct_stripe_event_requires_webhook_secret(monkeypatch):
    monkeypatch.setattr(billing_service.settings, "STRIPE_WEBHOOK_SECRET", None)

    with pytest.raises(StripeWebhookNotConfigured):
        construct_stripe_event(b"{}", "sig")


def test_construct_stripe_event_requires_signature(monkeypatch):
    monkeypatch.setattr(billing_service.settings, "STRIPE_WEBHOOK_SECRET", "whsec_test")

    with pytest.raises(StripeWebhookVerificationError):
        construct_stripe_event(b"{}", None)


def test_construct_stripe_event_delegates_to_stripe_sdk(monkeypatch):
    calls = []

    class FakeWebhook:
        @staticmethod
        def construct_event(payload, sig_header, secret):
            calls.append((payload, sig_header, secret))
            return {"type": "ignored.event", "data": {"object": {}}}

    monkeypatch.setattr(billing_service.settings, "STRIPE_WEBHOOK_SECRET", "whsec_test")
    monkeypatch.setitem(sys.modules, "stripe", SimpleNamespace(Webhook=FakeWebhook))

    event = construct_stripe_event(b"{}", "sig_test")

    assert event["type"] == "ignored.event"
    assert calls == [(b"{}", "sig_test", "whsec_test")]
