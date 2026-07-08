"""Pydantic schemas for users, auth, and roles (RF-01, RF-02, RF-03)."""

from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator

from core.security import validate_password_strength

Role = Literal["org_admin", "coordinator", "technician"]


class User(BaseModel):
    id: int
    organization_id: int
    email: EmailStr
    full_name: str
    role: Role
    is_active: bool = True


class UserInDB(User):
    password_hash: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=100)

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        return validate_password_strength(v)


class UpdateUserRole(BaseModel):
    role: Role
