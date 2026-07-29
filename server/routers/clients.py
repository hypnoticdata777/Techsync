"""Client management for PMC operations."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import PlainTextResponse

from dependencies import get_current_organization, require_roles
from models.client import Client, ClientCreate, ClientUpdate
from models.user import User
from repositories import clients as clients_repo
from services import entity_export_service

router = APIRouter(prefix="/clients", tags=["clients"])


@router.post("", response_model=Client, status_code=status.HTTP_201_CREATED)
def create_client(
    payload: ClientCreate,
    current_user: User = Depends(require_roles("org_admin", "coordinator")),
    organization: dict = Depends(get_current_organization),
):
    row = clients_repo.create(organization["id"], payload.dict())
    return Client(**row)


@router.get("", response_model=list[Client])
def list_clients(
    active_only: bool = Query(False),
    current_user: User = Depends(require_roles("org_admin", "coordinator")),
    organization: dict = Depends(get_current_organization),
):
    rows = clients_repo.list_by_org(organization["id"], active_only=active_only)
    return [Client(**row) for row in rows]


@router.get("/export")
def export_clients(
    active_only: bool = Query(False),
    current_user: User = Depends(require_roles("org_admin", "coordinator")),
    organization: dict = Depends(get_current_organization),
):
    rows = clients_repo.list_by_org(organization["id"], active_only=active_only)
    return PlainTextResponse(
        entity_export_service.build_clients_csv(rows),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="techsync-clients.csv"'},
    )


@router.get("/{client_id}", response_model=Client)
def get_client(
    client_id: int,
    current_user: User = Depends(require_roles("org_admin", "coordinator")),
    organization: dict = Depends(get_current_organization),
):
    row = clients_repo.get_by_id_in_org(client_id, organization["id"])
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    return Client(**row)


@router.patch("/{client_id}", response_model=Client)
def update_client(
    client_id: int,
    payload: ClientUpdate,
    current_user: User = Depends(require_roles("org_admin", "coordinator")),
    organization: dict = Depends(get_current_organization),
):
    existing = clients_repo.get_by_id_in_org(client_id, organization["id"])
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")

    patch = payload.model_dump(exclude_unset=True)
    if not patch:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")

    updated = clients_repo.update(client_id, organization["id"], patch)
    return Client(**updated)
