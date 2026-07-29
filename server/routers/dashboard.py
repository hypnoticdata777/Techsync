"""Admin dashboard metrics and dispatch views (RF-25)."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from fastapi import Query
from fastapi.responses import PlainTextResponse

from dependencies import get_current_organization, require_roles
from models.dashboard import (
    DashboardMetrics,
    DispatchBoard,
    DispatchBoardSummary,
    DispatchBoardTechnicianLane,
    DispatchBoardWorkOrder,
    OperationsReport,
)
from models.user import User
from repositories import technicians as technicians_repo
from repositories import work_orders as work_orders_repo
from services import dashboard_export_service

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


@router.get("/operations-report", response_model=OperationsReport)
def get_operations_report(
    stale_days: int = Query(7, ge=1, le=90),
    hotspot_days: int = Query(90, ge=1, le=365),
    completion_days: int = Query(90, ge=1, le=365),
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(require_roles("org_admin", "coordinator")),
    organization: dict = Depends(get_current_organization),
):
    return OperationsReport(
        stale_work_orders=work_orders_repo.list_stale_work_orders(
            organization["id"], older_than_days=stale_days, limit=limit
        ),
        overloaded_technicians=work_orders_repo.list_overloaded_technicians(
            organization["id"], limit=limit
        ),
        property_hotspots=work_orders_repo.list_property_hotspots(
            organization["id"], since_days=hotspot_days, limit=limit
        ),
        completion_cycles=work_orders_repo.list_completion_cycles(
            organization["id"], since_days=completion_days, limit=limit
        ),
    )


@router.get("/operations-report/export")
def export_operations_report(
    stale_days: int = Query(7, ge=1, le=90),
    hotspot_days: int = Query(90, ge=1, le=365),
    completion_days: int = Query(90, ge=1, le=365),
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(require_roles("org_admin", "coordinator")),
    organization: dict = Depends(get_current_organization),
):
    report = get_operations_report(
        stale_days=stale_days,
        hotspot_days=hotspot_days,
        completion_days=completion_days,
        limit=limit,
        current_user=current_user,
        organization=organization,
    )
    return PlainTextResponse(
        dashboard_export_service.build_operations_report_csv(report),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="techsync-operations-report.csv"'},
    )


def _as_aware_utc(value: datetime | str | None) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, str):
        value = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _sla_risk_level(sla_due_at: datetime | None, now: datetime) -> str:
    due_at = _as_aware_utc(sla_due_at)
    if due_at is None:
        return "none"
    seconds_until_due = (due_at - now).total_seconds()
    if seconds_until_due <= 0:
        return "breached"
    if seconds_until_due <= 2 * 60 * 60:
        return "due_soon"
    return "on_track"


def _format_dispatch_work_order(row: dict, now: datetime) -> DispatchBoardWorkOrder:
    created_at = _as_aware_utc(row.get("created_at")) or now
    age_hours = max((now - created_at).total_seconds() / 3600, 0)
    return DispatchBoardWorkOrder(
        id=row["id"],
        title=row["title"],
        status=row["status"],
        priority=row["priority"],
        assigned_technician_id=row.get("assigned_technician_id"),
        property_id=row.get("property_id"),
        property_name=row.get("property_name"),
        client_id=row.get("client_id"),
        client_display_name=row.get("client_display_name"),
        vendor_id=row.get("vendor_id"),
        vendor_name=row.get("vendor_name"),
        created_at=created_at,
        sla_due_at=_as_aware_utc(row.get("sla_due_at")),
        age_hours=round(age_hours, 1),
        sla_risk_level=_sla_risk_level(row.get("sla_due_at"), now),
    )


@router.get("/dispatch-board", response_model=DispatchBoard)
def get_dispatch_board(
    current_user: User = Depends(require_roles("org_admin", "coordinator")),
    organization: dict = Depends(get_current_organization),
):
    rows = work_orders_repo.list_dispatch_board_work_orders(organization["id"])
    technicians = technicians_repo.list_by_org(organization["id"])
    now = datetime.now(timezone.utc)

    work_orders = [_format_dispatch_work_order(row, now) for row in rows]
    unassigned = [item for item in work_orders if item.assigned_technician_id is None]
    assigned_by_technician: dict[int, list[DispatchBoardWorkOrder]] = {}
    for item in work_orders:
        if item.assigned_technician_id is None:
            continue
        assigned_by_technician.setdefault(item.assigned_technician_id, []).append(item)

    lanes = []
    for technician in technicians:
        assigned = assigned_by_technician.get(technician["id"], [])
        max_daily_jobs = int(technician.get("max_daily_jobs") or 1)
        active_count = len(assigned)
        lanes.append(
            DispatchBoardTechnicianLane(
                technician_id=technician["id"],
                full_name=technician["users"]["full_name"],
                email=technician["users"]["email"],
                availability_status=technician["availability_status"],
                max_daily_jobs=max_daily_jobs,
                active_work_order_count=active_count,
                utilization_percent=round((active_count / max_daily_jobs) * 100, 1),
                work_orders=assigned,
            )
        )

    lanes.sort(
        key=lambda lane: (
            -lane.active_work_order_count,
            lane.availability_status != "available",
            lane.full_name.lower(),
        )
    )

    summary = DispatchBoardSummary(
        open_count=sum(1 for item in work_orders if item.status == "open"),
        in_progress_count=sum(1 for item in work_orders if item.status == "in_progress"),
        unassigned_count=len(unassigned),
        sla_at_risk_count=sum(
            1 for item in work_orders if item.sla_risk_level in {"breached", "due_soon"}
        ),
        emergency_count=sum(1 for item in work_orders if item.priority == "emergency"),
    )

    return DispatchBoard(
        summary=summary,
        unassigned_work_orders=unassigned,
        technician_lanes=lanes,
    )


@router.get("/dispatch-board/export")
def export_dispatch_board(
    current_user: User = Depends(require_roles("org_admin", "coordinator")),
    organization: dict = Depends(get_current_organization),
):
    board = get_dispatch_board(current_user=current_user, organization=organization)
    return PlainTextResponse(
        dashboard_export_service.build_dispatch_board_csv(board),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="techsync-dispatch-board.csv"'},
    )
