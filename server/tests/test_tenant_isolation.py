"""
Verifies that repository operations keep tenant scoping in the application
layer (RF-05/RNF-05). With direct Postgres access, organization_id filters are
the primary enforcement path, so these tests assert that repository SQL/helper
calls carry the caller's organization_id.
"""

from unittest.mock import patch

from repositories import technicians as technicians_repo
from repositories import users as users_repo
from repositories import work_order_events as events_repo
from repositories import work_orders as work_orders_repo


def test_list_filtered_scopes_by_organization_id():
    with patch("repositories.work_orders.fetch_all", return_value=[]) as mock_fetch:
        work_orders_repo.list_filtered(organization_id=42)

    sql, params = mock_fetch.call_args.args
    assert "organization_id = :organization_id" in sql
    assert params["organization_id"] == 42


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


def test_events_are_written_with_org_id():
    with patch("repositories.work_order_events.insert_row") as mock_insert:
        mock_insert.side_effect = lambda table, payload: payload
        event = events_repo.create_event(organization_id=6, work_order_id=1, event_type="created")

    table, payload = mock_insert.call_args.args
    assert table == "work_order_events"
    assert payload["organization_id"] == 6
    assert payload["work_order_id"] == 1
    assert event["organization_id"] == 6
