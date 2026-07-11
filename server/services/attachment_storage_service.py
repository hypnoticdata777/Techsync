"""S3-compatible object storage upload helpers for work order attachments (RF-19)."""

from pathlib import Path
import re
from urllib.parse import quote
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status

from core.config import settings

ALLOWED_ATTACHMENT_CONTENT_TYPES = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "application/pdf": ".pdf",
}


class StorageNotConfigured(Exception):
    """Raised when S3-compatible storage settings are missing."""


async def upload_work_order_attachment_file(
    organization_id: int, work_order_id: int, file: UploadFile
) -> dict:
    content_type = (file.content_type or "").lower()
    file_name = _safe_file_name(file.filename or "attachment")
    content = await file.read(settings.ATTACHMENT_MAX_BYTES + 1)

    _validate_upload(file_name, content_type, content)

    storage_path = _build_storage_path(organization_id, work_order_id, file_name, content_type)
    bucket_name = _required_setting(settings.STORAGE_BUCKET, "STORAGE_BUCKET")
    public_base_url = _required_setting(settings.STORAGE_PUBLIC_BASE_URL, "STORAGE_PUBLIC_BASE_URL")
    client = _get_storage_client()

    try:
        client.put_object(
            Bucket=bucket_name,
            Key=storage_path,
            Body=content,
            ContentType=content_type,
        )
    except Exception as exc:  # pragma: no cover - exact SDK exceptions vary by provider/version.
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Attachment upload failed",
        ) from exc

    return {
        "file_name": file_name,
        "file_url": _public_url(public_base_url, storage_path),
        "content_type": content_type,
    }


def _get_storage_client():
    access_key = _required_setting(settings.STORAGE_ACCESS_KEY_ID, "STORAGE_ACCESS_KEY_ID")
    secret_key = _required_setting(settings.STORAGE_SECRET_ACCESS_KEY, "STORAGE_SECRET_ACCESS_KEY")

    try:
        import boto3  # type: ignore
    except ImportError as exc:  # pragma: no cover - exercised by deployment packaging, not unit tests.
        raise StorageNotConfigured("boto3 is required for attachment storage") from exc

    client_kwargs = {
        "service_name": "s3",
        "aws_access_key_id": access_key,
        "aws_secret_access_key": secret_key,
        "region_name": settings.STORAGE_REGION,
    }
    if settings.STORAGE_ENDPOINT_URL:
        client_kwargs["endpoint_url"] = settings.STORAGE_ENDPOINT_URL

    return boto3.client(**client_kwargs)


def _required_setting(value: str | None, name: str) -> str:
    if not value:
        raise StorageNotConfigured(f"{name} is not configured")
    return value


def _validate_upload(file_name: str, content_type: str, content: bytes) -> None:
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Attachment file is empty")

    if len(content) > settings.ATTACHMENT_MAX_BYTES:
        max_mb = settings.ATTACHMENT_MAX_BYTES / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail=f"Attachment must be {max_mb:g} MB or smaller",
        )

    if content_type not in ALLOWED_ATTACHMENT_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Attachment must be a JPEG, PNG, WebP, or PDF file",
        )

    suffix = Path(file_name).suffix.lower()
    expected_suffix = ALLOWED_ATTACHMENT_CONTENT_TYPES[content_type]
    if suffix and suffix != expected_suffix and not (content_type == "image/jpeg" and suffix == ".jpeg"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Attachment file extension does not match its content type",
        )


def _build_storage_path(
    organization_id: int, work_order_id: int, file_name: str, content_type: str
) -> str:
    path = Path(file_name)
    suffix = path.suffix.lower() or ALLOWED_ATTACHMENT_CONTENT_TYPES[content_type]
    stem = path.stem or "attachment"
    stem = _slug_file_stem(stem)[:80] or "attachment"
    return f"org-{organization_id}/work-order-{work_order_id}/{uuid4().hex}-{stem}{suffix}"


def _safe_file_name(file_name: str) -> str:
    normalized = file_name.replace("\\", "/")
    name = Path(normalized).name.strip()
    name = re.sub(r"[^A-Za-z0-9._ -]", "_", name)
    name = re.sub(r"\s+", " ", name).strip(" .")
    if not name:
        return "attachment"
    return name[:180]


def _slug_file_stem(stem: str) -> str:
    slug = re.sub(r"[^A-Za-z0-9._-]", "-", stem.strip())
    slug = re.sub(r"-+", "-", slug).strip("-._")
    return slug


def _public_url(public_base_url: str, storage_path: str) -> str:
    return f"{public_base_url.rstrip('/')}/{quote(storage_path, safe='/')}"
