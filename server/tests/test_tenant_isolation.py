"""
Verifies that every repository query is scoped by organization_id (RF-05,
RNF-05) at the application layer -- the primary enforcement layer for this
POC, backed by the RLS policies in schema.sql as a database-level backstop
(see server/tests/test_rls... exercised manually against Postgres, and
schema.sql's policy comments for how that layer works).

These tests fake the supabase-py query builder chain and assert that
`.eq("organization_id", ...)` is always called with the caller's org id,
never with any other tenant's id.
"""

from unittest.mock import MagicMock, patch

from repositories import technicians as technicians_repo
from repositories import users as users_repo
from repositories import work_order_events as events_repo
from repositories import work_orders as work_orders_repo


class FakeQuery:
    """Minimal stand-in for the supabase-py fluent query builder that records
    every .eq()/.filter() call so tests can assert on them."""

    def __init__(self, table_name, store):
        self.table_name = table_name
        self.store = store
        self.calls = []

    def select(self, *args, **kwargs):
        return self

    def insert(self, *args, **kwargs):
        self.calls.append(("insert", args, kwargs))
        return self

    def update(self, *args, **kwargs):
        self.calls.append(("update", args, kwargs))
        return self

    def eq(self, field, value):
        self.calls.append(("eq", field, value))
        return self

    def ilike(self, *args, **kwargs):
        return self

    def gte(self, *args, **kwargs):
        return self

    def lte(self, *args, **kwargs):
        return self

    def in_(self, *args, **kwargs):
        return self

    def is_(self, *args, **kwargs):
        return self

    def order(self, *args, **kwargs):
        return self

    def execute(self):
        response = MagicMock()
        response.data = []
        response.count = 0
        return response


class FakeSupabaseClient:
    def __init__(self):
        self.queries: list[FakeQuery] = []

    def table(self, name):
        q = FakeQuery(name, self)
        self.queries.append(q)
        return q


def _eq_calls(query: FakeQuery):
    return [(field, value) for kind, field, value in query.calls if kind == "eq"]


@patch("repositories.work_orders.get_supabase_client")
def test_list_filtered_scopes_by_organization_id(mock_get_client):
    fake_client = FakeSupabaseClient()
    mock_get_client.return_value = fake_client

    work_orders_repo.list_filtered(organization_id=42)

    query = fake_client.queries[-1]
    assert ("organization_id", 42) in _eq_calls(query)


@patch("repositories.work_orders.get_supabase_client")
def test_get_by_id_in_org_always_filters_by_caller_org_not_just_row_id(mock_get_client):
    fake_client = FakeSupabaseClient()
    mock_get_client.return_value = fake_client

    work_orders_repo.get_by_id_in_org(work_order_id=99, organization_id=7)

    query = fake_client.queries[-1]
    calls = _eq_calls(query)
    assert ("id", 99) in calls
    assert ("organization_id", 7) in calls


@patch("repositories.work_orders.get_supabase_client")
def test_update_requires_both_id_and_organization_id(mock_get_client):
    fake_client = FakeSupabaseClient()
    mock_get_client.return_value = fake_client

    work_orders_repo.update(work_order_id=5, organization_id=3, patch={"status": "completed"})

    query = fake_client.queries[-1]
    calls = _eq_calls(query)
    assert ("id", 5) in calls
    assert ("organization_id", 3) in calls


@patch("repositories.users.get_supabase_client")
def test_users_list_by_org_is_scoped(mock_get_client):
    fake_client = FakeSupabaseClient()
    mock_get_client.return_value = fake_client

    users_repo.list_by_org(organization_id=11)

    query = fake_client.queries[-1]
    assert ("organization_id", 11) in _eq_calls(query)


@patch("repositories.technicians.get_supabase_client")
def test_technicians_get_by_id_scoped_to_org(mock_get_client):
    fake_client = FakeSupabaseClient()
    mock_get_client.return_value = fake_client

    technicians_repo.get_by_id_in_org(technician_id=8, organization_id=2)

    query = fake_client.queries[-1]
    calls = _eq_calls(query)
    assert ("id", 8) in calls
    assert ("organization_id", 2) in calls


@patch("repositories.work_order_events.get_supabase_client")
def test_events_are_written_with_org_id(mock_get_client):
    class InsertingFakeQuery(FakeQuery):
        def execute(self):
            response = MagicMock()
            inserted_payload = self.calls[0][1][0]
            response.data = [inserted_payload]
            return response

    fake_client = FakeSupabaseClient()
    fake_client.table = lambda name: InsertingFakeQuery(name, fake_client)
    mock_get_client.return_value = fake_client

    event = events_repo.create_event(organization_id=6, work_order_id=1, event_type="created")

    assert event["organization_id"] == 6
    assert event["work_order_id"] == 1
