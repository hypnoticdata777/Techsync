"""Pydantic schemas for work orders (RF-09, RF-12, RF-18, RF-19, RF-20, RF-21)."""

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator

Priority = Literal["low", "medium", "high", "emergency"]
Status = Literal["open", "in_progress", "completed", "cancelled"]
Source = Literal["manual", "csv", "webhook", "email", "pdf"]
ClientApprovalStatus = Literal["not_required", "pending", "approved", "declined"]
ClientApprovalDecision = Literal["approved", "declined"]

# Only these transitions are legal (RF-18 acceptance criterion).
ALLOWED_STATUS_TRANSITIONS: dict[Status, set[Status]] = {
    "open": {"in_progress", "cancelled"},
    "in_progress": {"completed", "cancelled", "open"},
    "completed": set(),
    "cancelled": set(),
}


class WorkOrderCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    property_id: Optional[int] = None
    client_id: Optional[int] = None
    vendor_id: Optional[int] = None
    customer_name: Optional[str] = Field(None, max_length=150)
    address: Optional[str] = Field(None, max_length=300)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    service_type: str = Field(default="general", max_length=100)
    priority: Priority = "medium"
    sla_due_at: Optional[datetime] = None
    auto_assign: bool = True

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Title cannot be empty")
        return v.strip()


class WorkOrderUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    property_id: Optional[int] = None
    client_id: Optional[int] = None
    vendor_id: Optional[int] = None
    customer_name: Optional[str] = Field(None, max_length=150)
    address: Optional[str] = Field(None, max_length=300)
    priority: Optional[Priority] = None
    service_type: Optional[str] = Field(None, max_length=100)

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("Title cannot be empty")
        return v.strip() if v else None


class WorkOrderStatusUpdate(BaseModel):
    status: Status
    notes: Optional[str] = Field(None, max_length=1000)
    completion_override_reason: Optional[str] = Field(None, max_length=1000)

    @field_validator("completion_override_reason")
    @classmethod
    def validate_completion_override_reason(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("Completion override reason cannot be empty")
        return v.strip() if v else None


class WorkOrderAssign(BaseModel):
    technician_id: int
    notes: Optional[str] = Field(None, max_length=500)


class WorkOrderApprovalRequest(BaseModel):
    notes: Optional[str] = Field(None, max_length=1000)

    @field_validator("notes")
    @classmethod
    def validate_notes(cls, v: Optional[str]) -> Optional[str]:
        return v.strip() if v and v.strip() else None


class WorkOrderApprovalDecision(BaseModel):
    decision: ClientApprovalDecision
    notes: Optional[str] = Field(None, max_length=1000)

    @field_validator("notes")
    @classmethod
    def validate_decision_notes(cls, v: Optional[str]) -> Optional[str]:
        return v.strip() if v and v.strip() else None


class WorkOrder(BaseModel):
    id: int
    organization_id: int
    title: str
    description: Optional[str] = None
    property_id: Optional[int] = None
    client_id: Optional[int] = None
    vendor_id: Optional[int] = None
    customer_name: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    service_type: str
    priority: Priority
    status: Status
    assigned_technician_id: Optional[int] = None
    created_by: Optional[int] = None
    source: Source
    external_ref: Optional[str] = None
    sla_due_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    completion_notes: Optional[str] = None
    completion_proof_verified_at: Optional[datetime] = None
    completion_override_reason: Optional[str] = None
    client_approval_status: ClientApprovalStatus = "not_required"
    client_approval_requested_at: Optional[datetime] = None
    client_approval_requested_by: Optional[int] = None
    client_approval_decision_at: Optional[datetime] = None
    client_approval_decision_by: Optional[int] = None
    client_approval_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class WorkOrderEvent(BaseModel):
    id: int
    work_order_id: int
    event_type: str
    from_status: Optional[str] = None
    to_status: Optional[str] = None
    actor_user_id: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime


class WorkOrderAttachmentCreate(BaseModel):
    file_name: str = Field(..., min_length=1, max_length=255)
    file_url: str = Field(..., min_length=1, max_length=2000)
    content_type: Optional[str] = Field(None, max_length=100)


class WorkOrderAttachment(BaseModel):
    id: int
    work_order_id: int
    file_name: str
    file_url: str
    content_type: Optional[str] = None
    uploaded_by: Optional[int] = None
    created_at: datetime
