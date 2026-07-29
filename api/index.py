"""Vercel ASGI entrypoint for the TechSync Ops FastAPI backend."""

from pathlib import Path
import sys


SERVER_DIR = Path(__file__).resolve().parents[1] / "server"
if str(SERVER_DIR) not in sys.path:
    sys.path.insert(0, str(SERVER_DIR))

from main import app  # noqa: E402
