"""Admin dashboard metrics (RF-25)."""

from fastapi import APIRouter, Depends

from dependencies import get_current_organization, require_roles
from models.dashboard import DashboardMetrics
from models.user import User
from repositories import technicians as technicians_repo
from repositories import work_orders as work_orders_repo

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/metrics", response_model=DashboardMetrics)
def get_metrics(
    current_user: User = Depends(require_roles("org_admin", "coordinator")),
    organization: dict = Depends(get_current_organization),
):
    status_counts = work_orders_repo.counts_by_status(organization["id"])
    sla_at_risk = work_orders_repo.count_sla_at_risk(organization["id"])
    technicians = technicians_repo.list_by_org(organization["id"])
    active_technicians = [t for t in technicians if t.get("availability_status") == "available"]

    return DashboardMetrics(
        total_work_orders=sum(status_counts.values()),
        open_count=status_counts["open"],
        in_progress_count=status_counts["in_progress"],
        completed_count=status_counts["completed"],
        cancelled_count=status_counts["cancelled"],
        sla_at_risk_count=sla_at_risk,
        active_technicians_count=len(active_technicians),
        total_technicians_count=len(technicians),
    )
