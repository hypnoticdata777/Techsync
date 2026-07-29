"""Pydantic schemas for work-order communication separation (v1.3)."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

MessageVisibility = Literal["internal", "client"]


class WorkOrderMessageCreate(BaseModel):
    body: str = Field(..., min_length=1, max_length=4000)
    visibility: MessageVisibility = "internal"

    @field_validator("body")
    @classmethod
    def validate_body(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Message cannot be empty")
        return v.strip()


class WorkOrderMessage(BaseModel):
    id: int
    organization_id: int
    work_order_id: int
    author_user_id: int | None = None
    visibility: MessageVisibility
    body: str
    created_at: datetime
