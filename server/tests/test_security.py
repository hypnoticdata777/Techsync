import pytest

from core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_opaque_token,
    get_password_hash,
    hash_opaque_token,
    validate_password_strength,
    verify_password,
)


def test_password_hash_roundtrip():
    hashed = get_password_hash("Password123")
    assert hashed != "Password123"
    assert verify_password("Password123", hashed)
    assert not verify_password("WrongPassword1", hashed)


def test_access_token_roundtrip():
    token = create_access_token(user_id=1, email="a@example.com", organization_id=5, role="org_admin")
    payload = decode_token(token, expected_type="access")
    assert payload is not None
    assert payload["user_id"] == 1
    assert payload["organization_id"] == 5
    assert payload["role"] == "org_admin"
    assert payload["type"] == "access"


def test_refresh_token_cannot_be_used_as_access_token():
    refresh = create_refresh_token(user_id=1, email="a@example.com", organization_id=5)
    assert decode_token(refresh, expected_type="access") is None
    assert decode_token(refresh, expected_type="refresh") is not None


def test_access_token_cannot_be_used_as_refresh_token():
    access = create_access_token(user_id=1, email="a@example.com", organization_id=5, role="technician")
    assert decode_token(access, expected_type="refresh") is None


def test_garbage_token_rejected():
    assert decode_token("not-a-real-token", expected_type="access") is None


@pytest.mark.parametrize(
    "password",
    ["short1", "nodigitshere", "12345678", ""],
)
def test_weak_passwords_rejected(password):
    with pytest.raises(ValueError):
        validate_password_strength(password)


def test_strong_password_accepted():
    assert validate_password_strength("GoodPass123") == "GoodPass123"


def test_opaque_token_hash_is_deterministic_and_not_reversible():
    raw = generate_opaque_token()
    hash1 = hash_opaque_token(raw)
    hash2 = hash_opaque_token(raw)
    assert hash1 == hash2
    assert hash1 != raw
