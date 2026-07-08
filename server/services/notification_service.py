"""
Technician notification service (RF-16).

No real push infrastructure exists in this POC (that would mean wiring up
FCM/APNs device tokens from the mobile app). This service centralizes the
"notify a technician" call so swapping in a real push provider later only
touches this one file; for now it logs a structured event so the effect is
still observable during a demo.
"""

from logger import logger


def notify_technician_assigned(technician: dict, work_order: dict) -> None:
    logger.info(
        "notification.assigned",
        extra={
            "event": "technician_assigned",
            "technician_id": technician.get("id"),
            "work_order_id": work_order.get("id"),
            "work_order_title": work_order.get("title"),
        },
    )
