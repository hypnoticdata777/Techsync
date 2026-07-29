from datetime import datetime, timezone
from unittest.mock import patch

from models.user import User
from routers import work_orders as work_orders_router


def _work_order_row(proof: bool = True, override: bool = False) -> dict:
    now = datetime.now(timezone.utc)
    return {
        "id": 1,
        "organization_id": 6,
        "title": "Replace hallway light",
        "description": None,
        "property_id": 10,
        "client_id": 20,
        "vendor_id": None,
        "customer_name": "Owner",
        "address": "100 Main St",
        "latitude": None,
        "longitude": None,
        "service_type": "electrical",
        "priority": "medium",
        "status": "completed",
        "assigned_technician_id": None,
        "created_by": 5,
        "source": "manual",
        "external_ref": None,
        "sla_due_at": None,
        "completed_at": now,
        "completion_notes": "Done",
        "completion_proof_verified_at": now if proof else None,
        "completion_override_reason": "Legacy job closed before photo policy" if override else None,
        "created_at": now,
        "updated_at": now,
    }


def test_closeout_package_composes_tenant_scoped_summary():
    now = datetime.now(timezone.utc)
    admin_user = User(
        id=5,
        organization_id=6,
        email="admin@example.com",
        full_name="Admin",
        role="org_admin",
        is_active=True,
    )

    with patch(
        "routers.work_orders.work_orders_repo.get_by_id_in_org",
        return_value=_work_order_row(proof=True),
    ) as get_work_order:
        with patch(
            "routers.work_orders.attachments_repo.list_for_work_order",
            return_value=[
                {
                    "id": 2,
                    "work_order_id": 1,
                    "file_name": "after.jpg",
                    "file_url": "https://files.example/after.jpg",
                    "content_type": "image/jpeg",
                    "uploaded_by": 5,
                    "created_at": now,
                }
            ],
        ) as list_attachments:
            with patch(
                "routers.work_orders.messages_repo.list_for_work_order",
                side_effect=[
                    [
                        {
                            "id": 3,
                            "organization_id": 6,
                            "work_order_id": 1,
                            "author_user_id": 5,
                            "visibility": "client",
                            "body": "Work completed.",
                            "created_at": now,
                        }
                    ],
                    [
                        {
                            "id": 4,
                            "organization_id": 6,
                            "work_order_id": 1,
                            "author_user_id": 5,
                            "visibility": "internal",
                            "body": "Breaker checked.",
                            "created_at": now,
                        }
                    ],
                ],
            ) as list_messages:
                with patch(
                    "routers.work_orders.events_repo.list_for_work_order",
                    return_value=[
                        {
                            "id": 5,
                            "work_order_id": 1,
                            "event_type": "status_changed",
                            "from_status": "in_progress",
                            "to_status": "completed",
                            "actor_user_id": 5,
                            "notes": "Done",
                            "created_at": now,
                        }
                    ],
                ) as list_events:
                    package = work_orders_router.get_closeout_package(
                        1, current_user=admin_user, organization={"id": 6}
                    )

    assert package.proof_status == "verified"
    assert package.work_order.id == 1
    assert package.attachments[0].file_name == "after.jpg"
    assert package.client_messages[0].visibility == "client"
    assert package.internal_messages[0].visibility == "internal"
    assert package.audit_events[0].event_type == "status_changed"
    assert get_work_order.call_args.args == (1, 6)
    assert list_attachments.call_args.args == (6, 1)
    assert list_messages.call_args_list[0].args == (6, 1)
    assert list_messages.call_args_list[0].kwargs == {"visibility": "client"}
    assert list_messages.call_args_list[1].args == (6, 1)
    assert list_messages.call_args_list[1].kwargs == {"visibility": "internal"}
    assert list_events.call_args.args == (6, 1)
