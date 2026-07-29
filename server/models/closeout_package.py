"""Pydantic schemas for work-order closeout package summaries (v1.3)."""

from typing import Literal

from pydantic import BaseModel

from models.work_order import WorkOrder, WorkOrderAttachment, WorkOrderEvent
from models.work_order_message import WorkOrderMessage

ProofStatus = Literal["verified", "override", "missing"]


class WorkOrderCloseoutPackage(BaseModel):
    work_order: WorkOrder
    proof_status: ProofStatus
    proof_required: bool = True
    attachments: list[WorkOrderAttachment]
    client_messages: list[WorkOrderMessage]
    internal_messages: list[WorkOrderMessage]
    audit_events: list[WorkOrderEvent]
