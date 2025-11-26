from typing import List, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from supabase_client import get_supabase_client, SupabaseNotConfigured

app = FastAPI(
    title="TechSync API",
    version="0.1.0",
    description="MVP backend for TechSync field service management platform.",
)


class WorkOrder(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    status: str = "pending"


# simple in-memory fallback so the API works even without Supabase
MOCK_WORK_ORDERS: List[WorkOrder] = [
    WorkOrder(
        id=1,
        title="Leak under kitchen sink",
        description="Tenant reports slow drip, assign to plumbing tech.",
        status="scheduled",
    ),
    WorkOrder(
        id=2,
        title="Turnover cleaning – Unit 3B",
        description="Full move-out clean before new tenant move-in.",
        status="pending",
    ),
]


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "techsync-api"}


@app.get("/work-orders", response_model=List[WorkOrder])
def list_work_orders():
    """
    List work orders.

    If Supabase is configured, read from `work_orders` table.
    Otherwise, return mock data so the client still has something to render.
    """
    try:
        client = get_supabase_client()
    except SupabaseNotConfigured:
        return MOCK_WORK_ORDERS

    try:
        response = client.table("work_orders").select("*").execute()
        rows = response.data or []
        return [
            WorkOrder(
                id=row.get("id"),
                title=row.get("title", ""),
                description=row.get("description"),
                status=row.get("status", "pending"),
            )
            for row in rows
        ]
    except Exception as exc:  # noqa: BLE001
        # In a real system we'd log this; here we just fall back to mock data
        print(f"Error querying Supabase: {exc}")
        return MOCK_WORK_ORDERS


class WorkOrderCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "pending"


@app.post("/work-orders", response_model=WorkOrder, status_code=201)
def create_work_order(payload: WorkOrderCreate):
    """
    Create a new work order.

    If Supabase is configured, insert into DB.
    Otherwise, append to the in-memory list with an incremental id.
    """
    try:
        client = get_supabase_client()
        response = client.table("work_orders").insert(
            {
                "title": payload.title,
                "description": payload.description,
                "status": payload.status,
            }
        ).execute()

        row = (response.data or [])[0]
        return WorkOrder(
            id=row.get("id"),
            title=row.get("title", ""),
            description=row.get("description"),
            status=row.get("status", "pending"),
        )
    except SupabaseNotConfigured:
        new_id = (MOCK_WORK_ORDERS[-1].id + 1) if MOCK_WORK_ORDERS else 1
        work_order = WorkOrder(id=new_id, **payload.dict())
        MOCK_WORK_ORDERS.append(work_order)
        return work_order
    except Exception as exc:  # noqa: BLE001
        print(f"Error inserting into Supabase: {exc}")
        raise HTTPException(status_code=500, detail="Failed to create work order")
