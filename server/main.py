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


class WorkOrderUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


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


@app.put("/work-orders/{work_order_id}", response_model=WorkOrder)
def update_work_order(work_order_id: int, payload: WorkOrderUpdate):
    """
    Update an existing work order.

    If Supabase is configured, update in DB.
    Otherwise, update the in-memory list.
    """
    try:
        client = get_supabase_client()

        # Build update data with only provided fields
        update_data = {k: v for k, v in payload.dict().items() if v is not None}

        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        response = client.table("work_orders").update(update_data).eq("id", work_order_id).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Work order not found")

        row = response.data[0]
        return WorkOrder(
            id=row.get("id"),
            title=row.get("title", ""),
            description=row.get("description"),
            status=row.get("status", "pending"),
        )
    except SupabaseNotConfigured:
        # Update in-memory list
        for work_order in MOCK_WORK_ORDERS:
            if work_order.id == work_order_id:
                if payload.title is not None:
                    work_order.title = payload.title
                if payload.description is not None:
                    work_order.description = payload.description
                if payload.status is not None:
                    work_order.status = payload.status
                return work_order
        raise HTTPException(status_code=404, detail="Work order not found")
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        print(f"Error updating work order in Supabase: {exc}")
        raise HTTPException(status_code=500, detail="Failed to update work order")


@app.delete("/work-orders/{work_order_id}", status_code=204)
def delete_work_order(work_order_id: int):
    """
    Delete a work order.

    If Supabase is configured, delete from DB.
    Otherwise, remove from the in-memory list.
    """
    try:
        client = get_supabase_client()

        response = client.table("work_orders").delete().eq("id", work_order_id).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Work order not found")

        return None
    except SupabaseNotConfigured:
        # Delete from in-memory list
        for i, work_order in enumerate(MOCK_WORK_ORDERS):
            if work_order.id == work_order_id:
                MOCK_WORK_ORDERS.pop(i)
                return None
        raise HTTPException(status_code=404, detail="Work order not found")
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        print(f"Error deleting work order from Supabase: {exc}")
        raise HTTPException(status_code=500, detail="Failed to delete work order")
