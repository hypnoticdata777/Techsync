"""
Subscription / billing service (RF-27, RF-28, RF-29).

Stripe is optional: if STRIPE_SECRET_KEY is not configured the checkout
endpoint returns a mock checkout URL so the upgrade flow is still
demoable end-to-end without a real Stripe test account (per the spec's
scope note: "Stripe puede quedar en modo test/mock").
"""

from typing import Optional

from core.config import settings
from models.billing import CheckoutSessionResponse
from repositories import organizations as organizations_repo


class PlanLimitExceeded(Exception):
    def __init__(self, limit: int):
        self.limit = limit
        super().__init__(f"Technician limit of {limit} reached for this plan")


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
    mock_url = f"{settings.STRIPE_SUCCESS_URL}?mock=true&organization_id={organization['id']}"
    return CheckoutSessionResponse(checkout_url=mock_url, mode="mock")


def mark_subscription_active(organization_id: int, stripe_customer_id: Optional[str] = None) -> dict:
    patch = {"plan": "pro", "subscription_status": "active", "technician_limit": 9999}
    if stripe_customer_id:
        patch["stripe_customer_id"] = stripe_customer_id
    return organizations_repo.update_billing(organization_id, patch)
