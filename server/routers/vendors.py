"""Vendor management for PMC operations."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import PlainTextResponse

from dependencies import get_current_organization, require_roles
from models.user import User
from models.vendor import Vendor, VendorCreate, VendorUpdate
from repositories import vendors as vendors_repo
from services import entity_export_service

router = APIRouter(prefix="/vendors", tags=["vendors"])


@router.post("", response_model=Vendor, status_code=status.HTTP_201_CREATED)
def create_vendor(
    payload: VendorCreate,
    current_user: User = Depends(require_roles("org_admin", "coordinator")),
    organization: dict = Depends(get_current_organization),
):
    row = vendors_repo.create(organization["id"], payload.model_dump())
    return Vendor(**row)


@router.get("", response_model=list[Vendor])
def list_vendors(
    active_only: bool = Query(False),
    current_user: User = Depends(require_roles("org_admin", "coordinator")),
    organization: dict = Depends(get_current_organization),
):
    rows = vendors_repo.list_by_org(organization["id"], active_only=active_only)
    return [Vendor(**row) for row in rows]


@router.get("/export")
def export_vendors(
    active_only: bool = Query(False),
    current_user: User = Depends(require_roles("org_admin", "coordinator")),
    organization: dict = Depends(get_current_organization),
):
    rows = vendors_repo.list_by_org(organization["id"], active_only=active_only)
    return PlainTextResponse(
        entity_export_service.build_vendors_csv(rows),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="techsync-vendors.csv"'},
    )


@router.get("/{vendor_id}", response_model=Vendor)
def get_vendor(
    vendor_id: int,
    current_user: User = Depends(require_roles("org_admin", "coordinator")),
    organization: dict = Depends(get_current_organization),
):
    row = vendors_repo.get_by_id_in_org(vendor_id, organization["id"])
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vendor not found")
    return Vendor(**row)


@router.patch("/{vendor_id}", response_model=Vendor)
def update_vendor(
    vendor_id: int,
    payload: VendorUpdate,
    current_user: User = Depends(require_roles("org_admin", "coordinator")),
    organization: dict = Depends(get_current_organization),
):
    existing = vendors_repo.get_by_id_in_org(vendor_id, organization["id"])
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vendor not found")

    patch = payload.model_dump(exclude_unset=True)
    if not patch:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")

    updated = vendors_repo.update(vendor_id, organization["id"], patch)
    return Vendor(**updated)
