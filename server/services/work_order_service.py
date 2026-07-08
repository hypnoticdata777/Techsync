"""
Orchestration for work order lifecycle: create, assign, transition status,
and keep the audit log (work_order_events) consistent (RF-14, RF-15, RF-18,
RF-20).
"""

from typing import Optional

from models.work_order import ALLOWED_STATUS_TRANSITIONS
from repositories import priority_rules as priority_rules_repo
from repositories import technicians as technicians_repo
from repositories import work_order_events as events_repo
from repositories import work_orders as work_orders_repo
from services import matching_service, notification_service


class InvalidStatusTransition(Exception):
    def __init__(self, from_status: str, to_status: str):
        self.from_status = from_status
        self.to_status = to_status
        super().__init__(f"Cannot transition work order from '{from_status}' to '{to_status}'")


def _active_counts(organization_id: int) -> dict[int, int]:
    open_orders = work_orders_repo.list_filtered(organization_id, status="open")
    in_progress_orders = work_orders_repo.list_filtered(organization_id, status="in_progress")
    counts: dict[int, int] = {}
    for row in open_orders + in_progress_orders:
        technician_id = row.get("assigned_technician_id")
        if technician_id:
            counts[technician_id] = counts.get(technician_id, 0) + 1
    return counts


def apply_priority_rule(organization_id: int, service_type: str, requested_priority: str) -> str:
    """RF-17: an org-configured rule can force a priority for a given service_type."""
    forced = priority_rules_repo.get_forced_priority(organization_id, service_type)
    return forced or requested_priority


def auto_assign(organization_id: int, work_order: dict) -> Optional[dict]:
    """RF-14: pick the best technician and persist the assignment. Returns the
    updated work order row, or the original row unchanged if nobody is eligible."""
    technicians = technicians_repo.list_by_org(organization_id)
    active_counts = _active_counts(organization_id)

    best = matching_service.find_best_technician(technicians, work_order, active_counts)
    if not best:
        return work_order

    updated = work_orders_repo.update(
        work_order["id"], organization_id, {"assigned_technician_id": best["id"]}
    )
    events_repo.create_event(
        organization_id,
        work_order["id"],
        event_type="assigned",
        notes=f"Auto-assigned to technician {best['id']}",
    )
    notification_service.notify_technician_assigned(best, updated)
    return updated


def reassign(organization_id: int, work_order_id: int, technician_id: int, actor_user_id: int, notes: Optional[str]) -> Optional[dict]:
    """RF-15: manual reassignment by a coordinator/admin."""
    work_order = work_orders_repo.get_by_id_in_org(work_order_id, organization_id)
    if not work_order:
        return None

    technician = technicians_repo.get_by_id_in_org(technician_id, organization_id)
    if not technician:
        raise ValueError("Technician not found in this organization")

    updated = work_orders_repo.update(
        work_order_id, organization_id, {"assigned_technician_id": technician_id}
    )
    events_repo.create_event(
        organization_id,
        work_order_id,
        event_type="reassigned",
        actor_user_id=actor_user_id,
        notes=notes,
    )
    notification_service.notify_technician_assigned(technician, updated)
    return updated


def transition_status(
    organization_id: int, work_order_id: int, new_status: str, actor_user_id: int, notes: Optional[str]
) -> dict:
    work_order = work_orders_repo.get_by_id_in_org(work_order_id, organization_id)
    if not work_order:
        raise LookupError("Work order not found")

    current_status = work_order["status"]
    if new_status != current_status and new_status not in ALLOWED_STATUS_TRANSITIONS.get(current_status, set()):
        raise InvalidStatusTransition(current_status, new_status)

    patch = {"status": new_status}
    if new_status == "completed":
        from datetime import datetime, timezone

        patch["completed_at"] = datetime.now(timezone.utc).isoformat()
        if notes:
            patch["completion_notes"] = notes

    updated = work_orders_repo.update(work_order_id, organization_id, patch)
    events_repo.create_event(
        organization_id,
        work_order_id,
        event_type="status_changed",
        actor_user_id=actor_user_id,
        from_status=current_status,
        to_status=new_status,
        notes=notes,
    )
    return updated
