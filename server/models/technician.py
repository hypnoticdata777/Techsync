"""Pydantic schemas for technician management (RF-26)."""

from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

from core.security import validate_password_strength

AvailabilityStatus = Literal["available", "busy", "off_duty"]


class TechnicianCreate(BaseModel):
    """Creates a technician user + profile in one call (org_admin/coordinator only)."""

    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    skills: list[str] = Field(default_factory=list)
    certifications: list[str] = Field(default_factory=list)
    zone: Optional[str] = Field(None, max_length=100)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    max_daily_jobs: int = Field(default=8, ge=1, le=50)

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        return validate_password_strength(v)


class TechnicianUpdate(BaseModel):
    skills: Optional[list[str]] = None
    certifications: Optional[list[str]] = None
    zone: Optional[str] = Field(None, max_length=100)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    availability_status: Optional[AvailabilityStatus] = None
    max_daily_jobs: Optional[int] = Field(None, ge=1, le=50)
    is_active: Optional[bool] = None


class Technician(BaseModel):
    id: int
    user_id: int
    organization_id: int
    full_name: str
    email: str
    is_active: bool
    skills: list[str]
    certifications: list[str]
    zone: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    availability_status: AvailabilityStatus
    max_daily_jobs: int
