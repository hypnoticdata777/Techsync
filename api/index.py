"""Vercel ASGI entrypoint for the TechSync Ops FastAPI backend."""

from pathlib import Path
import sys
from typing import Any, Awaitable, Callable


SERVER_DIR = Path(__file__).resolve().parents[1] / "server"
if str(SERVER_DIR) not in sys.path:
    sys.path.insert(0, str(SERVER_DIR))

from main import app as fastapi_app  # noqa: E402

Scope = dict[str, Any]
Receive = Callable[[], Awaitable[dict[str, Any]]]
Send = Callable[[dict[str, Any]], Awaitable[None]]


class VercelPathAdapter:
    """Strip Vercel function prefixes before handing requests to FastAPI."""

    def __init__(self, wrapped_app: Callable[[Scope, Receive, Send], Awaitable[None]]):
        self.wrapped_app = wrapped_app
        self.prefixes = ("/api/index.py", "/api/index")

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope.get("type") == "http":
            path = scope.get("path", "")
            for prefix in self.prefixes:
                if path == prefix:
                    scope = {**scope, "path": "/"}
                    break
                if path.startswith(f"{prefix}/"):
                    stripped_path = path[len(prefix):] or "/"
                    scope = {**scope, "path": stripped_path}
                    break
        await self.wrapped_app(scope, receive, send)


app = VercelPathAdapter(fastapi_app)
