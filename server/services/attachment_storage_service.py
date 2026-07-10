"""Supabase Storage upload helpers for work order attachments (RF-19)."""

from pathlib import Path
import re
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status

from core.config import settings
from supabase_client import get_supabase_client

ALLOWED_ATTACHMENT_CONTENT_TYPES = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "application/pdf": ".pdf",
}


async def upload_work_order_attachment_file(
    organization_id: int, work_order_id: int, file: UploadFile
) -> dict:
    content_type = (file.content_type or "").lower()
    file_name = _safe_file_name(file.filename or "attachment")
    content = await file.read(settings.ATTACHMENT_MAX_BYTES + 1)

    _validate_upload(file_name, content_type, content)

    storage_path = _build_storage_path(organization_id, work_order_id, file_name, content_type)
    bucket_name = settings.SUPABASE_ATTACHMENTS_BUCKET
    client = get_supabase_client()

    try:
        bucket = client.storage.from_(bucket_name)
        bucket.upload(
            storage_path,
            content,
            file_options={"content-type": content_type, "upsert": "false"},
        )
        file_url = bucket.get_public_url(storage_path)
    except Exception as exc:  # pragma: no cover - exact SDK exceptions vary by version.
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Attachment upload failed",
        ) from exc

    return {
        "file_name": file_name,
        "file_url": _normalize_public_url(file_url),
        "content_type": content_type,
    }


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


def _normalize_public_url(file_url) -> str:
    if isinstance(file_url, str):
        return file_url
    if isinstance(file_url, dict):
        return file_url.get("publicUrl") or file_url.get("public_url") or ""
    public_url = getattr(file_url, "public_url", None) or getattr(file_url, "publicUrl", None)
    return public_url or str(file_url)
