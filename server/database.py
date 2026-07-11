"""Direct Postgres helpers for TechSync repositories."""

import json
import re
from functools import lru_cache
from typing import Any

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine, RowMapping

from core.config import settings

_IDENTIFIER = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")
JSONB_COLUMNS = {"settings"}


class DatabaseNotConfigured(Exception):
    """Raised when DATABASE_URL is missing for runtime repository access."""


@lru_cache(maxsize=1)
def get_engine() -> Engine:
    if not settings.DATABASE_URL:
        raise DatabaseNotConfigured("DATABASE_URL is not configured.")
    return create_engine(settings.DATABASE_URL, pool_pre_ping=True, future=True)


def row_to_dict(row: RowMapping | None) -> dict | None:
    if row is None:
        return None
    return dict(row)


def fetch_one(sql: str, params: dict[str, Any] | None = None) -> dict | None:
    with get_engine().connect() as conn:
        row = conn.execute(text(sql), _coerce_params(params or {})).mappings().first()
        return row_to_dict(row)


def fetch_all(sql: str, params: dict[str, Any] | None = None) -> list[dict]:
    with get_engine().connect() as conn:
        rows = conn.execute(text(sql), _coerce_params(params or {})).mappings().all()
        return [dict(row) for row in rows]


def fetch_scalar(sql: str, params: dict[str, Any] | None = None) -> Any:
    with get_engine().connect() as conn:
        return conn.execute(text(sql), _coerce_params(params or {})).scalar()


def execute(sql: str, params: dict[str, Any] | None = None) -> None:
    with get_engine().begin() as conn:
        conn.execute(text(sql), _coerce_params(params or {}))


def insert_row(table: str, payload: dict[str, Any]) -> dict:
    _validate_identifier(table)
    columns = list(payload.keys())
    for column in columns:
        _validate_identifier(column)

    column_sql = ", ".join(columns)
    value_sql = ", ".join(_value_expr(column) for column in columns)
    sql = f"INSERT INTO {table} ({column_sql}) VALUES ({value_sql}) RETURNING *"
    return fetch_one_in_transaction(sql, payload)


def update_row(table: str, patch: dict[str, Any], where: dict[str, Any]) -> dict | None:
    _validate_identifier(table)
    if not patch:
        return select_one(table, where)

    params: dict[str, Any] = {}
    set_parts = []
    for column, value in patch.items():
        _validate_identifier(column)
        param_name = f"set_{column}"
        params[param_name] = value
        expression = f"CAST(:{param_name} AS jsonb)" if column in JSONB_COLUMNS else f":{param_name}"
        set_parts.append(f"{column} = {expression}")

    where_sql = _where_clause(where, params)
    sql = f"UPDATE {table} SET {', '.join(set_parts)} WHERE {where_sql} RETURNING *"
    return fetch_one_in_transaction(sql, params)


def delete_rows(table: str, where: dict[str, Any]) -> list[dict]:
    _validate_identifier(table)
    params: dict[str, Any] = {}
    where_sql = _where_clause(where, params)
    sql = f"DELETE FROM {table} WHERE {where_sql} RETURNING *"
    with get_engine().begin() as conn:
        rows = conn.execute(text(sql), _coerce_params(params)).mappings().all()
        return [dict(row) for row in rows]


def select_one(table: str, where: dict[str, Any]) -> dict | None:
    _validate_identifier(table)
    params: dict[str, Any] = {}
    where_sql = _where_clause(where, params)
    sql = f"SELECT * FROM {table} WHERE {where_sql} LIMIT 1"
    return fetch_one(sql, params)


def fetch_one_in_transaction(sql: str, params: dict[str, Any]) -> dict:
    with get_engine().begin() as conn:
        row = conn.execute(text(sql), _coerce_params(params)).mappings().first()
        return dict(row) if row else None


def _where_clause(where: dict[str, Any], params: dict[str, Any]) -> str:
    parts = []
    for column, value in where.items():
        _validate_identifier(column)
        param_name = f"where_{column}"
        params[param_name] = value
        parts.append(f"{column} = :{param_name}")
    if not parts:
        raise ValueError("Refusing to run a repository operation without a WHERE clause")
    return " AND ".join(parts)


def _value_expr(column: str) -> str:
    return f"CAST(:{column} AS jsonb)" if column in JSONB_COLUMNS else f":{column}"


def _coerce_params(params: dict[str, Any]) -> dict[str, Any]:
    coerced = dict(params)
    for key, value in list(coerced.items()):
        if key.replace("set_", "", 1) in JSONB_COLUMNS or key in JSONB_COLUMNS:
            coerced[key] = json.dumps(value or {})
    return coerced


def _validate_identifier(identifier: str) -> None:
    if not _IDENTIFIER.match(identifier):
        raise ValueError(f"Unsafe SQL identifier: {identifier}")
