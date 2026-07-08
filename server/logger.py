"""
Logging configuration for TechSync API (RNF-12: structured logs for ingestion,
assignment, and auth-failure events).

Set LOG_FORMAT=json to emit one JSON object per line (recommended in any
hosted/production environment so logs are consultable/greppable). Defaults to
plain text for local development readability.
"""

import json
import logging
import os
import sys
from datetime import datetime, timezone

_RESERVED_LOG_RECORD_ATTRS = set(logging.LogRecord(
    "", 0, "", 0, "", (), None
).__dict__.keys())


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "timestamp": datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        extras = {
            key: value
            for key, value in record.__dict__.items()
            if key not in _RESERVED_LOG_RECORD_ATTRS
        }
        payload.update(extras)
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload, default=str)


def _build_handler() -> logging.Handler:
    handler = logging.StreamHandler(sys.stdout)
    if os.getenv("LOG_FORMAT", "text").lower() == "json":
        handler.setFormatter(JsonFormatter())
    else:
        handler.setFormatter(logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s"))
    return handler


logging.basicConfig(level=logging.INFO, handlers=[_build_handler()])


def get_logger(name: str) -> logging.Logger:
    """Get a logger instance with the specified name."""
    return logging.getLogger(name)


# Default logger used across the app
logger = get_logger("techsync")
