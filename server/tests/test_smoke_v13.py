import importlib.util
import sys
import types
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPT_PATH = REPO_ROOT / "scripts" / "smoke_v13.py"
SPEC = importlib.util.spec_from_file_location("smoke_v13", SCRIPT_PATH)
smoke_v13 = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = smoke_v13
SPEC.loader.exec_module(smoke_v13)


def test_hash_opaque_token_is_stable_and_not_raw():
    token_hash = smoke_v13.hash_opaque_token("synthetic-token")

    assert token_hash == smoke_v13.hash_opaque_token("synthetic-token")
    assert token_hash != "synthetic-token"
    assert len(token_hash) == 64


def test_known_client_invitation_insert_hashes_raw_token(monkeypatch):
    captured = {}

    class FakeCursor:
        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, traceback):
            return False

        def execute(self, sql, params):
            captured["sql"] = sql
            captured["params"] = params

        def fetchone(self):
            return [42]

    class FakeConnection:
        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, traceback):
            return False

        def cursor(self):
            return FakeCursor()

    fake_psycopg2 = types.SimpleNamespace(connect=lambda database_url: FakeConnection())
    monkeypatch.setitem(sys.modules, "psycopg2", fake_psycopg2)

    invitation_id = smoke_v13.create_known_client_invitation(
        database_url="postgresql://example.invalid/demo",
        organization_id=7,
        email="client@example.dev",
        invited_by=3,
        raw_token="raw-invite-token",
    )

    assert invitation_id == 42
    assert "INSERT INTO invitations" in captured["sql"]
    assert "make_interval(hours => %s)" in captured["sql"]
    assert captured["params"][0:2] == (7, "client@example.dev")
    assert captured["params"][2] == smoke_v13.hash_opaque_token("raw-invite-token")
    assert captured["params"][2] != "raw-invite-token"
    assert captured["params"][3:] == (3, smoke_v13.INVITE_EXPIRE_HOURS)
