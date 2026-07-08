"""Pydantic schemas for the subscription/billing layer (RF-27, RF-28, RF-29)."""

from typing import Literal

from pydantic import BaseModel

Plan = Literal["trial", "free", "pro"]


class CheckoutSessionResponse(BaseModel):
    checkout_url: str
    mode: Literal["stripe_test", "mock"]


class PlanLimits(BaseModel):
    plan: Plan
    technician_limit: int
    technicians_used: int
