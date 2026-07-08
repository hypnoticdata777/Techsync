"""Pydantic schema for admin dashboard metrics (RF-25)."""

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
