"""
TechSync API entrypoint.

Business logic lives in services/, data access in repositories/, request/response
shapes in models/, and HTTP wiring in routers/ (RNF-09: modular structure).
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from core.config import settings
from database import DatabaseNotConfigured
from logger import logger
from routers import auth, billing, dashboard, ingestion, invitations, organizations, technicians, users, work_orders
from services.attachment_storage_service import StorageNotConfigured

app = FastAPI(
    title="TechSync API",
    version="1.0.0",
    description="Multi-tenant SaaS backend for TechSync, a field service management platform.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(DatabaseNotConfigured)
async def database_not_configured_handler(request: Request, exc: DatabaseNotConfigured):
    logger.error("database.not_configured", extra={"event": "database_not_configured", "path": request.url.path})
    return JSONResponse(status_code=503, content={"detail": "Service requires database configuration"})

@app.exception_handler(StorageNotConfigured)
async def storage_not_configured_handler(request: Request, exc: StorageNotConfigured):
    logger.error("storage.not_configured", extra={"event": "storage_not_configured", "path": request.url.path})
    return JSONResponse(status_code=503, content={"detail": "Service requires attachment storage configuration"})

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "techsync-api"}


app.include_router(auth.router)
app.include_router(organizations.router)
app.include_router(invitations.router)
app.include_router(users.router)
app.include_router(technicians.router)
app.include_router(work_orders.router)
app.include_router(ingestion.router)
app.include_router(dashboard.router)
app.include_router(billing.router)
