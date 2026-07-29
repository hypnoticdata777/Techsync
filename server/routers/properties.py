"""Managed property management for PMC operations."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import PlainTextResponse

from dependencies import get_current_organization, require_roles
from models.property import Property, PropertyCreate, PropertyUpdate
from models.user import User
from repositories import clients as clients_repo
from repositories import properties as properties_repo
from services import entity_export_service

router = APIRouter(prefix="/properties", tags=["properties"])


def _ensure_client_in_org(client_id: Optional[int], organization_id: int) -> None:
    if client_id is None:
        return
    if not clients_repo.get_by_id_in_org(client_id, organization_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Client not found")


@router.post("", response_model=Property, status_code=status.HTTP_201_CREATED)
def create_property(
    payload: PropertyCreate,
    current_user: User = Depends(require_roles("org_admin", "coordinator")),
    organization: dict = Depends(get_current_organization),
):
    _ensure_client_in_org(payload.client_id, organization["id"])
    row = properties_repo.create(organization["id"], payload.dict())
    return Property(**row)


@router.get("", response_model=list[Property])
def list_properties(
    client_id: Optional[int] = None,
    active_only: bool = Query(False),
    current_user: User = Depends(require_roles("org_admin", "coordinator")),
    organization: dict = Depends(get_current_organization),
):
    rows = properties_repo.list_by_org(
        organization["id"], client_id=client_id, active_only=active_only
    )
    return [Property(**row) for row in rows]


@router.get("/export")
def export_properties(
    client_id: Optional[int] = None,
    active_only: bool = Query(False),
    current_user: User = Depends(require_roles("org_admin", "coordinator")),
    organization: dict = Depends(get_current_organization),
):
    rows = properties_repo.list_by_org(
        organization["id"], client_id=client_id, active_only=active_only
    )
    return PlainTextResponse(
        entity_export_service.build_properties_csv(rows),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="techsync-properties.csv"'},
    )


@router.get("/{property_id}", response_model=Property)
def get_property(
    property_id: int,
    current_user: User = Depends(require_roles("org_admin", "coordinator")),
    organization: dict = Depends(get_current_organization),
):
    row = properties_repo.get_by_id_in_org(property_id, organization["id"])
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    return Property(**row)


@router.patch("/{property_id}", response_model=Property)
def update_property(
    property_id: int,
    payload: PropertyUpdate,
    current_user: User = Depends(require_roles("org_admin", "coordinator")),
    organization: dict = Depends(get_current_organization),
):
    existing = properties_repo.get_by_id_in_org(property_id, organization["id"])
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

    patch = payload.model_dump(exclude_unset=True)
    if not patch:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")

    _ensure_client_in_org(patch.get("client_id"), organization["id"])
    updated = properties_repo.update(property_id, organization["id"], patch)
    return Property(**updated)
