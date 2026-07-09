from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from core import rate_limit
from core.rate_limit import InMemoryRateLimiter, RateLimitRule, enforce_rate_limit


class FakeClock:
    def __init__(self):
        self.now = 0.0

    def __call__(self):
        return self.now

    def advance(self, seconds: float):
        self.now += seconds


def fake_request(host="203.0.113.10", headers=None):
    return SimpleNamespace(
        client=SimpleNamespace(host=host),
        headers=headers or {},
    )


def test_limiter_blocks_after_window_limit_and_reports_retry_after():
    clock = FakeClock()
    limiter = InMemoryRateLimiter(clock=clock)
    rule = RateLimitRule("auth.login", max_requests=2, window_seconds=60)

    first = limiter.check(rule, "203.0.113.10")
    second = limiter.check(rule, "203.0.113.10")
    blocked = limiter.check(rule, "203.0.113.10")

    assert first.allowed is True
    assert first.remaining == 1
    assert second.allowed is True
    assert second.remaining == 0
    assert blocked.allowed is False
    assert blocked.retry_after_seconds == 60

    clock.advance(61)
    reset_window = limiter.check(rule, "203.0.113.10")

    assert reset_window.allowed is True
    assert reset_window.remaining == 1


def test_limiter_scopes_counts_by_rule_and_client():
    limiter = InMemoryRateLimiter(clock=FakeClock())
    login_rule = RateLimitRule("auth.login", max_requests=1, window_seconds=60)
    reset_rule = RateLimitRule("auth.password_reset", max_requests=1, window_seconds=60)

    assert limiter.check(login_rule, "203.0.113.10").allowed is True
    assert limiter.check(login_rule, "203.0.113.10").allowed is False
    assert limiter.check(reset_rule, "203.0.113.10").allowed is True
    assert limiter.check(login_rule, "203.0.113.11").allowed is True


def test_enforce_rate_limit_raises_429_with_retry_after(monkeypatch):
    clock = FakeClock()
    limiter = InMemoryRateLimiter(clock=clock)
    rule = RateLimitRule("auth.login", max_requests=1, window_seconds=30)
    request = fake_request()

    monkeypatch.setattr(rate_limit, "rate_limiter", limiter)
    monkeypatch.setattr(rate_limit.settings, "RATE_LIMIT_ENABLED", True)
    monkeypatch.setattr(rate_limit.settings, "RATE_LIMIT_TRUST_PROXY_HEADERS", False)

    enforce_rate_limit(request, rule)
    with pytest.raises(HTTPException) as exc_info:
        enforce_rate_limit(request, rule)

    assert exc_info.value.status_code == 429
    assert exc_info.value.detail == "Too many requests. Please try again later."
    assert exc_info.value.headers == {"Retry-After": "30"}


def test_enforce_rate_limit_can_be_disabled(monkeypatch):
    limiter = InMemoryRateLimiter(clock=FakeClock())
    rule = RateLimitRule("auth.login", max_requests=1, window_seconds=30)
    request = fake_request()

    monkeypatch.setattr(rate_limit, "rate_limiter", limiter)
    monkeypatch.setattr(rate_limit.settings, "RATE_LIMIT_ENABLED", False)

    enforce_rate_limit(request, rule)
    enforce_rate_limit(request, rule)


def test_proxy_headers_are_used_only_when_enabled(monkeypatch):
    limiter = InMemoryRateLimiter(clock=FakeClock())
    rule = RateLimitRule("auth.login", max_requests=1, window_seconds=30)
    headers = {"x-forwarded-for": "198.51.100.7, 10.0.0.2"}

    monkeypatch.setattr(rate_limit, "rate_limiter", limiter)
    monkeypatch.setattr(rate_limit.settings, "RATE_LIMIT_ENABLED", True)
    monkeypatch.setattr(rate_limit.settings, "RATE_LIMIT_TRUST_PROXY_HEADERS", True)

    enforce_rate_limit(fake_request(host="203.0.113.10", headers=headers), rule)
    with pytest.raises(HTTPException):
        enforce_rate_limit(fake_request(host="203.0.113.11", headers=headers), rule)

    limiter.reset()
    monkeypatch.setattr(rate_limit.settings, "RATE_LIMIT_TRUST_PROXY_HEADERS", False)

    enforce_rate_limit(fake_request(host="203.0.113.10", headers=headers), rule)
    enforce_rate_limit(fake_request(host="203.0.113.11", headers=headers), rule)