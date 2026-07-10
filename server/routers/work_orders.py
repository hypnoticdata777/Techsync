"""Work order CRUD, status transitions, assignment, audit log, attachments,
and search/filter (RF-14, RF-15, RF-18, RF-19, RF-20, RF-21, RF-22, RF-24)."""

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status

from dependencies import get_current_organization, get_current_user, require_roles
from models.user import User
from models.work_order import (
    WorkOrder,
    WorkOrderAssign,
    WorkOrderAttachment,
    WorkOrderAttachmentCreate,
    WorkOrderCreate,
    WorkOrderEvent,
    WorkOrderStatusUpdate,
    WorkOrderUpdate,
)
from repositories import attachments as attachments_repo
from repositories import technicians as technicians_repo
from repositories import work_order_events as events_repo
from repositories import work_orders as work_orders_repo
from services import attachment_storage_service, work_order_service

router = APIRouter(prefix="/work-orders", tags=["work-orders"])


def _load_caller_technician(current_user: User, organization_id: int) -> Optional[dict]:
    if current_user.role != "technician":
        return None
    return technicians_repo.get_by_user_id(current_user.id, organization_id)


def _get_accessible_work_order(work_order_id: int, current_user: User, organization: dict) -> dict:
    work_order = work_orders_repo.get_by_id_in_org(work_order_id, organization["id"])
    if not work_order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Work order not found")

    if current_user.role == "technician":
        technician = _load_caller_technician(current_user, organization["id"])
        if not technician or work_order.get("assigned_technician_id") != technician["id"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not assigned to you")

    return work_order


@router.post("", response_model=WorkOrder, status_code=status.HTTP_201_CREATED)
def create_work_order(
    payload: WorkOrderCreate,
    current_user: User = Depends(require_roles("org_admin", "coordinator")),
    organization: dict = Depends(get_current_organization),
):
    priority = work_order_service.apply_priority_rule(
        organization["id"], payload.service_type, payload.priority
    )
    work_order = work_orders_repo.create(
        organization["id"],
        {
            "title": payload.title,
            "description": payload.description,
            "customer_name": payload.customer_name,
            "address": payload.address,
            "latitude": payload.latitude,
            "longitude": payload.longitude,
            "service_type": payload.service_type,
            "priority": priority,
            "status": "open",
            "created_by": current_user.id,
            "source": "manual",
            "sla_due_at": payload.sla_due_at.isoformat() if payload.sla_due_at else None,
        },
    )
    events_repo.create_event(
        organization["id"], work_order["id"], event_type="created", actor_user_id=current_user.id
    )

    if payload.auto_assign:
        work_order = work_order_service.auto_assign(organization["id"], work_order)

    return WorkOrder(**work_order)


@router.get("", response_model=list[WorkOrder])
def list_work_orders(
    status_filter: Optional[str] = Query(None, alias="status"),
    technician_id: Optional[int] = None,
    customer_name: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    organization: dict = Depends(get_current_organization),
):
    """RF-21: combined filter by status, technician, customer, and date range.
    Technicians are always scoped to their own assignments regardless of the
    technician_id filter passed in."""
    if current_user.role == "technician":
        technician = _load_caller_technician(current_user, organization["id"])
        technician_id = technician["id"] if technician else -1

    rows = work_orders_repo.list_filtered(
        organization["id"],
        status=status_filter,
        technician_id=technician_id,
        customer_name=customer_name,
        date_from=date_from,
        date_to=date_to,
    )
    return [WorkOrder(**row) for row in rows]


@router.get("/mine", response_model=list[WorkOrder])
def list_my_work_orders(
    current_user: User = Depends(require_roles("technician")),
    organization: dict = Depends(get_current_organization),
):
    """RF-22: technician's assigned work orders, ordered by priority."""
    technician = _load_caller_technician(current_user, organization["id"])
    if not technician:
        return []
    rows = work_orders_repo.list_for_technician(organization["id"], technician["id"])
    return [WorkOrder(**row) for row in rows]


@router.get("/{work_order_id}", response_model=WorkOrder)
def get_work_order(
    work_order_id: int,
    current_user: User = Depends(get_current_user),
    organization: dict = Depends(get_current_organization),
):
    return WorkOrder(**_get_accessible_work_order(work_order_id, current_user, organization))


@router.patch("/{work_order_id}", response_model=WorkOrder)
def update_work_order(
    work_order_id: int,
    payload: WorkOrderUpdate,
    current_user: User = Depends(require_roles("org_admin", "coordinator")),
    organization: dict = Depends(get_current_organization),
):
    existing = work_orders_repo.get_by_id_in_org(work_order_id, organization["id"])
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Work order not found")

    patch = {k: v for k, v in payload.dict().items() if v is not None}
    if not patch:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")

    updated = work_orders_repo.update(work_order_id, organization["id"], patch)
    return WorkOrder(**updated)


@router.patch("/{work_order_id}/status", response_model=WorkOrder)
def update_status(
    work_order_id: int,
    payload: WorkOrderStatusUpdate,
    current_user: User = Depends(get_current_user),
    organization: dict = Depends(get_current_organization),
):
    """RF-18/RF-24: transition status. Technicians may only update their own
    assigned work orders; coordinators/admins may update any."""
    _get_accessible_work_order(work_order_id, current_user, organization)

    try:
        updated = work_order_service.transition_status(
            organization["id"], work_order_id, payload.status, current_user.id, payload.notes
        )
    except LookupError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Work order not found")
    except work_order_service.InvalidStatusTransition as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot transition from '{exc.from_status}' to '{exc.to_status}'",
        )

    return WorkOrder(**updated)


@router.post("/{work_order_id}/assign", response_model=WorkOrder)
def assign_work_order(
    work_order_id: int,
    payload: WorkOrderAssign,
    current_user: User = Depends(require_roles("org_admin", "coordinator")),
    organization: dict = Depends(get_current_organization),
):
    """RF-15: manual reassignment by a coordinator/admin."""
    try:
        updated = work_order_service.reassign(
            organization["id"], work_order_id, payload.technician_id, current_user.id, payload.notes
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Work order not found")

    return WorkOrder(**updated)


@router.get("/{work_order_id}/events", response_model=list[WorkOrderEvent])
def list_events(
    work_order_id: int,
    current_user: User = Depends(get_current_user),
    organization: dict = Depends(get_current_organization),
):
    """RF-20: audit log for a work order."""
    _get_accessible_work_order(work_order_id, current_user, organization)
    rows = events_repo.list_for_work_order(organization["id"], work_order_id)
    return [WorkOrderEvent(**row) for row in rows]


@router.post(
    "/{work_order_id}/attachments", response_model=WorkOrderAttachment, status_code=status.HTTP_201_CREATED
)
def add_attachment(
    work_order_id: int,
    payload: WorkOrderAttachmentCreate,
    current_user: User = Depends(get_current_user),
    organization: dict = Depends(get_current_organization),
):
    """RF-19: attach evidence (photo/document) metadata to a work order. The
    file itself is expected to already be uploaded to object storage
    (e.g. Supabase Storage) by the client; this endpoint records the resulting
    URL against the work order."""
    _get_accessible_work_order(work_order_id, current_user, organization)
    row = attachments_repo.create(organization["id"], work_order_id, current_user.id, payload.dict())
    events_repo.create_event(
        organization["id"],
        work_order_id,
        event_type="attachment_added",
        actor_user_id=current_user.id,
        notes=payload.file_name,
    )
    return WorkOrderAttachment(**row)


@router.post(
    "/{work_order_id}/attachments/upload",
    response_model=WorkOrderAttachment,
    status_code=status.HTTP_201_CREATED,
)
async def upload_attachment(
    work_order_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    organization: dict = Depends(get_current_organization),
):
    """RF-19: upload evidence to Supabase Storage and record attachment metadata."""
    _get_accessible_work_order(work_order_id, current_user, organization)
    uploaded = await attachment_storage_service.upload_work_order_attachment_file(
        organization["id"], work_order_id, file
    )
    row = attachments_repo.create(organization["id"], work_order_id, current_user.id, uploaded)
    events_repo.create_event(
        organization["id"],
        work_order_id,
        event_type="attachment_added",
        actor_user_id=current_user.id,
        notes=uploaded["file_name"],
    )
    return WorkOrderAttachment(**row)


@router.get("/{work_order_id}/attachments", response_model=list[WorkOrderAttachment])
def list_attachments(
    work_order_id: int,
    current_user: User = Depends(get_current_user),
    organization: dict = Depends(get_current_organization),
):
    _get_accessible_work_order(work_order_id, current_user, organization)
    rows = attachments_repo.list_for_work_order(organization["id"], work_order_id)
    return [WorkOrderAttachment(**row) for row in rows]
