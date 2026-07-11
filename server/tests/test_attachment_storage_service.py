import asyncio
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from services import attachment_storage_service


class FakeUploadFile:
    def __init__(self, filename, content_type, content):
        self.filename = filename
        self.content_type = content_type
        self._content = content

    async def read(self, size=-1):
        if size is None or size < 0:
            return self._content
        return self._content[:size]


class FakeStorageClient:
    def __init__(self):
        self.put_calls = []

    def put_object(self, **kwargs):
        self.put_calls.append(kwargs)


def test_upload_work_order_attachment_file_stores_file_and_returns_metadata(monkeypatch):
    fake_client = FakeStorageClient()

    monkeypatch.setattr(attachment_storage_service, "_get_storage_client", lambda: fake_client)
    monkeypatch.setattr(attachment_storage_service.settings, "STORAGE_BUCKET", "wo-files")
    monkeypatch.setattr(attachment_storage_service.settings, "STORAGE_PUBLIC_BASE_URL", "https://files.example.com")
    monkeypatch.setattr(attachment_storage_service.settings, "ATTACHMENT_MAX_BYTES", 1024)
    monkeypatch.setattr(attachment_storage_service, "uuid4", lambda: SimpleNamespace(hex="abc123"))

    upload = FakeUploadFile("../Before Repair.JPG", "image/jpeg", b"image-bytes")
    result = asyncio.run(
        attachment_storage_service.upload_work_order_attachment_file(42, 99, upload)
    )

    assert fake_client.put_calls == [
        {
            "Bucket": "wo-files",
            "Key": "org-42/work-order-99/abc123-Before-Repair.jpg",
            "Body": b"image-bytes",
            "ContentType": "image/jpeg",
        }
    ]
    assert result == {
        "file_name": "Before Repair.JPG",
        "file_url": "https://files.example.com/org-42/work-order-99/abc123-Before-Repair.jpg",
        "content_type": "image/jpeg",
    }


def test_upload_rejects_unsupported_content_type(monkeypatch):
    monkeypatch.setattr(attachment_storage_service.settings, "ATTACHMENT_MAX_BYTES", 1024)
    upload = FakeUploadFile("notes.txt", "text/plain", b"hello")

    with pytest.raises(HTTPException) as exc:
        asyncio.run(attachment_storage_service.upload_work_order_attachment_file(1, 2, upload))

    assert exc.value.status_code == 400
    assert "JPEG" in exc.value.detail


def test_upload_rejects_files_over_size_limit(monkeypatch):
    monkeypatch.setattr(attachment_storage_service.settings, "ATTACHMENT_MAX_BYTES", 3)
    upload = FakeUploadFile("photo.png", "image/png", b"1234")

    with pytest.raises(HTTPException) as exc:
        asyncio.run(attachment_storage_service.upload_work_order_attachment_file(1, 2, upload))

    assert exc.value.status_code == 413


def test_upload_rejects_extension_mismatch(monkeypatch):
    monkeypatch.setattr(attachment_storage_service.settings, "ATTACHMENT_MAX_BYTES", 1024)
    upload = FakeUploadFile("photo.pdf", "image/png", b"png-bytes")

    with pytest.raises(HTTPException) as exc:
        asyncio.run(attachment_storage_service.upload_work_order_attachment_file(1, 2, upload))

    assert exc.value.status_code == 400
    assert "extension" in exc.value.detail


def test_upload_requires_storage_configuration(monkeypatch):
    monkeypatch.setattr(attachment_storage_service.settings, "STORAGE_BUCKET", None)
    monkeypatch.setattr(attachment_storage_service.settings, "STORAGE_PUBLIC_BASE_URL", "https://files.example.com")
    monkeypatch.setattr(attachment_storage_service.settings, "ATTACHMENT_MAX_BYTES", 1024)
    upload = FakeUploadFile("photo.jpg", "image/jpeg", b"jpg")

    with pytest.raises(attachment_storage_service.StorageNotConfigured):
        asyncio.run(attachment_storage_service.upload_work_order_attachment_file(1, 2, upload))
