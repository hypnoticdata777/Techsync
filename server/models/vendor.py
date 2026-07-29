"""Pydantic schemas for PMC vendor records (v1.3 foundation)."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class VendorCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    contact_name: Optional[str] = Field(None, max_length=150)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    service_types: list[str] = Field(default_factory=list)
    coverage_area: Optional[str] = Field(None, max_length=250)
    notes: Optional[str] = Field(None, max_length=2000)
    is_active: bool = True

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()


class VendorUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    contact_name: Optional[str] = Field(None, max_length=150)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    service_types: Optional[list[str]] = None
    coverage_area: Optional[str] = Field(None, max_length=250)
    notes: Optional[str] = Field(None, max_length=2000)
    is_active: Optional[bool] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip() if v else None


class Vendor(BaseModel):
    id: int
    organization_id: int
    name: str
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    service_types: list[str]
    coverage_area: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
