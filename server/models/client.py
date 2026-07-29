"""Pydantic schemas for PMC client records (v1.3 foundation)."""

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

ClientType = Literal["homeowner", "owner", "tenant", "board_member", "other"]


class ClientCreate(BaseModel):
    display_name: str = Field(..., min_length=2, max_length=150)
    contact_name: Optional[str] = Field(None, max_length=150)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    client_type: ClientType = "homeowner"
    notes: Optional[str] = Field(None, max_length=2000)
    is_active: bool = True

    @field_validator("display_name")
    @classmethod
    def validate_display_name(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Display name cannot be empty")
        return v.strip()


class ClientUpdate(BaseModel):
    display_name: Optional[str] = Field(None, min_length=2, max_length=150)
    contact_name: Optional[str] = Field(None, max_length=150)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    client_type: Optional[ClientType] = None
    notes: Optional[str] = Field(None, max_length=2000)
    is_active: Optional[bool] = None

    @field_validator("display_name")
    @classmethod
    def validate_display_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("Display name cannot be empty")
        return v.strip() if v else None


class Client(BaseModel):
    id: int
    organization_id: int
    display_name: str
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    client_type: ClientType
    notes: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
