"""Pydantic schemas for org invitations (RF-07)."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

from core.security import validate_password_strength
from models.user import Role


class InvitationCreate(BaseModel):
    email: EmailStr
    role: Role = "technician"


class Invitation(BaseModel):
    id: int
    email: str
    role: Role
    expires_at: datetime
    accepted_at: Optional[datetime] = None


class InvitationAccept(BaseModel):
    token: str
    full_name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=8, max_length=100)

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        return validate_password_strength(v)
