"""Pydantic schemas for organizations / onboarding (RF-05, RF-06, RF-08)."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

from core.security import validate_password_strength
from models.user import TokenPair, User


class OrganizationOnboard(BaseModel):
    """Self-service org creation: company + first admin in one call (RF-06)."""

    company_name: str = Field(..., min_length=2, max_length=150)
    industry: Optional[str] = Field(None, max_length=100)
    timezone: str = Field(default="UTC", max_length=50)
    admin_full_name: str = Field(..., min_length=2, max_length=100)
    admin_email: EmailStr
    admin_password: str = Field(..., min_length=8, max_length=100)

    @field_validator("admin_password")
    @classmethod
    def validate_admin_password(cls, v: str) -> str:
        return validate_password_strength(v)

    @field_validator("company_name")
    @classmethod
    def validate_company_name(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Company name cannot be empty")
        return v.strip()


class Organization(BaseModel):
    id: int
    name: str
    slug: str
    industry: Optional[str] = None
    timezone: str
    settings: dict = Field(default_factory=dict)
    plan: str
    subscription_status: str
    trial_ends_at: Optional[datetime] = None
    technician_limit: int


class OrganizationOnboardResponse(BaseModel):
    organization: Organization
    user: User
    tokens: TokenPair


class OrganizationSettingsUpdate(BaseModel):
    timezone: Optional[str] = Field(None, max_length=50)
    service_types: Optional[list[str]] = None
    priorities: Optional[list[str]] = None
