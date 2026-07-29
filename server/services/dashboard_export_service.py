"""CSV exports for v1.3 dashboard and dispatch evidence."""

from __future__ import annotations

import csv
from datetime import datetime
from io import StringIO
from typing import Any

from models.dashboard import DispatchBoard, DispatchBoardWorkOrder, OperationsReport


def _format_value(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, datetime):
        return value.isoformat()
    return str(value)


def _write_csv(headers: list[str], rows: list[dict[str, Any]]) -> str:
    output = StringIO()
    writer = csv.DictWriter(output, fieldnames=headers, extrasaction="ignore")
    writer.writeheader()
    for row in rows:
        writer.writerow({header: _format_value(row.get(header)) for header in headers})
    return output.getvalue()


def build_operations_report_csv(report: OperationsReport) -> str:
    headers = [
        "section",
        "id",
        "title",
        "status",
        "priority",
        "assigned_technician_id",
        "technician_id",
        "technician_name",
        "technician_email",
        "availability_status",
        "active_work_order_count",
        "max_daily_jobs",
        "property_id",
        "property_name",
        "address_line1",
        "total_work_orders",
        "open_count",
        "in_progress_count",
        "completed_count",
        "service_type",
        "average_cycle_hours",
        "fastest_cycle_hours",
        "slowest_cycle_hours",
        "created_at",
        "sla_due_at",
        "latest_work_order_at",
        "latest_completed_at",
    ]
    rows: list[dict[str, Any]] = []

    for item in report.stale_work_orders:
        rows.append(
            {
                "section": "stale_work_order",
                "id": item.id,
                "title": item.title,
                "status": item.status,
                "priority": item.priority,
                "assigned_technician_id": item.assigned_technician_id,
                "property_id": item.property_id,
                "created_at": item.created_at,
                "sla_due_at": item.sla_due_at,
            }
        )

    for item in report.overloaded_technicians:
        rows.append(
            {
                "section": "overloaded_technician",
                "technician_id": item.technician_id,
                "technician_name": item.full_name,
                "technician_email": item.email,
                "availability_status": item.availability_status,
                "active_work_order_count": item.active_work_order_count,
                "max_daily_jobs": item.max_daily_jobs,
            }
        )

    for item in report.property_hotspots:
        rows.append(
            {
                "section": "property_hotspot",
                "property_id": item.property_id,
                "property_name": item.property_name,
                "address_line1": item.address_line1,
                "total_work_orders": item.total_work_orders,
                "open_count": item.open_count,
                "in_progress_count": item.in_progress_count,
                "completed_count": item.completed_count,
                "latest_work_order_at": item.latest_work_order_at,
            }
        )

    for item in report.completion_cycles:
        rows.append(
            {
                "section": "completion_cycle",
                "service_type": item.service_type,
                "completed_count": item.completed_count,
                "average_cycle_hours": item.average_cycle_hours,
                "fastest_cycle_hours": item.fastest_cycle_hours,
                "slowest_cycle_hours": item.slowest_cycle_hours,
                "latest_completed_at": item.latest_completed_at,
            }
        )

    return _write_csv(headers, rows)


def build_dispatch_board_csv(board: DispatchBoard) -> str:
    headers = [
        "section",
        "metric",
        "value",
        "work_order_id",
        "title",
        "status",
        "priority",
        "technician_id",
        "technician_name",
        "technician_email",
        "availability_status",
        "max_daily_jobs",
        "active_work_order_count",
        "utilization_percent",
        "property_id",
        "property_name",
        "client_id",
        "client_display_name",
        "vendor_id",
        "vendor_name",
        "age_hours",
        "sla_risk_level",
        "created_at",
        "sla_due_at",
    ]
    rows: list[dict[str, Any]] = [
        {"section": "summary", "metric": "open_count", "value": board.summary.open_count},
        {
            "section": "summary",
            "metric": "in_progress_count",
            "value": board.summary.in_progress_count,
        },
        {
            "section": "summary",
            "metric": "paused_count",
            "value": board.summary.paused_count,
        },
        {
            "section": "summary",
            "metric": "escalated_count",
            "value": board.summary.escalated_count,
        },
        {
            "section": "summary",
            "metric": "unassigned_count",
            "value": board.summary.unassigned_count,
        },
        {
            "section": "summary",
            "metric": "sla_at_risk_count",
            "value": board.summary.sla_at_risk_count,
        },
        {
            "section": "summary",
            "metric": "emergency_count",
            "value": board.summary.emergency_count,
        },
    ]

    for item in board.unassigned_work_orders:
        rows.append(_dispatch_work_order_row("unassigned_work_order", item))

    for lane in board.technician_lanes:
        rows.append(
            {
                "section": "technician_lane",
                "technician_id": lane.technician_id,
                "technician_name": lane.full_name,
                "technician_email": lane.email,
                "availability_status": lane.availability_status,
                "max_daily_jobs": lane.max_daily_jobs,
                "active_work_order_count": lane.active_work_order_count,
                "utilization_percent": lane.utilization_percent,
            }
        )
        for item in lane.work_orders:
            rows.append(
                {
                    **_dispatch_work_order_row("assigned_work_order", item),
                    "technician_id": lane.technician_id,
                    "technician_name": lane.full_name,
                    "technician_email": lane.email,
                    "availability_status": lane.availability_status,
                    "max_daily_jobs": lane.max_daily_jobs,
                    "active_work_order_count": lane.active_work_order_count,
                    "utilization_percent": lane.utilization_percent,
                }
            )

    return _write_csv(headers, rows)


def _dispatch_work_order_row(section: str, item: DispatchBoardWorkOrder) -> dict[str, Any]:
    return {
        "section": section,
        "work_order_id": item.id,
        "title": item.title,
        "status": item.status,
        "priority": item.priority,
        "technician_id": item.assigned_technician_id,
        "property_id": item.property_id,
        "property_name": item.property_name,
        "client_id": item.client_id,
        "client_display_name": item.client_display_name,
        "vendor_id": item.vendor_id,
        "vendor_name": item.vendor_name,
        "age_hours": item.age_hours,
        "sla_risk_level": item.sla_risk_level,
        "created_at": item.created_at,
        "sla_due_at": item.sla_due_at,
    }
