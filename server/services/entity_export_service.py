"""CSV exports for PMC directory entities."""

from __future__ import annotations

import csv
from datetime import datetime
from io import StringIO
from typing import Any


def _format_value(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, list):
        return "; ".join(str(item) for item in value)
    if isinstance(value, bool):
        return "true" if value else "false"
    return str(value)


def _write_csv(headers: list[str], rows: list[dict[str, Any]]) -> str:
    output = StringIO()
    writer = csv.DictWriter(output, fieldnames=headers, extrasaction="ignore")
    writer.writeheader()
    for row in rows:
        writer.writerow({header: _format_value(row.get(header)) for header in headers})
    return output.getvalue()


def build_clients_csv(rows: list[dict[str, Any]]) -> str:
    return _write_csv(
        [
            "id",
            "display_name",
            "contact_name",
            "email",
            "phone",
            "client_type",
            "notes",
            "is_active",
            "created_at",
            "updated_at",
        ],
        rows,
    )


def build_properties_csv(rows: list[dict[str, Any]]) -> str:
    return _write_csv(
        [
            "id",
            "client_id",
            "name",
            "address_line1",
            "address_line2",
            "city",
            "state",
            "postal_code",
            "country",
            "unit",
            "access_notes",
            "latitude",
            "longitude",
            "is_active",
            "created_at",
            "updated_at",
        ],
        rows,
    )


def build_vendors_csv(rows: list[dict[str, Any]]) -> str:
    return _write_csv(
        [
            "id",
            "name",
            "contact_name",
            "email",
            "phone",
            "service_types",
            "coverage_area",
            "notes",
            "is_active",
            "created_at",
            "updated_at",
        ],
        rows,
    )
