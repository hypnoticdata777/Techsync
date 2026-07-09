"""
Centralized environment configuration for the TechSync API.
"""

import os


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


class Settings:
    APP_ENV: str = APP_ENV
    IS_PRODUCTION: bool = IS_PRODUCTION

    SUPABASE_URL: str | None = os.getenv("SUPABASE_URL")
    SUPABASE_KEY: str | None = os.getenv("SUPABASE_KEY")

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
    STRIPE_SUCCESS_URL: str | None = os.getenv("STRIPE_SUCCESS_URL") or _default_url("/billing/success")
    STRIPE_CANCEL_URL: str | None = os.getenv("STRIPE_CANCEL_URL") or _default_url("/billing/cancel")

    CORS_ORIGINS: list[str] = _csv_env("CORS_ORIGINS", "" if IS_PRODUCTION else DEV_CORS_ORIGINS)


def _validate_settings(value: Settings) -> None:
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


settings = Settings()
_validate_settings(settings)