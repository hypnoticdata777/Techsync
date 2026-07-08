"""
Centralized environment configuration for the TechSync API.
"""

import os


class Settings:
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
    STRIPE_SUCCESS_URL: str = os.getenv("STRIPE_SUCCESS_URL", "https://example.com/billing/success")
    STRIPE_CANCEL_URL: str = os.getenv("STRIPE_CANCEL_URL", "https://example.com/billing/cancel")

    CORS_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:8081,http://localhost:19000,http://localhost:19001,"
            "http://localhost:19002,http://localhost:3000,http://127.0.0.1:8081,"
            "http://127.0.0.1:19000,http://127.0.0.1:19001,http://127.0.0.1:19002,"
            "http://127.0.0.1:3000",
        ).split(",")
        if origin.strip()
    ]


settings = Settings()
