"""Subscription / billing endpoints (RF-27, RF-28, RF-29)."""

from fastapi import APIRouter, Depends

from dependencies import get_current_organization, require_roles
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
