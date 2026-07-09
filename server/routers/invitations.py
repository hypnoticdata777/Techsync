"""Invite users into an organization (RF-07)."""

from fastapi import APIRouter, Depends, HTTPException, status

from core.rate_limit import INVITATION_ACCEPT_RATE_LIMIT, rate_limit_dependency
from core.security import generate_opaque_token, get_password_hash, hash_opaque_token
from dependencies import get_current_organization, require_roles
from logger import logger
from models.invitation import Invitation, InvitationAccept, InvitationCreate
from models.organization import Organization, OrganizationOnboardResponse
from models.user import User
from repositories import invitations as invitations_repo
from repositories import organizations as organizations_repo
from repositories import users as users_repo
from services import auth_service, email_service

router = APIRouter(tags=["invitations"])


@router.post(
    "/organizations/invitations", response_model=Invitation, status_code=status.HTTP_201_CREATED
)
def invite_user(
    payload: InvitationCreate,
    current_user: User = Depends(require_roles("org_admin", "coordinator")),
    organization: dict = Depends(get_current_organization),
):
    if users_repo.get_by_email(payload.email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    raw_token = generate_opaque_token()
    invitation_row = invitations_repo.create_invitation(
        organization_id=organization["id"],
        email=payload.email,
        role=payload.role,
        token_hash=hash_opaque_token(raw_token),
        invited_by=current_user.id,
    )

    try:
        email_service.send_invitation_email(
            payload.email,
            raw_token,
            organization.get("name", "your organization"),
            payload.role,
        )
    except email_service.EmailDeliveryError:
        logger.exception(
            "invitation.email_failed",
            extra={
                "event": "invitation_email_failed",
                "organization_id": organization["id"],
                "email": payload.email,
            },
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Invitation email could not be sent. Please try again later.",
        )

    logger.info(
        "invitation.email_sent",
        extra={
            "event": "invitation_email_sent",
            "organization_id": organization["id"],
            "email": payload.email,
        },
    )

    return Invitation(**invitation_row)


@router.get("/organizations/invitations", response_model=list[Invitation])
def list_invitations(
    current_user: User = Depends(require_roles("org_admin", "coordinator")),
    organization: dict = Depends(get_current_organization),
):
    return [Invitation(**row) for row in invitations_repo.list_by_org(organization["id"])]


@router.post(
    "/invitations/accept",
    response_model=OrganizationOnboardResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limit_dependency(INVITATION_ACCEPT_RATE_LIMIT))],
)
def accept_invitation(payload: InvitationAccept):
    invitation_row = invitations_repo.get_valid_by_token_hash(hash_opaque_token(payload.token))
    if not invitation_row:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired invitation")

    if users_repo.get_by_email(invitation_row["email"]):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user_row = users_repo.create_user(
        organization_id=invitation_row["organization_id"],
        email=invitation_row["email"],
        password_hash=get_password_hash(payload.password),
        full_name=payload.full_name,
        role=invitation_row["role"],
    )
    invitations_repo.mark_accepted(invitation_row["id"])

    organization = organizations_repo.get_by_id(invitation_row["organization_id"])
    tokens = auth_service.issue_tokens(user_row)

    return OrganizationOnboardResponse(
        organization=Organization(**organization),
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