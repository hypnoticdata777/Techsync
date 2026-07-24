import importlib
import sys

import pytest


CONFIG_ENV_NAMES = [
    "APP_ENV",
    "DATABASE_URL",
    "JWT_SECRET_KEY",
    "CORS_ORIGINS",
    "STRIPE_SECRET_KEY",
    "STRIPE_PRICE_ID",
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_SUCCESS_URL",
    "STRIPE_CANCEL_URL",
    "APP_BASE_URL",
    "EMAIL_DELIVERY_METHOD",
    "EMAIL_FROM",
    "SMTP_HOST",
    "SMTP_USERNAME",
    "SMTP_PASSWORD",
    "STORAGE_BUCKET",
    "STORAGE_ENDPOINT_URL",
    "STORAGE_ACCESS_KEY_ID",
    "STORAGE_SECRET_ACCESS_KEY",
    "STORAGE_PUBLIC_BASE_URL",
]


def _reload_config(monkeypatch, values):
    for name in CONFIG_ENV_NAMES:
        monkeypatch.delenv(name, raising=False)
    for name, value in values.items():
        monkeypatch.setenv(name, value)

    module = importlib.import_module("core.config")
    return importlib.reload(module)


@pytest.fixture(autouse=True)
def restore_development_config(monkeypatch):
    yield
    for name in CONFIG_ENV_NAMES:
        monkeypatch.delenv(name, raising=False)
    monkeypatch.setenv("JWT_SECRET_KEY", "test-secret-key-for-pytest-only")
    if "core.config" in sys.modules:
        importlib.reload(sys.modules["core.config"])


def hosted_base_env() -> dict[str, str]:
    return {
        "APP_ENV": "demo",
        "DATABASE_URL": "postgresql://demo:demo@example.neon.tech/techsync?sslmode=require",
        "JWT_SECRET_KEY": "demo-jwt-secret",
        "CORS_ORIGINS": "https://portfolio.example.com",
        "STRIPE_SUCCESS_URL": "https://portfolio.example.com/billing/success",
        "STRIPE_CANCEL_URL": "https://portfolio.example.com/billing/cancel",
        "APP_BASE_URL": "https://portfolio.example.com",
    }


def production_env() -> dict[str, str]:
    values = hosted_base_env()
    values.update(
        {
            "APP_ENV": "production",
            "EMAIL_DELIVERY_METHOD": "smtp",
            "EMAIL_FROM": "TechSync <no-reply@example.com>",
            "SMTP_HOST": "smtp.example.com",
            "SMTP_USERNAME": "smtp-user",
            "SMTP_PASSWORD": "smtp-password",
            "STORAGE_BUCKET": "work-order-attachments",
            "STORAGE_ACCESS_KEY_ID": "storage-key-id",
            "STORAGE_SECRET_ACCESS_KEY": "storage-secret",
            "STORAGE_PUBLIC_BASE_URL": "https://files.example.com/work-order-attachments",
        }
    )
    return values


def test_demo_mode_requires_hosted_core_settings_but_not_smtp_or_storage(monkeypatch):
    config = _reload_config(monkeypatch, hosted_base_env())

    assert config.settings.IS_HOSTED
    assert config.settings.IS_HOSTED_DEMO
    assert not config.settings.IS_PRODUCTION
    assert config.settings.EMAIL_DELIVERY_METHOD == "log"
    assert config.settings.STORAGE_BUCKET is None


def test_demo_mode_rejects_localhost_cors(monkeypatch):
    values = hosted_base_env()
    values["CORS_ORIGINS"] = "http://localhost:3000"

    with pytest.raises(ValueError, match="CORS_ORIGINS"):
        _reload_config(monkeypatch, values)


def test_demo_mode_requires_https_urls(monkeypatch):
    values = hosted_base_env()
    values["APP_BASE_URL"] = "http://portfolio.example.com"

    with pytest.raises(ValueError, match="APP_BASE_URL must use https"):
        _reload_config(monkeypatch, values)


def test_demo_mode_requires_complete_storage_when_storage_is_partially_configured(monkeypatch):
    values = hosted_base_env()
    values["STORAGE_BUCKET"] = "work-order-attachments"

    with pytest.raises(ValueError, match="STORAGE_ACCESS_KEY_ID"):
        _reload_config(monkeypatch, values)


def test_production_still_requires_smtp_and_storage(monkeypatch):
    values = hosted_base_env()
    values["APP_ENV"] = "production"

    with pytest.raises(ValueError) as exc:
        _reload_config(monkeypatch, values)

    message = str(exc.value)
    assert "EMAIL_FROM" in message
    assert "SMTP_HOST" in message
    assert "SMTP_PASSWORD" in message
    assert "SMTP_USERNAME" in message
    assert "STORAGE_ACCESS_KEY_ID" in message
    assert "STORAGE_BUCKET" in message
    assert "STORAGE_PUBLIC_BASE_URL" in message
    assert "STORAGE_SECRET_ACCESS_KEY" in message


def test_production_rejects_non_smtp_email_delivery(monkeypatch):
    values = production_env()
    values["EMAIL_DELIVERY_METHOD"] = "log"

    with pytest.raises(ValueError, match="EMAIL_DELIVERY_METHOD=smtp"):
        _reload_config(monkeypatch, values)


def test_production_accepts_full_required_settings(monkeypatch):
    config = _reload_config(monkeypatch, production_env())

    assert config.settings.IS_PRODUCTION
    assert config.settings.IS_HOSTED
