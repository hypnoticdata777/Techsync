from pathlib import Path
import asyncio
import json
import sys


REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from api.index import app  # noqa: E402


async def _asgi_get(path: str):
    messages = []

    scope = {
        "type": "http",
        "asgi": {"version": "3.0"},
        "http_version": "1.1",
        "method": "GET",
        "scheme": "https",
        "path": path,
        "raw_path": path.encode(),
        "query_string": b"",
        "headers": [(b"host", b"example.test")],
        "client": ("127.0.0.1", 123),
        "server": ("example.test", 443),
    }

    async def receive():
        return {"type": "http.request", "body": b"", "more_body": False}

    async def send(message):
        messages.append(message)

    await app(scope, receive, send)

    status = next(message["status"] for message in messages if message["type"] == "http.response.start")
    body = b"".join(
        message.get("body", b"")
        for message in messages
        if message["type"] == "http.response.body"
    )
    return status, body.decode()


def test_vercel_adapter_serves_root_health_docs_and_openapi():
    root_status, root_body = asyncio.run(_asgi_get("/api/index.py"))
    assert root_status == 200
    assert json.loads(root_body)["docs"] == "/docs"

    health_status, health_body = asyncio.run(_asgi_get("/api/index.py/health"))
    assert health_status == 200
    assert json.loads(health_body)["status"] == "ok"

    docs_status, docs_body = asyncio.run(_asgi_get("/api/index.py/docs"))
    assert docs_status == 200
    assert "swagger-ui" in docs_body.lower()

    openapi_status, openapi_body = asyncio.run(_asgi_get("/api/index.py/openapi.json"))
    assert openapi_status == 200
    assert json.loads(openapi_body)["info"]["title"] == "TechSync Ops API"
