from typing import List, Optional

from fastapi import FastAPI, HTTPException, Depends, status, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from supabase_client import get_supabase_client, SupabaseNotConfigured
from auth import (
    User,
    UserCreate,
    UserLogin,
    Token,
    get_password_hash,
    verify_password,
    create_access_token,
)
from dependencies import get_current_user
from logger import logger

app = FastAPI(
    title="TechSync API",
    version="0.1.0",
    description="MVP backend for TechSync field service management platform.",
)

# Configure CORS to allow mobile app and web clients to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8081",  # React Native Metro bundler
        "http://localhost:19000",  # Expo
        "http://localhost:19001",  # Expo
        "http://localhost:19002",  # Expo
        "http://localhost:3000",   # React web app (if applicable)
        "http://127.0.0.1:8081",
        "http://127.0.0.1:19000",
        "http://127.0.0.1:19001",
        "http://127.0.0.1:19002",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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


# Authentication endpoints
@app.post("/auth/register", response_model=User, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate):
    """
    Register a new user.
    Creates a user account with hashed password.
    """
    try:
        client = get_supabase_client()

        # Check if user already exists
        existing = client.table("users").select("email").eq("email", user_data.email).execute()
        if existing.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        # Hash password and create user
        password_hash = get_password_hash(user_data.password)
        response = client.table("users").insert(
            {
                "email": user_data.email,
                "password_hash": password_hash,
                "full_name": user_data.full_name,
                "role": user_data.role,
            }
        ).execute()

        user_row = response.data[0]
        return User(
            id=user_row["id"],
            email=user_row["email"],
            full_name=user_row["full_name"],
            role=user_row["role"],
            is_active=user_row["is_active"],
        )

    except SupabaseNotConfigured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Registration requires database configuration",
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error creating user: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user",
        )


@app.post("/auth/login", response_model=Token)
def login(credentials: UserLogin):
    """
    Login with email and password.
    Returns a JWT access token on success.
    """
    try:
        client = get_supabase_client()

        # Get user from database
        response = client.table("users").select("*").eq("email", credentials.email).execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
            )

        user_data = response.data[0]

        # Verify password
        if not verify_password(credentials.password, user_data["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
            )

        # Check if user is active
        if not user_data["is_active"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive",
            )

        # Create access token
        access_token = create_access_token(data={"sub": user_data["email"]})

        return Token(access_token=access_token, token_type="bearer")

    except SupabaseNotConfigured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Login requires database configuration",
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error during login: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed",
        )


@app.get("/auth/me", response_model=User)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user information.
    """
    return current_user


@app.get("/work-orders", response_model=List[WorkOrder])
def list_work_orders(current_user: User = Depends(get_current_user)):
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
        logger.error(f"Error querying Supabase: {exc}")
        return MOCK_WORK_ORDERS


class WorkOrderCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    status: str = Field(default="pending", pattern="^(pending|in_progress|completed|cancelled)$")

    @field_validator('title')
    @classmethod
    def validate_title(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError('Title cannot be empty')
        return v.strip()


class WorkOrderUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    status: Optional[str] = Field(None, pattern="^(pending|in_progress|completed|cancelled)$")

    @field_validator('title')
    @classmethod
    def validate_title(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and (not v or not v.strip()):
            raise ValueError('Title cannot be empty')
        return v.strip() if v else None


@app.post("/work-orders", response_model=WorkOrder, status_code=201)
def create_work_order(
    payload: WorkOrderCreate, current_user: User = Depends(get_current_user)
):
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
        logger.error(f"Error inserting into Supabase: {exc}")
        raise HTTPException(status_code=500, detail="Failed to create work order")


@app.put("/work-orders/{work_order_id}", response_model=WorkOrder)
def update_work_order(
    work_order_id: int,
    payload: WorkOrderUpdate,
    current_user: User = Depends(get_current_user),
):
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
        logger.error(f"Error updating work order in Supabase: {exc}")
        raise HTTPException(status_code=500, detail="Failed to update work order")


@app.delete("/work-orders/{work_order_id}", status_code=204)
def delete_work_order(
    work_order_id: int, current_user: User = Depends(get_current_user)
):
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

        return Response(status_code=204)
    except SupabaseNotConfigured:
        # Delete from in-memory list
        for i, work_order in enumerate(MOCK_WORK_ORDERS):
            if work_order.id == work_order_id:
                MOCK_WORK_ORDERS.pop(i)
                return Response(status_code=204)
        raise HTTPException(status_code=404, detail="Work order not found")
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        logger.error(f"Error deleting work order from Supabase: {exc}")
        raise HTTPException(status_code=500, detail="Failed to delete work order")
