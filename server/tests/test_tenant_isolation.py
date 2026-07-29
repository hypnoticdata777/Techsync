"""
Verifies that repository operations keep tenant scoping in the application
layer (RF-05/RNF-05). With direct Postgres access, organization_id filters are
the primary enforcement path, so these tests assert that repository SQL/helper
calls carry the caller's organization_id.
"""

from unittest.mock import patch

import pytest

from fastapi import HTTPException
from repositories import clients as clients_repo
from repositories import properties as properties_repo
from repositories import technicians as technicians_repo
from repositories import users as users_repo
from repositories import vendors as vendors_repo
from repositories import work_order_events as events_repo
from repositories import work_order_messages as messages_repo
from repositories import work_orders as work_orders_repo
from routers import clients as clients_router
from routers import dashboard as dashboard_router
from routers import properties as properties_router
from routers import vendors as vendors_router
from routers import work_orders as work_orders_router
from models.client import ClientUpdate
from models.property import PropertyUpdate
from models.user import User
from models.vendor import VendorUpdate
from models.work_order import WorkOrderApprovalDecision, WorkOrderApprovalRequest, WorkOrderCreate, WorkOrderUpdate
from models.work_order_message import WorkOrderMessageCreate


def test_list_filtered_scopes_by_organization_id():
    with patch("repositories.work_orders.fetch_all", return_value=[]) as mock_fetch:
        work_orders_repo.list_filtered(organization_id=42)

    sql, params = mock_fetch.call_args.args
    assert "organization_id = :organization_id" in sql
    assert params["organization_id"] == 42


def test_work_order_filters_keep_property_client_and_vendor_inside_org_scope():
    with patch("repositories.work_orders.fetch_all", return_value=[]) as mock_fetch:
        work_orders_repo.list_filtered(
            organization_id=42,
            property_id=9,
            client_id=10,
            vendor_id=11,
        )

    sql, params = mock_fetch.call_args.args
    assert "organization_id = :organization_id" in sql
    assert "property_id = :property_id" in sql
    assert "client_id = :client_id" in sql
    assert "vendor_id = :vendor_id" in sql
    assert params == {
        "organization_id": 42,
        "property_id": 9,
        "client_id": 10,
        "vendor_id": 11,
    }


def test_stale_work_order_report_scopes_by_organization_id():
    with patch("repositories.work_orders.fetch_all", return_value=[]) as mock_fetch:
        work_orders_repo.list_stale_work_orders(organization_id=42, older_than_days=14, limit=5)

    sql, params = mock_fetch.call_args.args
    assert "organization_id = :organization_id" in sql
    assert "status IN ('open', 'in_progress')" in sql
    assert params["organization_id"] == 42
    assert params["limit"] == 5


def test_overloaded_technician_report_scopes_by_organization_id():
    with patch("repositories.work_orders.fetch_all", return_value=[]) as mock_fetch:
        work_orders_repo.list_overloaded_technicians(organization_id=42, limit=5)

    sql, params = mock_fetch.call_args.args
    assert "WHERE t.organization_id = :organization_id" in sql
    assert "wo.organization_id = t.organization_id" in sql
    assert params == {"organization_id": 42, "limit": 5}


def test_property_hotspot_report_scopes_by_organization_id():
    with patch("repositories.work_orders.fetch_all", return_value=[]) as mock_fetch:
        work_orders_repo.list_property_hotspots(organization_id=42, since_days=30, limit=5)

    sql, params = mock_fetch.call_args.args
    assert "WHERE p.organization_id = :organization_id" in sql
    assert "wo.organization_id = p.organization_id" in sql
    assert params["organization_id"] == 42
    assert params["limit"] == 5


def test_completion_cycle_report_scopes_by_organization_id():
    with patch("repositories.work_orders.fetch_all", return_value=[]) as mock_fetch:
        work_orders_repo.list_completion_cycles(organization_id=42, since_days=90, limit=5)

    sql, params = mock_fetch.call_args.args
    assert "WHERE organization_id = :organization_id" in sql
    assert "status = 'completed'" in sql
    assert "completed_at IS NOT NULL" in sql
    assert params["organization_id"] == 42
    assert params["limit"] == 5


def test_dispatch_board_work_orders_scope_and_join_by_organization_id():
    with patch("repositories.work_orders.fetch_all", return_value=[]) as mock_fetch:
        work_orders_repo.list_dispatch_board_work_orders(organization_id=42)

    sql, params = mock_fetch.call_args.args
    assert "WHERE wo.organization_id = :organization_id" in sql
    assert "p.organization_id = wo.organization_id" in sql
    assert "c.organization_id = wo.organization_id" in sql
    assert "v.organization_id = wo.organization_id" in sql
    assert "wo.status IN ('open', 'in_progress')" in sql
    assert params == {"organization_id": 42}


def test_duplicate_warning_query_scopes_and_matches_location_inside_org():
    with patch("repositories.work_orders.fetch_all", return_value=[]) as mock_fetch:
        work_orders_repo.list_potential_duplicates(
            organization_id=42,
            property_id=9,
            address="100 Demo Way",
            service_type="plumbing",
            window_days=14,
            limit=3,
        )

    sql, params = mock_fetch.call_args.args
    assert "WHERE wo.organization_id = :organization_id" in sql
    assert "p.organization_id = wo.organization_id" in sql
    assert "wo.status IN ('open', 'in_progress', 'completed')" in sql
    assert "wo.property_id = :property_id" in sql
    assert "wo.address ILIKE :address" in sql
    assert params["organization_id"] == 42
    assert params["property_id"] == 9
    assert params["address"] == "%100 Demo Way%"
    assert params["service_type"] == "plumbing"
    assert params["limit"] == 3


def test_duplicate_warning_query_returns_empty_without_location_signal():
    with patch("repositories.work_orders.fetch_all") as mock_fetch:
        rows = work_orders_repo.list_potential_duplicates(
            organization_id=42,
            property_id=None,
            address=None,
            service_type="plumbing",
        )

    assert rows == []
    mock_fetch.assert_not_called()


def test_get_by_id_in_org_always_filters_by_caller_org_not_just_row_id():
    with patch("repositories.work_orders.fetch_one", return_value=None) as mock_fetch:
        work_orders_repo.get_by_id_in_org(work_order_id=99, organization_id=7)

    sql, params = mock_fetch.call_args.args
    assert "id = :work_order_id" in sql
    assert "organization_id = :organization_id" in sql
    assert params == {"work_order_id": 99, "organization_id": 7}


def test_update_requires_both_id_and_organization_id():
    with patch("repositories.work_orders.update_row", return_value=None) as mock_update:
        work_orders_repo.update(work_order_id=5, organization_id=3, patch={"status": "completed"})

    table, patch_payload, where = mock_update.call_args.args
    assert table == "work_orders"
    assert patch_payload == {"status": "completed"}
    assert where == {"id": 5, "organization_id": 3}


def test_users_list_by_org_is_scoped():
    with patch("repositories.users.fetch_all", return_value=[]) as mock_fetch:
        users_repo.list_by_org(organization_id=11)

    sql, params = mock_fetch.call_args.args
    assert "WHERE organization_id = :organization_id" in sql
    assert params["organization_id"] == 11


def test_technicians_get_by_id_scoped_to_org():
    with patch("repositories.technicians.fetch_one", return_value=None) as mock_fetch:
        technicians_repo.get_by_id_in_org(technician_id=8, organization_id=2)

    sql, params = mock_fetch.call_args.args
    assert "t.id = :technician_id" in sql
    assert "t.organization_id = :organization_id" in sql
    assert params == {"technician_id": 8, "organization_id": 2}


def test_clients_get_by_id_scoped_to_org():
    with patch("repositories.clients.fetch_one", return_value=None) as mock_fetch:
        clients_repo.get_by_id_in_org(client_id=8, organization_id=2)

    sql, params = mock_fetch.call_args.args
    assert "id = :client_id" in sql
    assert "organization_id = :organization_id" in sql
    assert params == {"client_id": 8, "organization_id": 2}


def test_clients_get_by_email_scoped_to_org_and_active():
    with patch("repositories.clients.fetch_one", return_value=None) as mock_fetch:
        clients_repo.get_by_email_in_org(email="owner@example.com", organization_id=2)

    sql, params = mock_fetch.call_args.args
    assert "organization_id = :organization_id" in sql
    assert "lower(email) = lower(:email)" in sql
    assert "is_active = true" in sql
    assert params == {"email": "owner@example.com", "organization_id": 2}


def test_properties_get_by_id_scoped_to_org():
    with patch("repositories.properties.fetch_one", return_value=None) as mock_fetch:
        properties_repo.get_by_id_in_org(property_id=8, organization_id=2)

    sql, params = mock_fetch.call_args.args
    assert "id = :property_id" in sql
    assert "organization_id = :organization_id" in sql
    assert params == {"property_id": 8, "organization_id": 2}


def test_vendors_get_by_id_scoped_to_org():
    with patch("repositories.vendors.fetch_one", return_value=None) as mock_fetch:
        vendors_repo.get_by_id_in_org(vendor_id=8, organization_id=2)

    sql, params = mock_fetch.call_args.args
    assert "id = :vendor_id" in sql
    assert "organization_id = :organization_id" in sql
    assert params == {"vendor_id": 8, "organization_id": 2}


def test_new_pmc_entity_updates_require_id_and_organization_id():
    with patch("repositories.clients.update_row", return_value=None) as mock_clients_update:
        clients_repo.update(client_id=5, organization_id=3, patch={"display_name": "Owner"})
    with patch("repositories.properties.update_row", return_value=None) as mock_properties_update:
        properties_repo.update(property_id=6, organization_id=3, patch={"name": "West Tower"})
    with patch("repositories.vendors.update_row", return_value=None) as mock_vendors_update:
        vendors_repo.update(vendor_id=7, organization_id=3, patch={"name": "HVAC Partner"})

    assert mock_clients_update.call_args.args[2] == {"id": 5, "organization_id": 3}
    assert mock_properties_update.call_args.args[2] == {"id": 6, "organization_id": 3}
    assert mock_vendors_update.call_args.args[2] == {"id": 7, "organization_id": 3}


def test_work_order_property_client_link_must_match_inside_org():
    with patch("routers.work_orders.clients_repo.get_by_id_in_org", return_value={"id": 10}):
        with patch(
            "routers.work_orders.properties_repo.get_by_id_in_org",
            return_value={"id": 9, "client_id": 12},
        ):
            with pytest.raises(HTTPException) as exc:
                work_orders_router._validate_entity_links(
                    42, {"property_id": 9, "client_id": 10}
                )

    assert exc.value.status_code == 400
    assert exc.value.detail == "Property does not belong to the selected client"


def test_events_are_written_with_org_id():
    with patch("repositories.work_order_events.insert_row") as mock_insert:
        mock_insert.side_effect = lambda table, payload: payload
        event = events_repo.create_event(organization_id=6, work_order_id=1, event_type="created")

    table, payload = mock_insert.call_args.args
    assert table == "work_order_events"
    assert payload["organization_id"] == 6
    assert payload["work_order_id"] == 1
    assert event["organization_id"] == 6


def test_messages_list_for_work_order_scopes_by_org_and_work_order():
    with patch("repositories.work_order_messages.fetch_all", return_value=[]) as mock_fetch:
        messages_repo.list_for_work_order(organization_id=6, work_order_id=1, visibility="client")

    sql, params = mock_fetch.call_args.args
    assert "organization_id = :organization_id" in sql
    assert "work_order_id = :work_order_id" in sql
    assert "visibility = :visibility" in sql
    assert params == {"organization_id": 6, "work_order_id": 1, "visibility": "client"}


def test_client_message_list_forces_client_visibility():
    client_user = User(
        id=5,
        organization_id=6,
        email="owner@example.com",
        full_name="Owner",
        role="client",
        is_active=True,
    )

    with patch(
        "routers.work_orders.work_orders_repo.get_by_id_in_org",
        return_value={"id": 1, "organization_id": 6, "client_id": 9},
    ):
        with patch(
            "routers.work_orders.clients_repo.get_by_email_in_org",
            return_value={"id": 9, "email": "owner@example.com"},
        ):
            with patch("routers.work_orders.messages_repo.list_for_work_order", return_value=[]) as mock_list:
                rows = work_orders_router.list_messages(
                    1,
                    visibility="internal",
                    current_user=client_user,
                    organization={"id": 6},
                )

    assert rows == []
    assert mock_list.call_args.kwargs["visibility"] == "client"


def test_client_cannot_add_internal_message():
    client_user = User(
        id=5,
        organization_id=6,
        email="owner@example.com",
        full_name="Owner",
        role="client",
        is_active=True,
    )

    with patch(
        "routers.work_orders.work_orders_repo.get_by_id_in_org",
        return_value={"id": 1, "organization_id": 6, "client_id": 9},
    ):
        with patch(
            "routers.work_orders.clients_repo.get_by_email_in_org",
            return_value={"id": 9, "email": "owner@example.com"},
        ):
            with pytest.raises(HTTPException) as exc:
                work_orders_router.add_message(
                    1,
                    WorkOrderMessageCreate(body="Private note", visibility="internal"),
                    current_user=client_user,
                    organization={"id": 6},
                )

    assert exc.value.status_code == 403
    assert exc.value.detail == "Client users can only add client-visible messages"


def test_client_work_order_list_forces_own_client_id():
    client_user = User(
        id=5,
        organization_id=6,
        email="owner@example.com",
        full_name="Owner",
        role="client",
        is_active=True,
    )

    with patch(
        "routers.work_orders.clients_repo.get_by_email_in_org",
        return_value={"id": 9, "email": "owner@example.com"},
    ):
        with patch("routers.work_orders.work_orders_repo.list_filtered", return_value=[]) as mock_list:
            rows = work_orders_router.list_work_orders(
                client_id=999,
                current_user=client_user,
                organization={"id": 6},
            )

    assert rows == []
    assert mock_list.call_args.kwargs["client_id"] == 9


def test_client_without_matching_record_sees_no_work_orders():
    client_user = User(
        id=5,
        organization_id=6,
        email="owner@example.com",
        full_name="Owner",
        role="viewer",
        is_active=True,
    )

    with patch("routers.work_orders.clients_repo.get_by_email_in_org", return_value=None):
        with patch("routers.work_orders.work_orders_repo.list_filtered", return_value=[]) as mock_list:
            rows = work_orders_router.list_work_orders(
                current_user=client_user,
                organization={"id": 6},
            )

    assert rows == []
    assert mock_list.call_args.kwargs["client_id"] == -1


def test_client_cannot_view_other_client_work_order():
    client_user = User(
        id=5,
        organization_id=6,
        email="owner@example.com",
        full_name="Owner",
        role="client",
        is_active=True,
    )

    with patch(
        "routers.work_orders.work_orders_repo.get_by_id_in_org",
        return_value={"id": 1, "organization_id": 6, "client_id": 10},
    ):
        with patch(
            "routers.work_orders.clients_repo.get_by_email_in_org",
            return_value={"id": 9, "email": "owner@example.com"},
        ):
            with pytest.raises(HTTPException) as exc:
                work_orders_router.get_work_order(
                    1,
                    current_user=client_user,
                    organization={"id": 6},
                )

    assert exc.value.status_code == 403
    assert exc.value.detail == "Not visible to you"


def test_viewer_cannot_view_other_client_work_order():
    viewer_user = User(
        id=7,
        organization_id=6,
        email="viewer@example.com",
        full_name="Viewer",
        role="viewer",
        is_active=True,
    )

    with patch(
        "routers.work_orders.work_orders_repo.get_by_id_in_org",
        return_value={"id": 1, "organization_id": 6, "client_id": 10},
    ):
        with patch(
            "routers.work_orders.clients_repo.get_by_email_in_org",
            return_value={"id": 9, "email": "viewer@example.com"},
        ):
            with pytest.raises(HTTPException) as exc:
                work_orders_router.get_work_order(
                    1,
                    current_user=viewer_user,
                    organization={"id": 6},
                )

    assert exc.value.status_code == 403
    assert exc.value.detail == "Not visible to you"


def test_viewer_message_list_forces_client_visibility():
    viewer_user = User(
        id=7,
        organization_id=6,
        email="viewer@example.com",
        full_name="Viewer",
        role="viewer",
        is_active=True,
    )

    with patch(
        "routers.work_orders.work_orders_repo.get_by_id_in_org",
        return_value={"id": 1, "organization_id": 6, "client_id": 9},
    ):
        with patch(
            "routers.work_orders.clients_repo.get_by_email_in_org",
            return_value={"id": 9, "email": "viewer@example.com"},
        ):
            with patch("routers.work_orders.messages_repo.list_for_work_order", return_value=[]) as mock_list:
                rows = work_orders_router.list_messages(
                    1,
                    visibility="internal",
                    current_user=viewer_user,
                    organization={"id": 6},
                )

    assert rows == []
    assert mock_list.call_args.kwargs["visibility"] == "client"


def test_technician_cannot_view_unassigned_work_order():
    technician_user = User(
        id=8,
        organization_id=6,
        email="tech@example.com",
        full_name="Technician",
        role="technician",
        is_active=True,
    )

    with patch(
        "routers.work_orders.work_orders_repo.get_by_id_in_org",
        return_value={"id": 1, "organization_id": 6, "assigned_technician_id": None},
    ):
        with patch(
            "routers.work_orders.technicians_repo.get_by_user_id",
            return_value={"id": 4, "user_id": 8},
        ):
            with pytest.raises(HTTPException) as exc:
                work_orders_router.get_work_order(
                    1,
                    current_user=technician_user,
                    organization={"id": 6},
                )

    assert exc.value.status_code == 403
    assert exc.value.detail == "Not assigned to you"


def test_technician_detail_subresources_block_unassigned_work_order():
    technician_user = User(
        id=8,
        organization_id=6,
        email="tech@example.com",
        full_name="Technician",
        role="technician",
        is_active=True,
    )

    with patch(
        "routers.work_orders.work_orders_repo.get_by_id_in_org",
        return_value={"id": 1, "organization_id": 6, "assigned_technician_id": None},
    ):
        with patch(
            "routers.work_orders.technicians_repo.get_by_user_id",
            return_value={"id": 4, "user_id": 8},
        ):
            with patch("routers.work_orders.attachments_repo.list_for_work_order") as mock_list:
                with pytest.raises(HTTPException) as exc:
                    work_orders_router.list_attachments(
                        1,
                        current_user=technician_user,
                        organization={"id": 6},
                    )

    assert exc.value.status_code == 403
    assert exc.value.detail == "Not assigned to you"
    mock_list.assert_not_called()


def test_staff_cannot_request_client_approval_without_linked_client():
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
        return_value={"id": 1, "organization_id": 6, "client_id": None},
    ):
        with pytest.raises(HTTPException) as exc:
            work_orders_router.request_client_approval(
                1,
                WorkOrderApprovalRequest(notes="Please approve the estimate."),
                current_user=admin_user,
                organization={"id": 6},
            )

    assert exc.value.status_code == 400
    assert exc.value.detail == "Client approval requires a linked client"


def test_staff_request_client_approval_writes_status_message_and_event():
    admin_user = User(
        id=5,
        organization_id=6,
        email="admin@example.com",
        full_name="Admin",
        role="coordinator",
        is_active=True,
    )
    updated_row = {
        "id": 1,
        "organization_id": 6,
        "title": "Leaking sink",
        "description": None,
        "property_id": 3,
        "client_id": 9,
        "vendor_id": None,
        "customer_name": None,
        "address": None,
        "latitude": None,
        "longitude": None,
        "service_type": "plumbing",
        "priority": "medium",
        "status": "open",
        "assigned_technician_id": None,
        "created_by": 5,
        "source": "manual",
        "external_ref": None,
        "sla_due_at": None,
        "completed_at": None,
        "completion_notes": None,
        "completion_proof_verified_at": None,
        "completion_override_reason": None,
        "client_approval_status": "pending",
        "client_approval_requested_at": None,
        "client_approval_requested_by": 5,
        "client_approval_decision_at": None,
        "client_approval_decision_by": None,
        "client_approval_notes": "Please approve the estimate.",
        "created_at": "2026-07-28T00:00:00Z",
        "updated_at": "2026-07-28T00:00:00Z",
    }

    with patch(
        "routers.work_orders.work_orders_repo.get_by_id_in_org",
        return_value={"id": 1, "organization_id": 6, "client_id": 9},
    ):
        with patch("routers.work_orders.work_orders_repo.update", return_value=updated_row) as mock_update:
            with patch("routers.work_orders.events_repo.create_event", return_value={}) as mock_event:
                with patch("routers.work_orders.messages_repo.create", return_value={}) as mock_message:
                    row = work_orders_router.request_client_approval(
                        1,
                        WorkOrderApprovalRequest(notes="Please approve the estimate."),
                        current_user=admin_user,
                        organization={"id": 6},
                    )

    assert row.client_approval_status == "pending"
    assert mock_update.call_args.args[0:2] == (1, 6)
    assert mock_update.call_args.args[2]["client_approval_status"] == "pending"
    assert mock_update.call_args.args[2]["client_approval_decision_at"] is None
    assert mock_event.call_args.kwargs["event_type"] == "client_approval_requested"
    assert mock_message.call_args.args[3]["visibility"] == "client"


def test_client_approval_decision_requires_pending_status():
    client_user = User(
        id=5,
        organization_id=6,
        email="owner@example.com",
        full_name="Owner",
        role="client",
        is_active=True,
    )

    with patch(
        "routers.work_orders.work_orders_repo.get_by_id_in_org",
        return_value={
            "id": 1,
            "organization_id": 6,
            "client_id": 9,
            "client_approval_status": "not_required",
        },
    ):
        with patch(
            "routers.work_orders.clients_repo.get_by_email_in_org",
            return_value={"id": 9, "email": "owner@example.com"},
        ):
            with pytest.raises(HTTPException) as exc:
                work_orders_router.decide_client_approval(
                    1,
                    WorkOrderApprovalDecision(decision="approved", notes=None),
                    current_user=client_user,
                    organization={"id": 6},
                )

    assert exc.value.status_code == 400
    assert exc.value.detail == "Client approval is not pending for this work order"


def test_duplicate_warning_route_validates_links_and_returns_warnings():
    admin_user = User(
        id=5,
        organization_id=6,
        email="admin@example.com",
        full_name="Admin",
        role="coordinator",
        is_active=True,
    )
    payload = WorkOrderCreate(
        title="Kitchen leak",
        property_id=3,
        client_id=9,
        address="100 Demo Way",
        service_type="plumbing",
        auto_assign=True,
    )
    duplicate_rows = [
        {
            "id": 1,
            "title": "Kitchen leak follow-up",
            "status": "open",
            "priority": "high",
            "property_id": 3,
            "property_name": "Demo Property",
            "customer_name": "Synthetic Resident",
            "address": "100 Demo Way",
            "service_type": "plumbing",
            "created_at": "2026-07-28T00:00:00Z",
            "similarity_reason": "same property and service type",
        }
    ]

    with patch("routers.work_orders.clients_repo.get_by_id_in_org", return_value={"id": 9}):
        with patch(
            "routers.work_orders.properties_repo.get_by_id_in_org",
            return_value={"id": 3, "client_id": 9},
        ):
            with patch("routers.work_orders.work_orders_repo.list_potential_duplicates", return_value=duplicate_rows) as mock_list:
                warnings = work_orders_router.check_duplicate_warnings(
                    payload,
                    current_user=admin_user,
                    organization={"id": 6},
                )

    assert warnings[0].id == 1
    assert warnings[0].similarity_reason == "same property and service type"
    assert mock_list.call_args.kwargs["property_id"] == 3
    assert mock_list.call_args.kwargs["address"] == "100 Demo Way"
    assert mock_list.call_args.kwargs["service_type"] == "plumbing"


def test_client_can_decline_pending_approval_for_own_work_order():
    client_user = User(
        id=5,
        organization_id=6,
        email="owner@example.com",
        full_name="Owner",
        role="client",
        is_active=True,
    )
    updated_row = {
        "id": 1,
        "organization_id": 6,
        "title": "Leaking sink",
        "description": None,
        "property_id": 3,
        "client_id": 9,
        "vendor_id": None,
        "customer_name": None,
        "address": None,
        "latitude": None,
        "longitude": None,
        "service_type": "plumbing",
        "priority": "medium",
        "status": "open",
        "assigned_technician_id": None,
        "created_by": 5,
        "source": "manual",
        "external_ref": None,
        "sla_due_at": None,
        "completed_at": None,
        "completion_notes": None,
        "completion_proof_verified_at": None,
        "completion_override_reason": None,
        "client_approval_status": "declined",
        "client_approval_requested_at": None,
        "client_approval_requested_by": 5,
        "client_approval_decision_at": None,
        "client_approval_decision_by": 5,
        "client_approval_notes": "Need a lower-cost option.",
        "created_at": "2026-07-28T00:00:00Z",
        "updated_at": "2026-07-28T00:00:00Z",
    }

    with patch(
        "routers.work_orders.work_orders_repo.get_by_id_in_org",
        return_value={
            "id": 1,
            "organization_id": 6,
            "client_id": 9,
            "client_approval_status": "pending",
        },
    ):
        with patch(
            "routers.work_orders.clients_repo.get_by_email_in_org",
            return_value={"id": 9, "email": "owner@example.com"},
        ):
            with patch("routers.work_orders.work_orders_repo.update", return_value=updated_row) as mock_update:
                with patch("routers.work_orders.events_repo.create_event", return_value={}) as mock_event:
                    with patch("routers.work_orders.messages_repo.create", return_value={}) as mock_message:
                        row = work_orders_router.decide_client_approval(
                            1,
                            WorkOrderApprovalDecision(
                                decision="declined",
                                notes="Need a lower-cost option.",
                            ),
                            current_user=client_user,
                            organization={"id": 6},
                        )

    assert row.client_approval_status == "declined"
    assert mock_update.call_args.args[2]["client_approval_status"] == "declined"
    assert mock_update.call_args.args[2]["client_approval_decision_by"] == 5
    assert mock_event.call_args.kwargs["event_type"] == "client_approval_declined"
    assert "declined" in mock_message.call_args.args[3]["body"]


def test_operations_report_uses_tenant_scoped_repository_calls():
    admin_user = User(
        id=5,
        organization_id=6,
        email="admin@example.com",
        full_name="Admin",
        role="org_admin",
        is_active=True,
    )

    with patch("routers.dashboard.work_orders_repo.list_stale_work_orders", return_value=[]) as stale:
        with patch("routers.dashboard.work_orders_repo.list_overloaded_technicians", return_value=[]) as overloaded:
            with patch("routers.dashboard.work_orders_repo.list_property_hotspots", return_value=[]) as hotspots:
                with patch("routers.dashboard.work_orders_repo.list_completion_cycles", return_value=[]) as cycles:
                    report = dashboard_router.get_operations_report(
                        stale_days=14,
                        hotspot_days=60,
                        completion_days=120,
                        limit=5,
                        current_user=admin_user,
                        organization={"id": 6},
                    )

    assert report.stale_work_orders == []
    assert report.overloaded_technicians == []
    assert report.property_hotspots == []
    assert report.completion_cycles == []
    assert stale.call_args.args == (6,)
    assert stale.call_args.kwargs == {"older_than_days": 14, "limit": 5}
    assert overloaded.call_args.args == (6,)
    assert overloaded.call_args.kwargs == {"limit": 5}
    assert hotspots.call_args.args == (6,)
    assert hotspots.call_args.kwargs == {"since_days": 60, "limit": 5}
    assert cycles.call_args.args == (6,)
    assert cycles.call_args.kwargs == {"since_days": 120, "limit": 5}


def test_dispatch_board_uses_tenant_scoped_repository_calls_and_summarizes():
    admin_user = User(
        id=5,
        organization_id=6,
        email="admin@example.com",
        full_name="Admin",
        role="org_admin",
        is_active=True,
    )
    work_rows = [
        {
            "id": 1,
            "title": "Unassigned leak",
            "status": "open",
            "priority": "emergency",
            "assigned_technician_id": None,
            "property_id": 3,
            "property_name": "West Tower",
            "client_id": 9,
            "client_display_name": "Owner A",
            "vendor_id": 11,
            "vendor_name": "Vendor A",
            "created_at": "2026-07-28T00:00:00Z",
            "sla_due_at": "2026-07-28T01:00:00Z",
        },
        {
            "id": 2,
            "title": "Assigned sink",
            "status": "in_progress",
            "priority": "medium",
            "assigned_technician_id": 8,
            "property_id": 4,
            "property_name": "East Tower",
            "client_id": 10,
            "client_display_name": "Owner B",
            "vendor_id": None,
            "vendor_name": None,
            "created_at": "2026-07-28T00:00:00Z",
            "sla_due_at": None,
        },
    ]
    technician_rows = [
        {
            "id": 8,
            "availability_status": "available",
            "max_daily_jobs": 4,
            "users": {"full_name": "Tech One", "email": "tech@example.com"},
        }
    ]

    with patch("routers.dashboard.work_orders_repo.list_dispatch_board_work_orders", return_value=work_rows) as work_list:
        with patch("routers.dashboard.technicians_repo.list_by_org", return_value=technician_rows) as tech_list:
            board = dashboard_router.get_dispatch_board(
                current_user=admin_user,
                organization={"id": 6},
            )

    assert work_list.call_args.args == (6,)
    assert tech_list.call_args.args == (6,)
    assert board.summary.open_count == 1
    assert board.summary.in_progress_count == 1
    assert board.summary.unassigned_count == 1
    assert board.summary.emergency_count == 1
    assert board.unassigned_work_orders[0].id == 1
    assert board.technician_lanes[0].technician_id == 8
    assert board.technician_lanes[0].active_work_order_count == 1
    assert board.technician_lanes[0].utilization_percent == 25.0


def test_operations_report_export_returns_downloadable_csv():
    admin_user = User(
        id=5,
        organization_id=6,
        email="admin@example.com",
        full_name="Admin",
        role="org_admin",
        is_active=True,
    )
    stale_rows = [
        {
            "id": 1,
            "title": "Old leak",
            "status": "open",
            "priority": "high",
            "assigned_technician_id": None,
            "property_id": 3,
            "client_id": 9,
            "created_at": "2026-07-28T00:00:00Z",
            "sla_due_at": None,
        }
    ]
    cycle_rows = [
        {
            "service_type": "plumbing",
            "completed_count": 3,
            "average_cycle_hours": 18.5,
            "fastest_cycle_hours": 4.0,
            "slowest_cycle_hours": 36.0,
            "latest_completed_at": "2026-07-28T03:00:00Z",
        }
    ]

    with patch("routers.dashboard.work_orders_repo.list_stale_work_orders", return_value=stale_rows) as stale:
        with patch("routers.dashboard.work_orders_repo.list_overloaded_technicians", return_value=[]):
            with patch("routers.dashboard.work_orders_repo.list_property_hotspots", return_value=[]):
                with patch("routers.dashboard.work_orders_repo.list_completion_cycles", return_value=cycle_rows):
                    response = dashboard_router.export_operations_report(
                        stale_days=14,
                        hotspot_days=60,
                        completion_days=120,
                        limit=5,
                        current_user=admin_user,
                        organization={"id": 6},
                    )

    assert stale.call_args.args == (6,)
    assert response.media_type == "text/csv"
    assert "techsync-operations-report.csv" in response.headers["content-disposition"]
    body = response.body.decode("utf-8")
    assert "section,id,title" in body
    assert "stale_work_order,1,Old leak" in body
    assert "completion_cycle" in body
    assert "plumbing,18.5,4.0,36.0" in body


def test_dispatch_board_export_returns_summary_and_lane_csv():
    admin_user = User(
        id=5,
        organization_id=6,
        email="admin@example.com",
        full_name="Admin",
        role="org_admin",
        is_active=True,
    )
    work_rows = [
        {
            "id": 1,
            "title": "Unassigned leak",
            "status": "open",
            "priority": "emergency",
            "assigned_technician_id": None,
            "property_id": 3,
            "property_name": "West Tower",
            "client_id": 9,
            "client_display_name": "Owner A",
            "vendor_id": 11,
            "vendor_name": "Vendor A",
            "created_at": "2026-07-28T00:00:00Z",
            "sla_due_at": None,
        }
    ]
    technician_rows = [
        {
            "id": 8,
            "availability_status": "available",
            "max_daily_jobs": 4,
            "users": {"full_name": "Tech One", "email": "tech@example.com"},
        }
    ]

    with patch("routers.dashboard.work_orders_repo.list_dispatch_board_work_orders", return_value=work_rows) as work_list:
        with patch("routers.dashboard.technicians_repo.list_by_org", return_value=technician_rows):
            response = dashboard_router.export_dispatch_board(
                current_user=admin_user,
                organization={"id": 6},
            )

    assert work_list.call_args.args == (6,)
    assert response.media_type == "text/csv"
    assert "techsync-dispatch-board.csv" in response.headers["content-disposition"]
    body = response.body.decode("utf-8")
    assert "summary,open_count,1" in body
    assert "unassigned_work_order" in body
    assert "technician_lane" in body


def test_client_update_preserves_explicit_null_fields_for_frontend_crud():
    admin_user = User(
        id=5,
        organization_id=6,
        email="admin@example.com",
        full_name="Admin",
        role="org_admin",
        is_active=True,
    )
    updated_row = {
        "id": 9,
        "organization_id": 6,
        "display_name": "Riverside HOA",
        "contact_name": None,
        "email": None,
        "phone": "555-0100",
        "client_type": "homeowner",
        "notes": None,
        "is_active": True,
        "created_at": "2026-07-28T00:00:00Z",
        "updated_at": "2026-07-28T00:00:00Z",
    }

    with patch("routers.clients.clients_repo.get_by_id_in_org", return_value={"id": 9}):
        with patch("routers.clients.clients_repo.update", return_value=updated_row) as update:
            result = clients_router.update_client(
                9,
                ClientUpdate(contact_name=None, email=None),
                current_user=admin_user,
                organization={"id": 6},
            )

    assert update.call_args.args == (9, 6, {"contact_name": None, "email": None})
    assert result.contact_name is None
    assert result.email is None


def test_property_update_can_unlink_client_for_frontend_crud():
    admin_user = User(
        id=5,
        organization_id=6,
        email="admin@example.com",
        full_name="Admin",
        role="org_admin",
        is_active=True,
    )
    updated_row = {
        "id": 3,
        "organization_id": 6,
        "client_id": None,
        "name": "Riverside Tower",
        "address_line1": "1300 Demo Ridge",
        "address_line2": None,
        "city": "Test City",
        "state": "NY",
        "postal_code": "10001",
        "country": "US",
        "unit": "4B",
        "access_notes": None,
        "latitude": None,
        "longitude": None,
        "is_active": True,
        "created_at": "2026-07-28T00:00:00Z",
        "updated_at": "2026-07-28T00:00:00Z",
    }

    with patch("routers.properties.properties_repo.get_by_id_in_org", return_value={"id": 3}):
        with patch("routers.properties.properties_repo.update", return_value=updated_row) as update:
            result = properties_router.update_property(
                3,
                PropertyUpdate(client_id=None),
                current_user=admin_user,
                organization={"id": 6},
            )

    assert update.call_args.args == (3, 6, {"client_id": None})
    assert result.client_id is None


def test_vendor_update_preserves_empty_service_types_for_frontend_crud():
    admin_user = User(
        id=5,
        organization_id=6,
        email="admin@example.com",
        full_name="Admin",
        role="org_admin",
        is_active=True,
    )
    updated_row = {
        "id": 11,
        "organization_id": 6,
        "name": "Apex Demo Plumbing",
        "contact_name": None,
        "email": None,
        "phone": None,
        "service_types": [],
        "coverage_area": None,
        "notes": None,
        "is_active": True,
        "created_at": "2026-07-28T00:00:00Z",
        "updated_at": "2026-07-28T00:00:00Z",
    }

    with patch("routers.vendors.vendors_repo.get_by_id_in_org", return_value={"id": 11}):
        with patch("routers.vendors.vendors_repo.update", return_value=updated_row) as update:
            result = vendors_router.update_vendor(
                11,
                VendorUpdate(service_types=[]),
                current_user=admin_user,
                organization={"id": 6},
            )

    assert update.call_args.args == (11, 6, {"service_types": []})
    assert result.service_types == []


def test_clients_export_returns_tenant_scoped_csv():
    admin_user = User(
        id=5,
        organization_id=6,
        email="admin@example.com",
        full_name="Admin",
        role="org_admin",
        is_active=True,
    )
    rows = [
        {
            "id": 9,
            "organization_id": 6,
            "display_name": "Riverside HOA",
            "contact_name": "Casey Owner",
            "email": "owner@example.com",
            "phone": "555-0100",
            "client_type": "homeowner",
            "notes": "Prefers email",
            "is_active": True,
            "created_at": "2026-07-28T00:00:00Z",
            "updated_at": "2026-07-28T00:00:00Z",
        }
    ]

    with patch("routers.clients.clients_repo.list_by_org", return_value=rows) as list_by_org:
        response = clients_router.export_clients(
            active_only=True,
            current_user=admin_user,
            organization={"id": 6},
        )

    assert list_by_org.call_args.args == (6,)
    assert list_by_org.call_args.kwargs == {"active_only": True}
    assert response.media_type == "text/csv"
    assert "techsync-clients.csv" in response.headers["content-disposition"]
    body = response.body.decode("utf-8")
    assert "id,display_name,contact_name,email" in body
    assert "9,Riverside HOA,Casey Owner,owner@example.com" in body


def test_properties_export_returns_tenant_scoped_csv_with_client_filter():
    admin_user = User(
        id=5,
        organization_id=6,
        email="admin@example.com",
        full_name="Admin",
        role="org_admin",
        is_active=True,
    )
    rows = [
        {
            "id": 3,
            "organization_id": 6,
            "client_id": 9,
            "name": "Riverside Tower",
            "address_line1": "1300 Demo Ridge",
            "address_line2": "",
            "city": "Test City",
            "state": "NY",
            "postal_code": "10001",
            "country": "US",
            "unit": "4B",
            "access_notes": "Gate code is synthetic",
            "latitude": None,
            "longitude": None,
            "is_active": True,
            "created_at": "2026-07-28T00:00:00Z",
            "updated_at": "2026-07-28T00:00:00Z",
        }
    ]

    with patch("routers.properties.properties_repo.list_by_org", return_value=rows) as list_by_org:
        response = properties_router.export_properties(
            client_id=9,
            active_only=True,
            current_user=admin_user,
            organization={"id": 6},
        )

    assert list_by_org.call_args.args == (6,)
    assert list_by_org.call_args.kwargs == {"client_id": 9, "active_only": True}
    assert response.media_type == "text/csv"
    assert "techsync-properties.csv" in response.headers["content-disposition"]
    body = response.body.decode("utf-8")
    assert "id,client_id,name,address_line1" in body
    assert "3,9,Riverside Tower,1300 Demo Ridge" in body


def test_vendors_export_returns_tenant_scoped_csv_and_flattens_services():
    admin_user = User(
        id=5,
        organization_id=6,
        email="admin@example.com",
        full_name="Admin",
        role="org_admin",
        is_active=True,
    )
    rows = [
        {
            "id": 11,
            "organization_id": 6,
            "name": "Apex Demo Plumbing",
            "contact_name": "Jordan Vendor",
            "email": "vendor@example.com",
            "phone": "555-0120",
            "service_types": ["plumbing", "emergency"],
            "coverage_area": "Downtown",
            "notes": "Synthetic partner",
            "is_active": True,
            "created_at": "2026-07-28T00:00:00Z",
            "updated_at": "2026-07-28T00:00:00Z",
        }
    ]

    with patch("routers.vendors.vendors_repo.list_by_org", return_value=rows) as list_by_org:
        response = vendors_router.export_vendors(
            active_only=True,
            current_user=admin_user,
            organization={"id": 6},
        )

    assert list_by_org.call_args.args == (6,)
    assert list_by_org.call_args.kwargs == {"active_only": True}
    assert response.media_type == "text/csv"
    assert "techsync-vendors.csv" in response.headers["content-disposition"]
    body = response.body.decode("utf-8")
    assert "id,name,contact_name,email" in body
    assert "11,Apex Demo Plumbing,Jordan Vendor,vendor@example.com" in body
    assert "plumbing; emergency" in body


def test_work_order_update_can_clear_entity_links_for_frontend_form():
    admin_user = User(
        id=5,
        organization_id=6,
        email="admin@example.com",
        full_name="Admin",
        role="org_admin",
        is_active=True,
    )
    updated_row = {
        "id": 1,
        "organization_id": 6,
        "title": "Kitchen leak",
        "description": None,
        "property_id": None,
        "client_id": None,
        "vendor_id": None,
        "customer_name": None,
        "address": None,
        "latitude": None,
        "longitude": None,
        "service_type": "plumbing",
        "priority": "high",
        "status": "open",
        "assigned_technician_id": None,
        "created_by": 5,
        "source": "manual",
        "external_ref": None,
        "sla_due_at": None,
        "completed_at": None,
        "completion_notes": None,
        "completion_proof_verified_at": None,
        "completion_override_reason": None,
        "client_approval_status": "not_required",
        "client_approval_requested_at": None,
        "client_approval_requested_by": None,
        "client_approval_decision_at": None,
        "client_approval_decision_by": None,
        "client_approval_notes": None,
        "created_at": "2026-07-28T00:00:00Z",
        "updated_at": "2026-07-28T00:00:00Z",
    }

    with patch("routers.work_orders.work_orders_repo.get_by_id_in_org", return_value={"id": 1}):
        with patch("routers.work_orders.work_orders_repo.update", return_value=updated_row) as update:
            result = work_orders_router.update_work_order(
                1,
                WorkOrderUpdate(property_id=None, client_id=None, vendor_id=None),
                current_user=admin_user,
                organization={"id": 6},
            )

    assert update.call_args.args == (
        1,
        6,
        {"property_id": None, "client_id": None, "vendor_id": None},
    )
    assert result.property_id is None
    assert result.client_id is None
    assert result.vendor_id is None
