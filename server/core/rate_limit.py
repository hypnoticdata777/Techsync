"""Simple in-process rate limiting for public abuse-prone endpoints."""

from __future__ import annotations

import math
import time
from dataclasses import dataclass
from threading import Lock
from typing import Callable

from fastapi import HTTPException, Request, status

from core.config import settings


@dataclass(frozen=True)
class RateLimitRule:
    name: str
    max_requests: int
    window_seconds: int


@dataclass(frozen=True)
class RateLimitDecision:
    allowed: bool
    retry_after_seconds: int
    remaining: int


class InMemoryRateLimiter:
    """Fixed-window limiter scoped to this API process.

    This is intentionally small and dependency-free for the hosted POC. A
    multi-instance deployment should replace it with a shared store such as
    Redis or enforce equivalent limits at the edge/reverse proxy.
    """

    def __init__(self, clock: Callable[[], float] | None = None):
        self._clock = clock or time.monotonic
        self._lock = Lock()
        self._windows: dict[tuple[str, str], tuple[float, int]] = {}

    def check(self, rule: RateLimitRule, key: str) -> RateLimitDecision:
        if rule.max_requests <= 0 or rule.window_seconds <= 0:
            return RateLimitDecision(allowed=True, retry_after_seconds=0, remaining=0)

        now = self._clock()
        storage_key = (rule.name, key)
        with self._lock:
            window_start, count = self._windows.get(storage_key, (now, 0))
            elapsed = now - window_start
            if elapsed >= rule.window_seconds:
                window_start = now
                count = 0

            if count >= rule.max_requests:
                retry_after = max(1, math.ceil(rule.window_seconds - elapsed))
                return RateLimitDecision(
                    allowed=False,
                    retry_after_seconds=retry_after,
                    remaining=0,
                )

            count += 1
            self._windows[storage_key] = (window_start, count)
            return RateLimitDecision(
                allowed=True,
                retry_after_seconds=0,
                remaining=max(0, rule.max_requests - count),
            )

    def reset(self) -> None:
        with self._lock:
            self._windows.clear()


rate_limiter = InMemoryRateLimiter()

LOGIN_RATE_LIMIT = RateLimitRule(
    "auth.login",
    settings.RATE_LIMIT_LOGIN_MAX,
    settings.RATE_LIMIT_LOGIN_WINDOW_SECONDS,
)
PASSWORD_RESET_RATE_LIMIT = RateLimitRule(
    "auth.password_reset",
    settings.RATE_LIMIT_PASSWORD_RESET_MAX,
    settings.RATE_LIMIT_PASSWORD_RESET_WINDOW_SECONDS,
)
ONBOARD_RATE_LIMIT = RateLimitRule(
    "organizations.onboard",
    settings.RATE_LIMIT_ONBOARD_MAX,
    settings.RATE_LIMIT_ONBOARD_WINDOW_SECONDS,
)
INVITATION_ACCEPT_RATE_LIMIT = RateLimitRule(
    "invitations.accept",
    settings.RATE_LIMIT_INVITATION_ACCEPT_MAX,
    settings.RATE_LIMIT_INVITATION_ACCEPT_WINDOW_SECONDS,
)


def _client_identifier(request: Request) -> str:
    if settings.RATE_LIMIT_TRUST_PROXY_HEADERS:
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",", 1)[0].strip()
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip.strip()

    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def enforce_rate_limit(request: Request, rule: RateLimitRule) -> None:
    if not settings.RATE_LIMIT_ENABLED:
        return

    decision = rate_limiter.check(rule, _client_identifier(request))
    if decision.allowed:
        return

    raise HTTPException(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        detail="Too many requests. Please try again later.",
        headers={"Retry-After": str(decision.retry_after_seconds)},
    )


def rate_limit_dependency(rule: RateLimitRule):
    def dependency(request: Request) -> None:
        enforce_rate_limit(request, rule)

    return dependency