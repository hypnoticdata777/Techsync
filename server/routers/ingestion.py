"""Data ingestion endpoints: CSV upload and external webhook (RF-09, RF-11, RF-12)."""

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile, status
from pydantic import ValidationError

from dependencies import get_current_organization, get_organization_from_api_key, require_roles
from logger import logger
from models.ingestion import IngestionResult, WebhookWorkOrderPayload
from models.user import User
from services import ingestion_service

router = APIRouter(prefix="/ingestion", tags=["ingestion"])


@router.post("/csv", response_model=IngestionResult)
async def ingest_csv(
    file: UploadFile,
    current_user: User = Depends(require_roles("org_admin", "coordinator")),
    organization: dict = Depends(get_current_organization),
):
    """RF-09: bulk-create work orders from an uploaded CSV file. Every row is
    validated independently (RF-12) -- a bad row is reported back, it does not
    abort the rest of the batch."""
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File must be a .csv")

    content = await file.read()
    try:
        rows, row_errors = ingestion_service.parse_csv_rows(content)
    except (ValueError, UnicodeDecodeError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    result = ingestion_service.ingest_rows(organization["id"], current_user.id, rows, source="csv")
    result.failed_count = len(row_errors)
    result.failed_rows = row_errors
    return result


@router.post("/webhook", status_code=status.HTTP_202_ACCEPTED)
async def ingest_webhook(
    payload: dict,
    background_tasks: BackgroundTasks,
    organization: dict = Depends(get_organization_from_api_key),
):
    """RF-11: external systems create work orders via API webhook, authenticated
    with a per-organization API key (see POST /organizations/me/api-key/regenerate).
    Responds 202 immediately and processes the payload in the background."""
    try:
        row = WebhookWorkOrderPayload(**payload)
    except ValidationError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=exc.errors())

    def _process():
        try:
            ingestion_service.ingest_rows(organization["id"], None, [row], source="webhook")
        except Exception:
            logger.exception(
                "ingestion.webhook_failed",
                extra={"event": "webhook_ingestion_failed", "organization_id": organization["id"]},
            )

    background_tasks.add_task(_process)
    return {"detail": "Webhook accepted, work order is being created", "status": "queued"}
