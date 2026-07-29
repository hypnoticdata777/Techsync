"""Pydantic schemas for managed properties (v1.3 foundation)."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class PropertyCreate(BaseModel):
    client_id: Optional[int] = None
    name: str = Field(..., min_length=2, max_length=150)
    address_line1: str = Field(..., min_length=3, max_length=250)
    address_line2: Optional[str] = Field(None, max_length=250)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=30)
    country: str = Field(default="US", max_length=2)
    unit: Optional[str] = Field(None, max_length=50)
    access_notes: Optional[str] = Field(None, max_length=2000)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    is_active: bool = True

    @field_validator("name", "address_line1")
    @classmethod
    def validate_required_text(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Required text cannot be empty")
        return v.strip()


class PropertyUpdate(BaseModel):
    client_id: Optional[int] = None
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    address_line1: Optional[str] = Field(None, min_length=3, max_length=250)
    address_line2: Optional[str] = Field(None, max_length=250)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=30)
    country: Optional[str] = Field(None, max_length=2)
    unit: Optional[str] = Field(None, max_length=50)
    access_notes: Optional[str] = Field(None, max_length=2000)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    is_active: Optional[bool] = None

    @field_validator("name", "address_line1")
    @classmethod
    def validate_optional_text(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("Required text cannot be empty")
        return v.strip() if v else None


class Property(BaseModel):
    id: int
    organization_id: int
    client_id: Optional[int] = None
    name: str
    address_line1: str
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: str
    unit: Optional[str] = None
    access_notes: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
