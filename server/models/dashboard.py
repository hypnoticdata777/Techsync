"""Pydantic schemas for admin dashboard metrics and operations reporting (RF-25)."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class DashboardMetrics(BaseModel):
    total_work_orders: int
    open_count: int
    in_progress_count: int
    completed_count: int
    cancelled_count: int
    sla_at_risk_count: int
    active_technicians_count: int
    total_technicians_count: int


class StaleWorkOrderMetric(BaseModel):
    id: int
    title: str
    status: str
    priority: str
    assigned_technician_id: Optional[int] = None
    property_id: Optional[int] = None
    client_id: Optional[int] = None
    created_at: datetime
    sla_due_at: Optional[datetime] = None


class OverloadedTechnicianMetric(BaseModel):
    technician_id: int
    user_id: int
    full_name: str
    email: str
    availability_status: str
    active_work_order_count: int
    max_daily_jobs: int


class PropertyHotspotMetric(BaseModel):
    property_id: int
    property_name: str
    address_line1: str
    total_work_orders: int
    open_count: int
    in_progress_count: int
    completed_count: int
    latest_work_order_at: Optional[datetime] = None


class OperationsReport(BaseModel):
    stale_work_orders: list[StaleWorkOrderMetric]
    overloaded_technicians: list[OverloadedTechnicianMetric]
    property_hotspots: list[PropertyHotspotMetric]


class DispatchBoardWorkOrder(BaseModel):
    id: int
    title: str
    status: str
    priority: str
    assigned_technician_id: Optional[int] = None
    property_id: Optional[int] = None
    property_name: Optional[str] = None
    client_id: Optional[int] = None
    client_display_name: Optional[str] = None
    vendor_id: Optional[int] = None
    vendor_name: Optional[str] = None
    created_at: datetime
    sla_due_at: Optional[datetime] = None
    age_hours: float
    sla_risk_level: str


class DispatchBoardTechnicianLane(BaseModel):
    technician_id: int
    full_name: str
    email: str
    availability_status: str
    max_daily_jobs: int
    active_work_order_count: int
    utilization_percent: float
    work_orders: list[DispatchBoardWorkOrder]


class DispatchBoardSummary(BaseModel):
    open_count: int
    in_progress_count: int
    unassigned_count: int
    sla_at_risk_count: int
    emergency_count: int


class DispatchBoard(BaseModel):
    summary: DispatchBoardSummary
    unassigned_work_orders: list[DispatchBoardWorkOrder]
    technician_lanes: list[DispatchBoardTechnicianLane]
