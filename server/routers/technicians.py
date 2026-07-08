"""Technician management (RF-26, RF-29)."""

from fastapi import APIRouter, Depends, HTTPException, status

from dependencies import get_current_organization, require_roles
from models.technician import Technician, TechnicianCreate, TechnicianUpdate
from models.user import User
from repositories import technicians as technicians_repo
from repositories import users as users_repo
from services import technician_service
from services.billing_service import PlanLimitExceeded

router = APIRouter(prefix="/technicians", tags=["technicians"])


@router.post("", response_model=Technician, status_code=status.HTTP_201_CREATED)
def create_technician(
    payload: TechnicianCreate,
    current_user: User = Depends(require_roles("org_admin", "coordinator")),
    organization: dict = Depends(get_current_organization),
):
    if users_repo.get_by_email(payload.email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    try:
        row = technician_service.create_technician(organization["id"], payload)
    except PlanLimitExceeded as exc:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Technician limit ({exc.limit}) reached for the current plan. Upgrade to add more.",
        )

    return Technician(**technician_service.to_technician_response_dict(row))


@router.get("", response_model=list[Technician])
def list_technicians(
    current_user: User = Depends(require_roles("org_admin", "coordinator")),
    organization: dict = Depends(get_current_organization),
):
    rows = technicians_repo.list_by_org(organization["id"])
    return [Technician(**technician_service.to_technician_response_dict(row)) for row in rows]


@router.patch("/{technician_id}", response_model=Technician)
def update_technician(
    technician_id: int,
    payload: TechnicianUpdate,
    current_user: User = Depends(require_roles("org_admin", "coordinator")),
    organization: dict = Depends(get_current_organization),
):
    existing = technicians_repo.get_by_id_in_org(technician_id, organization["id"])
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Technician not found")

    technician_patch = {
        k: v
        for k, v in payload.dict(exclude={"is_active"}).items()
        if v is not None
    }
    if technician_patch:
        technicians_repo.update(technician_id, organization["id"], technician_patch)

    if payload.is_active is not None:
        users_repo.update_role_and_status(
            existing["user_id"], organization["id"], {"is_active": payload.is_active}
        )

    updated = technicians_repo.get_by_id_in_org(technician_id, organization["id"])
    return Technician(**technician_service.to_technician_response_dict(updated))
