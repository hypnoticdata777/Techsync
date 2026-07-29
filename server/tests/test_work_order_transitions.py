import pytest

from models.work_order import ALLOWED_STATUS_TRANSITIONS
from services import work_order_service


@pytest.mark.parametrize(
    "from_status,to_status",
    [
        ("open", "in_progress"),
        ("open", "paused"),
        ("open", "escalated"),
        ("open", "cancelled"),
        ("open", "archived"),
        ("in_progress", "completed"),
        ("in_progress", "paused"),
        ("in_progress", "escalated"),
        ("in_progress", "cancelled"),
        ("in_progress", "open"),
        ("in_progress", "archived"),
        ("paused", "open"),
        ("paused", "in_progress"),
        ("paused", "escalated"),
        ("paused", "cancelled"),
        ("paused", "archived"),
        ("escalated", "in_progress"),
        ("escalated", "paused"),
        ("escalated", "completed"),
        ("escalated", "cancelled"),
        ("escalated", "archived"),
        ("completed", "archived"),
        ("cancelled", "archived"),
    ],
)
def test_allowed_transitions(from_status, to_status):
    assert to_status in ALLOWED_STATUS_TRANSITIONS[from_status]


@pytest.mark.parametrize(
    "from_status,to_status",
    [
        ("open", "completed"),
        ("completed", "open"),
        ("completed", "in_progress"),
        ("completed", "cancelled"),
        ("cancelled", "open"),
        ("cancelled", "completed"),
        ("archived", "open"),
        ("archived", "in_progress"),
        ("archived", "completed"),
    ],
)
def test_disallowed_transitions(from_status, to_status):
    assert to_status not in ALLOWED_STATUS_TRANSITIONS[from_status]


def test_archived_is_terminal():
    assert ALLOWED_STATUS_TRANSITIONS["archived"] == set()


def test_completion_requires_proof_or_override(monkeypatch):
    monkeypatch.setattr(
        work_order_service.work_orders_repo,
        "get_by_id_in_org",
        lambda work_order_id, organization_id: {"id": work_order_id, "status": "in_progress"},
    )
    monkeypatch.setattr(work_order_service.attachments_repo, "has_for_work_order", lambda *_: False)

    with pytest.raises(work_order_service.CompletionProofRequired):
        work_order_service.transition_status(
            organization_id=1,
            work_order_id=2,
            new_status="completed",
            actor_user_id=3,
            actor_role="technician",
            notes=None,
        )


def test_completion_with_attachment_sets_proof_timestamp(monkeypatch):
    updated_patch = {}

    monkeypatch.setattr(
        work_order_service.work_orders_repo,
        "get_by_id_in_org",
        lambda work_order_id, organization_id: {"id": work_order_id, "status": "in_progress"},
    )
    monkeypatch.setattr(work_order_service.attachments_repo, "has_for_work_order", lambda *_: True)

    def fake_update(work_order_id, organization_id, patch):
        updated_patch.update(patch)
        return {"id": work_order_id, "organization_id": organization_id, **patch}

    monkeypatch.setattr(work_order_service.work_orders_repo, "update", fake_update)
    monkeypatch.setattr(work_order_service.events_repo, "create_event", lambda *args, **kwargs: {})

    row = work_order_service.transition_status(
        organization_id=1,
        work_order_id=2,
        new_status="completed",
        actor_user_id=3,
        actor_role="technician",
        notes="done",
    )

    assert row["status"] == "completed"
    assert updated_patch["completion_proof_verified_at"]
    assert updated_patch["completion_override_reason"] is None
    assert updated_patch["completion_notes"] == "done"


def test_manager_override_allows_completion_without_attachment(monkeypatch):
    updated_patch = {}
    event_payload = {}

    monkeypatch.setattr(
        work_order_service.work_orders_repo,
        "get_by_id_in_org",
        lambda work_order_id, organization_id: {"id": work_order_id, "status": "in_progress"},
    )
    monkeypatch.setattr(work_order_service.attachments_repo, "has_for_work_order", lambda *_: False)

    def fake_update(work_order_id, organization_id, patch):
        updated_patch.update(patch)
        return {"id": work_order_id, "organization_id": organization_id, **patch}

    def fake_event(*args, **kwargs):
        event_payload.update(kwargs)
        return {}

    monkeypatch.setattr(work_order_service.work_orders_repo, "update", fake_update)
    monkeypatch.setattr(work_order_service.events_repo, "create_event", fake_event)

    work_order_service.transition_status(
        organization_id=1,
        work_order_id=2,
        new_status="completed",
        actor_user_id=3,
        actor_role="coordinator",
        notes="done",
        completion_override_reason="Technician completed in person before photo policy existed",
    )

    assert updated_patch["completion_override_reason"].startswith("Technician completed")
    assert updated_patch["completion_proof_verified_at"] is None
    assert event_payload["notes"].startswith("Completion override:")


def test_technician_override_is_not_allowed(monkeypatch):
    monkeypatch.setattr(
        work_order_service.work_orders_repo,
        "get_by_id_in_org",
        lambda work_order_id, organization_id: {"id": work_order_id, "status": "in_progress"},
    )
    monkeypatch.setattr(work_order_service.attachments_repo, "has_for_work_order", lambda *_: False)

    with pytest.raises(work_order_service.CompletionOverrideNotAllowed):
        work_order_service.transition_status(
            organization_id=1,
            work_order_id=2,
            new_status="completed",
            actor_user_id=3,
            actor_role="technician",
            notes=None,
            completion_override_reason="No photo available",
        )


def test_archive_requires_manager_role(monkeypatch):
    monkeypatch.setattr(
        work_order_service.work_orders_repo,
        "get_by_id_in_org",
        lambda work_order_id, organization_id: {"id": work_order_id, "status": "completed"},
    )

    with pytest.raises(work_order_service.ArchiveNotAllowed):
        work_order_service.transition_status(
            organization_id=1,
            work_order_id=2,
            new_status="archived",
            actor_user_id=3,
            actor_role="technician",
            notes=None,
        )


def test_manager_can_archive_completed_work(monkeypatch):
    updated_patch = {}
    event_payload = {}

    monkeypatch.setattr(
        work_order_service.work_orders_repo,
        "get_by_id_in_org",
        lambda work_order_id, organization_id: {"id": work_order_id, "status": "completed"},
    )

    def fake_update(work_order_id, organization_id, patch):
        updated_patch.update(patch)
        return {"id": work_order_id, "organization_id": organization_id, **patch}

    def fake_event(*args, **kwargs):
        event_payload.update(kwargs)
        return {}

    monkeypatch.setattr(work_order_service.work_orders_repo, "update", fake_update)
    monkeypatch.setattr(work_order_service.events_repo, "create_event", fake_event)

    work_order_service.transition_status(
        organization_id=1,
        work_order_id=2,
        new_status="archived",
        actor_user_id=3,
        actor_role="coordinator",
        notes="Retained for historical record",
    )

    assert updated_patch["status"] == "archived"
    assert event_payload["to_status"] == "archived"
