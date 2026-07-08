"""
Data ingestion layer (RF-09 CSV, RF-11 webhook, RF-12 validation/normalization).
"""

import csv
import io

from pydantic import ValidationError

from logger import logger
from models.ingestion import IngestionResult, RowError, WorkOrderIngestRow
from repositories import work_orders as work_orders_repo
from services.work_order_service import apply_priority_rule, auto_assign

REQUIRED_CSV_COLUMNS = {"title"}


def parse_csv_rows(content: bytes) -> tuple[list[WorkOrderIngestRow], list[RowError]]:
    """RF-09/RF-12: parse + validate a CSV file. Returns (valid_rows, row_errors).
    Row numbers are 1-indexed and account for the header row (row 1 = first data row)."""
    text = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))

    if reader.fieldnames is None or not REQUIRED_CSV_COLUMNS.issubset(
        {f.strip().lower() for f in reader.fieldnames}
    ):
        raise ValueError(f"CSV must include columns: {', '.join(sorted(REQUIRED_CSV_COLUMNS))}")

    valid_rows: list[WorkOrderIngestRow] = []
    errors: list[RowError] = []

    for row_number, raw_row in enumerate(reader, start=1):
        normalized = {(k or "").strip().lower(): (v.strip() if isinstance(v, str) else v) for k, v in raw_row.items()}
        normalized = {k: (v if v != "" else None) for k, v in normalized.items()}
        try:
            valid_rows.append(WorkOrderIngestRow(**normalized))
        except ValidationError as exc:
            field_errors = [f"{'.'.join(str(loc) for loc in e['loc'])}: {e['msg']}" for e in exc.errors()]
            errors.append(RowError(row_number=row_number, errors=field_errors))

    return valid_rows, errors


def ingest_rows(
    organization_id: int, created_by: int, rows: list[WorkOrderIngestRow], source: str
) -> IngestionResult:
    """Persist validated rows as work orders and run auto-assignment on each."""
    created_ids: list[int] = []

    for row in rows:
        priority = apply_priority_rule(organization_id, row.service_type, row.priority)
        work_order = work_orders_repo.create(
            organization_id,
            {
                "title": row.title,
                "description": row.description,
                "customer_name": row.customer_name,
                "address": row.address,
                "service_type": row.service_type,
                "priority": priority,
                "status": "open",
                "created_by": created_by,
                "source": source,
                "external_ref": row.external_ref,
            },
        )
        auto_assign(organization_id, work_order)
        created_ids.append(work_order["id"])

    logger.info(
        "ingestion.completed",
        extra={"event": "ingestion_completed", "organization_id": organization_id, "source": source, "created_count": len(created_ids)},
    )

    return IngestionResult(
        created_count=len(created_ids),
        failed_count=0,
        created_work_order_ids=created_ids,
        failed_rows=[],
    )
