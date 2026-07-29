from datetime import datetime, timezone
from unittest.mock import patch

from models.closeout_package import WorkOrderCloseoutPackage
from models.user import User
from models.work_order import WorkOrder, WorkOrderAttachment, WorkOrderEvent
from models.work_order_message import WorkOrderMessage
from routers import work_orders as work_orders_router
from services import closeout_export_service


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


def _admin_user() -> User:
    return User(
        id=5,
        organization_id=6,
        email="admin@example.com",
        full_name="Admin",
        role="org_admin",
        is_active=True,
    )


def _sample_package() -> WorkOrderCloseoutPackage:
    now = datetime.now(timezone.utc)
    return WorkOrderCloseoutPackage(
        work_order=WorkOrder(**_work_order_row(proof=True)),
        proof_status="verified",
        attachments=[
            WorkOrderAttachment(
                id=2,
                work_order_id=1,
                file_name="after.jpg",
                file_url="https://files.example/after.jpg",
                content_type="image/jpeg",
                uploaded_by=5,
                created_at=now,
            )
        ],
        client_messages=[
            WorkOrderMessage(
                id=3,
                organization_id=6,
                work_order_id=1,
                author_user_id=5,
                visibility="client",
                body="Work completed.",
                created_at=now,
            )
        ],
        internal_messages=[
            WorkOrderMessage(
                id=4,
                organization_id=6,
                work_order_id=1,
                author_user_id=5,
                visibility="internal",
                body="Breaker checked.",
                created_at=now,
            )
        ],
        audit_events=[
            WorkOrderEvent(
                id=5,
                work_order_id=1,
                event_type="status_changed",
                from_status="in_progress",
                to_status="completed",
                actor_user_id=5,
                notes="Done",
                created_at=now,
            )
        ],
    )


def test_closeout_package_composes_tenant_scoped_summary():
    now = datetime.now(timezone.utc)
    admin_user = _admin_user()

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


def test_closeout_export_service_renders_html_and_text():
    package = _sample_package()

    html = closeout_export_service.build_closeout_html(package)
    text = closeout_export_service.build_closeout_text(package)

    assert "TechSync Ops Closeout Package - WO #1" in html
    assert "Work completed." in html
    assert "after.jpg" in html
    assert "TechSync Ops Closeout Package - WO #1" in text
    assert "Breaker checked." in text
    assert "https://files.example/after.jpg" in text


def test_closeout_export_route_returns_downloadable_html():
    package = _sample_package()

    with patch("routers.work_orders._build_closeout_package", return_value=package):
        response = work_orders_router.export_closeout_package(
            1,
            format="html",
            current_user=_admin_user(),
            organization={"id": 6},
        )

    assert response.media_type == "text/html"
    assert 'filename="techsync-closeout-wo-1.html"' in response.headers["content-disposition"]
    assert b"TechSync Ops Closeout Package" in response.body


def test_closeout_export_route_returns_downloadable_text():
    package = _sample_package()

    with patch("routers.work_orders._build_closeout_package", return_value=package):
        response = work_orders_router.export_closeout_package(
            1,
            format="text",
            current_user=_admin_user(),
            organization={"id": 6},
        )

    assert response.media_type == "text/plain"
    assert 'filename="techsync-closeout-wo-1.txt"' in response.headers["content-disposition"]
    assert b"Work completed." in response.body
