"""Pydantic schemas for the data ingestion layer (RF-09, RF-11, RF-12)."""

from typing import Optional

from pydantic import BaseModel, Field, field_validator

from models.work_order import Priority


class WorkOrderIngestRow(BaseModel):
    """Shape shared by CSV rows and webhook payloads before they become work orders."""

    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    customer_name: Optional[str] = Field(None, max_length=150)
    address: Optional[str] = Field(None, max_length=300)
    service_type: str = Field(default="general", max_length=100)
    priority: Priority = "medium"
    external_ref: Optional[str] = Field(None, max_length=100)

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Title cannot be empty")
        return v.strip()

    @field_validator("priority", mode="before")
    @classmethod
    def normalize_priority(cls, v):
        if isinstance(v, str):
            return v.strip().lower() or "medium"
        return v


class RowError(BaseModel):
    row_number: int
    errors: list[str]


class IngestionResult(BaseModel):
    created_count: int
    failed_count: int
    created_work_order_ids: list[int]
    failed_rows: list[RowError]


class WebhookWorkOrderPayload(WorkOrderIngestRow):
    pass
