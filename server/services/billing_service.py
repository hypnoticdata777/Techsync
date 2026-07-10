"""
Subscription / billing service (RF-27, RF-28, RF-29).

Stripe is optional: if STRIPE_SECRET_KEY is not configured the checkout
endpoint returns a mock checkout URL so the upgrade flow is still
demoable end-to-end without a real Stripe test account (per the spec's
scope note: "Stripe puede quedar en modo test/mock").
"""

from typing import Any, Optional

from core.config import settings
from models.billing import CheckoutSessionResponse
from repositories import organizations as organizations_repo


class PlanLimitExceeded(Exception):
    def __init__(self, limit: int):
        self.limit = limit
        super().__init__(f"Technician limit of {limit} reached for this plan")


class StripeWebhookNotConfigured(Exception):
    pass


class StripeWebhookVerificationError(Exception):
    pass


def enforce_technician_limit(organization: dict, current_technician_count: int) -> None:
    """RF-29: block adding technicians beyond the org's plan limit."""
    limit = organization.get("technician_limit")
    if limit is not None and current_technician_count >= limit:
        raise PlanLimitExceeded(limit)


def create_checkout_session(organization: dict) -> CheckoutSessionResponse:
    if settings.STRIPE_SECRET_KEY and settings.STRIPE_PRICE_ID:
        try:
            import stripe  # type: ignore

            stripe.api_key = settings.STRIPE_SECRET_KEY
            session = stripe.checkout.Session.create(
                mode="subscription",
                line_items=[{"price": settings.STRIPE_PRICE_ID, "quantity": 1}],
                success_url=settings.STRIPE_SUCCESS_URL,
                cancel_url=settings.STRIPE_CANCEL_URL,
                client_reference_id=str(organization["id"]),
                customer_email=None,
            )
            return CheckoutSessionResponse(checkout_url=session.url, mode="stripe_test")
        except ImportError:
            pass

    # Mock mode: no Stripe configured, return a deterministic fake checkout URL.
    if not settings.STRIPE_SUCCESS_URL:
        raise RuntimeError("STRIPE_SUCCESS_URL is required for mock checkout mode")
    mock_url = f"{settings.STRIPE_SUCCESS_URL}?mock=true&organization_id={organization['id']}"
    return CheckoutSessionResponse(checkout_url=mock_url, mode="mock")


def construct_stripe_event(payload: bytes, signature: str | None) -> Any:
    if not settings.STRIPE_WEBHOOK_SECRET:
        raise StripeWebhookNotConfigured("STRIPE_WEBHOOK_SECRET is not configured")
    if not signature:
        raise StripeWebhookVerificationError("Missing Stripe-Signature header")

    try:
        import stripe  # type: ignore
    except ImportError as exc:
        raise StripeWebhookNotConfigured("stripe package is not installed") from exc

    try:
        return stripe.Webhook.construct_event(
            payload=payload,
            sig_header=signature,
            secret=settings.STRIPE_WEBHOOK_SECRET,
        )
    except Exception as exc:
        raise StripeWebhookVerificationError("Invalid Stripe webhook signature") from exc


def _event_data_object(event: Any) -> dict:
    if isinstance(event, dict):
        data = event.get("data") or {}
        return dict(data.get("object") or {})

    data = getattr(event, "data", None)
    obj = getattr(data, "object", None) if data is not None else None
    if isinstance(obj, dict):
        return dict(obj)
    return dict(obj or {})


def _event_type(event: Any) -> str:
    if isinstance(event, dict):
        return str(event.get("type") or "")
    return str(getattr(event, "type", ""))


def _stripe_id(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, str):
        return value
    return str(getattr(value, "id", value))


def _organization_id_from_checkout(session: dict) -> int | None:
    raw_id = session.get("client_reference_id")
    if not raw_id:
        metadata = session.get("metadata") or {}
        raw_id = metadata.get("organization_id")
    if not raw_id:
        return None
    try:
        return int(raw_id)
    except (TypeError, ValueError):
        return None


def mark_subscription_active(
    organization_id: int,
    stripe_customer_id: Optional[str] = None,
    stripe_subscription_id: Optional[str] = None,
) -> dict:
    patch = {"plan": "pro", "subscription_status": "active", "technician_limit": 9999}
    if stripe_customer_id:
        patch["stripe_customer_id"] = stripe_customer_id
    if stripe_subscription_id:
        patch["stripe_subscription_id"] = stripe_subscription_id
    return organizations_repo.update_billing(organization_id, patch)


def mark_subscription_status_by_customer(stripe_customer_id: str, status: str) -> dict | None:
    organization = organizations_repo.get_by_stripe_customer_id(stripe_customer_id)
    if not organization:
        return None

    patch = {"subscription_status": status}
    if status == "canceled":
        patch.update({"plan": "free", "technician_limit": settings.DEFAULT_TECHNICIAN_LIMIT})
    return organizations_repo.update_billing(organization["id"], patch)


def handle_stripe_event(event: Any) -> dict:
    event_type = _event_type(event)
    obj = _event_data_object(event)

    if event_type == "checkout.session.completed":
        organization_id = _organization_id_from_checkout(obj)
        if organization_id is None:
            return {"action": "ignored", "reason": "missing_organization_id"}

        updated = mark_subscription_active(
            organization_id=organization_id,
            stripe_customer_id=_stripe_id(obj.get("customer")),
            stripe_subscription_id=_stripe_id(obj.get("subscription")),
        )
        return {"action": "subscription_activated", "organization_id": organization_id, "updated": bool(updated)}

    if event_type == "invoice.payment_failed":
        stripe_customer_id = _stripe_id(obj.get("customer"))
        if not stripe_customer_id:
            return {"action": "ignored", "reason": "missing_customer"}
        updated = mark_subscription_status_by_customer(stripe_customer_id, "past_due")
        return {"action": "subscription_past_due", "stripe_customer_id": stripe_customer_id, "updated": bool(updated)}

    if event_type == "customer.subscription.deleted":
        stripe_customer_id = _stripe_id(obj.get("customer"))
        if not stripe_customer_id:
            return {"action": "ignored", "reason": "missing_customer"}
        updated = mark_subscription_status_by_customer(stripe_customer_id, "canceled")
        return {"action": "subscription_canceled", "stripe_customer_id": stripe_customer_id, "updated": bool(updated)}

    return {"action": "ignored", "event_type": event_type}
