"""Organization onboarding, settings, and tenant lifecycle (RF-05, RF-06, RF-08, RNF-13)."""

from fastapi import APIRouter, Depends, HTTPException, status

from core.rate_limit import ONBOARD_RATE_LIMIT, rate_limit_dependency
from core.security import get_password_hash
from dependencies import get_current_organization, require_roles
from logger import logger
from models.organization import (
    Organization,
    OrganizationOnboard,
    OrganizationOnboardResponse,
    OrganizationSettingsUpdate,
)
from models.user import User
from repositories import organizations as organizations_repo
from repositories import users as users_repo
from services import auth_service

router = APIRouter(prefix="/organizations", tags=["organizations"])


@router.post(
    "/onboard",
    response_model=OrganizationOnboardResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limit_dependency(ONBOARD_RATE_LIMIT))],
)
def onboard(payload: OrganizationOnboard):
    """RF-06: self-service org creation -- company + first admin in a single call."""
    if users_repo.get_by_email(payload.admin_email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    org_row = organizations_repo.create_organization(
        name=payload.company_name, industry=payload.industry, org_timezone=payload.timezone
    )

    try:
        user_row = users_repo.create_user(
            organization_id=org_row["id"],
            email=payload.admin_email,
            password_hash=get_password_hash(payload.admin_password),
            full_name=payload.admin_full_name,
            role="org_admin",
        )
    except Exception:
        organizations_repo.hard_delete(org_row["id"])
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    tokens = auth_service.issue_tokens(user_row)
    logger.info(
        "organization.onboarded",
        extra={"event": "organization_onboarded", "organization_id": org_row["id"], "slug": org_row["slug"]},
    )

    return OrganizationOnboardResponse(
        organization=Organization(**org_row),
        user=User(
            id=user_row["id"],
            organization_id=user_row["organization_id"],
            email=user_row["email"],
            full_name=user_row["full_name"],
            role=user_row["role"],
            is_active=user_row["is_active"],
        ),
        tokens=tokens,
    )


@router.get("/me", response_model=Organization)
def get_my_organization(organization: dict = Depends(get_current_organization)):
    return Organization(**organization)


@router.patch("/me/settings", response_model=Organization)
def update_settings(
    payload: OrganizationSettingsUpdate,
    current_user: User = Depends(require_roles("org_admin")),
    organization: dict = Depends(get_current_organization),
):
    """RF-08: basic per-organization configuration."""
    if payload.timezone:
        organizations_repo.update_timezone(organization["id"], payload.timezone)

    settings_patch = {}
    if payload.service_types is not None:
        settings_patch["service_types"] = payload.service_types
    if payload.priorities is not None:
        settings_patch["priorities"] = payload.priorities
    if settings_patch:
        organizations_repo.update_settings(organization["id"], settings_patch)

    updated = organizations_repo.get_by_id(organization["id"])
    return Organization(**updated)


@router.post("/me/api-key/regenerate")
def regenerate_api_key(
    current_user: User = Depends(require_roles("org_admin")),
    organization: dict = Depends(get_current_organization),
):
    """RF-11: rotate the API key used to authenticate inbound webhook ingestion."""
    updated = organizations_repo.regenerate_api_key(organization["id"])
    return {"api_key": updated["api_key"]}


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_organization(
    current_user: User = Depends(require_roles("org_admin")),
    organization: dict = Depends(get_current_organization),
):
    """RNF-13: allow deletion of a tenant's data on request (soft delete)."""
    organizations_repo.soft_delete(organization["id"])
    logger.info(
        "organization.deleted",
        extra={"event": "organization_deleted", "organization_id": organization["id"]},
    )
