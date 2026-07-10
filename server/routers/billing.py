"""Subscription / billing endpoints (RF-27, RF-28, RF-29)."""

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status

from dependencies import get_current_organization, require_roles
from logger import logger
from models.billing import CheckoutSessionResponse, PlanLimits
from models.user import User
from repositories import users as users_repo
from services import billing_service

router = APIRouter(prefix="/billing", tags=["billing"])


@router.post("/checkout", response_model=CheckoutSessionResponse)
def create_checkout_session(
    current_user: User = Depends(require_roles("org_admin")),
    organization: dict = Depends(get_current_organization),
):
    """RF-28: upgrade to a paid plan via Stripe Checkout (test mode) or a mock
    checkout URL when Stripe isn't configured."""
    return billing_service.create_checkout_session(organization)


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str | None = Header(default=None, alias="Stripe-Signature"),
):
    payload = await request.body()
    try:
        event = billing_service.construct_stripe_event(payload, stripe_signature)
        result = billing_service.handle_stripe_event(event)
    except billing_service.StripeWebhookNotConfigured as exc:
        logger.error("billing.webhook_not_configured", extra={"event": "billing_webhook_not_configured"})
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))
    except billing_service.StripeWebhookVerificationError as exc:
        logger.warning("billing.webhook_invalid_signature", extra={"event": "billing_webhook_invalid_signature"})
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    logger.info(
        "billing.webhook_processed",
        extra={"event": "billing_webhook_processed", "action": result.get("action")},
    )
    return {"received": True, **result}


@router.get("/plan-limits", response_model=PlanLimits)
def get_plan_limits(
    current_user: User = Depends(require_roles("org_admin", "coordinator")),
    organization: dict = Depends(get_current_organization),
):
    """RF-29: current plan usage vs. limit."""
    technicians_used = users_repo.count_by_org_and_role(organization["id"], "technician")
    return PlanLimits(
        plan=organization["plan"],
        technician_limit=organization["technician_limit"],
        technicians_used=technicians_used,
    )
