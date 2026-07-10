"""
Centralized environment configuration for the TechSync API.
"""

import os
from urllib.parse import urlparse


APP_ENV = os.getenv("APP_ENV", "development").strip().lower()
IS_PRODUCTION = APP_ENV in {"prod", "production"}

DEV_CORS_ORIGINS = (
    "http://localhost:8081,http://localhost:19000,http://localhost:19001,"
    "http://localhost:19002,http://localhost:19006,http://localhost:3000,"
    "http://127.0.0.1:8081,http://127.0.0.1:19000,http://127.0.0.1:19001,"
    "http://127.0.0.1:19002,http://127.0.0.1:19006,http://127.0.0.1:3000"
)


def _csv_env(name: str, default: str = "") -> list[str]:
    return [value.strip() for value in os.getenv(name, default).split(",") if value.strip()]


def _default_url(path: str) -> str | None:
    if IS_PRODUCTION:
        return None
    return f"http://localhost:3000{path}"


def _bool_env(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


class Settings:
    APP_ENV: str = APP_ENV
    IS_PRODUCTION: bool = IS_PRODUCTION

    SUPABASE_URL: str | None = os.getenv("SUPABASE_URL")
    SUPABASE_KEY: str | None = os.getenv("SUPABASE_KEY")
    SUPABASE_ATTACHMENTS_BUCKET: str = os.getenv("SUPABASE_ATTACHMENTS_BUCKET", "work-order-attachments")
    ATTACHMENT_MAX_BYTES: int = int(os.getenv("ATTACHMENT_MAX_BYTES", str(10 * 1024 * 1024)))

    JWT_SECRET_KEY: str | None = os.getenv("JWT_SECRET_KEY")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
    REFRESH_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_MINUTES", str(60 * 24 * 7)))
    RESET_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("RESET_TOKEN_EXPIRE_MINUTES", "60"))
    INVITE_EXPIRE_HOURS: int = int(os.getenv("INVITE_EXPIRE_HOURS", "48"))

    TRIAL_LENGTH_DAYS: int = int(os.getenv("TRIAL_LENGTH_DAYS", "14"))
    DEFAULT_TECHNICIAN_LIMIT: int = int(os.getenv("DEFAULT_TECHNICIAN_LIMIT", "3"))

    STRIPE_SECRET_KEY: str | None = os.getenv("STRIPE_SECRET_KEY")
    STRIPE_PRICE_ID: str | None = os.getenv("STRIPE_PRICE_ID")
    STRIPE_WEBHOOK_SECRET: str | None = os.getenv("STRIPE_WEBHOOK_SECRET")
    STRIPE_SUCCESS_URL: str | None = os.getenv("STRIPE_SUCCESS_URL") or _default_url("/billing/success")
    STRIPE_CANCEL_URL: str | None = os.getenv("STRIPE_CANCEL_URL") or _default_url("/billing/cancel")

    CORS_ORIGINS: list[str] = _csv_env("CORS_ORIGINS", "" if IS_PRODUCTION else DEV_CORS_ORIGINS)

    APP_BASE_URL: str | None = os.getenv("APP_BASE_URL") or (None if IS_PRODUCTION else "http://localhost:19006")
    EMAIL_DELIVERY_METHOD: str = os.getenv(
        "EMAIL_DELIVERY_METHOD", "smtp" if IS_PRODUCTION else "log"
    ).strip().lower()
    EMAIL_FROM: str | None = os.getenv("EMAIL_FROM")
    SMTP_HOST: str | None = os.getenv("SMTP_HOST")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME: str | None = os.getenv("SMTP_USERNAME")
    SMTP_PASSWORD: str | None = os.getenv("SMTP_PASSWORD")
    SMTP_USE_TLS: bool = _bool_env("SMTP_USE_TLS", True)

    RATE_LIMIT_ENABLED: bool = _bool_env("RATE_LIMIT_ENABLED", True)
    RATE_LIMIT_TRUST_PROXY_HEADERS: bool = _bool_env("RATE_LIMIT_TRUST_PROXY_HEADERS", False)
    RATE_LIMIT_LOGIN_MAX: int = int(os.getenv("RATE_LIMIT_LOGIN_MAX", "5"))
    RATE_LIMIT_LOGIN_WINDOW_SECONDS: int = int(os.getenv("RATE_LIMIT_LOGIN_WINDOW_SECONDS", "60"))
    RATE_LIMIT_PASSWORD_RESET_MAX: int = int(os.getenv("RATE_LIMIT_PASSWORD_RESET_MAX", "3"))
    RATE_LIMIT_PASSWORD_RESET_WINDOW_SECONDS: int = int(os.getenv("RATE_LIMIT_PASSWORD_RESET_WINDOW_SECONDS", "300"))
    RATE_LIMIT_ONBOARD_MAX: int = int(os.getenv("RATE_LIMIT_ONBOARD_MAX", "3"))
    RATE_LIMIT_ONBOARD_WINDOW_SECONDS: int = int(os.getenv("RATE_LIMIT_ONBOARD_WINDOW_SECONDS", "300"))
    RATE_LIMIT_INVITATION_ACCEPT_MAX: int = int(os.getenv("RATE_LIMIT_INVITATION_ACCEPT_MAX", "10"))
    RATE_LIMIT_INVITATION_ACCEPT_WINDOW_SECONDS: int = int(os.getenv("RATE_LIMIT_INVITATION_ACCEPT_WINDOW_SECONDS", "300"))


def _validate_public_https_url(name: str, url: str | None) -> None:
    if not url:
        return
    parsed = urlparse(url)
    if parsed.scheme != "https":
        raise ValueError(f"{name} must use https when APP_ENV=production")
    if parsed.hostname in {"localhost", "127.0.0.1"}:
        raise ValueError(f"{name} must not point to localhost when APP_ENV=production")


def _validate_settings(value: Settings) -> None:
    if value.EMAIL_DELIVERY_METHOD not in {"log", "smtp"}:
        raise ValueError("EMAIL_DELIVERY_METHOD must be either 'log' or 'smtp'")

    if not value.IS_PRODUCTION:
        return

    missing = []
    if not value.SUPABASE_URL:
        missing.append("SUPABASE_URL")
    if not value.SUPABASE_KEY:
        missing.append("SUPABASE_KEY")
    if not value.JWT_SECRET_KEY:
        missing.append("JWT_SECRET_KEY")
    if not value.CORS_ORIGINS:
        missing.append("CORS_ORIGINS")
    if not value.STRIPE_SUCCESS_URL:
        missing.append("STRIPE_SUCCESS_URL")
    if not value.STRIPE_CANCEL_URL:
        missing.append("STRIPE_CANCEL_URL")
    if (value.STRIPE_SECRET_KEY or value.STRIPE_PRICE_ID) and not value.STRIPE_WEBHOOK_SECRET:
        missing.append("STRIPE_WEBHOOK_SECRET")
    if not value.APP_BASE_URL:
        missing.append("APP_BASE_URL")
    if not value.EMAIL_FROM:
        missing.append("EMAIL_FROM")

    if value.EMAIL_DELIVERY_METHOD != "smtp":
        missing.append("EMAIL_DELIVERY_METHOD=smtp")
    if not value.SMTP_HOST:
        missing.append("SMTP_HOST")
    if not value.SMTP_USERNAME:
        missing.append("SMTP_USERNAME")
    if not value.SMTP_PASSWORD:
        missing.append("SMTP_PASSWORD")

    if missing:
        raise ValueError(
            "Missing required production settings: " + ", ".join(sorted(missing))
        )

    local_origins = [
        origin
        for origin in value.CORS_ORIGINS
        if "localhost" in origin or "127.0.0.1" in origin
    ]
    if local_origins:
        raise ValueError(
            "CORS_ORIGINS must not include localhost values when APP_ENV=production: "
            + ", ".join(local_origins)
        )

    _validate_public_https_url("APP_BASE_URL", value.APP_BASE_URL)
    _validate_public_https_url("STRIPE_SUCCESS_URL", value.STRIPE_SUCCESS_URL)
    _validate_public_https_url("STRIPE_CANCEL_URL", value.STRIPE_CANCEL_URL)


settings = Settings()
_validate_settings(settings)
