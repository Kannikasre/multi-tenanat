from __future__ import annotations

import re

from sqlalchemy import text

from app.models.tenant import build_tenant_tables

_SCHEMA_PATTERN = re.compile(r"^[a-z_][a-z0-9_]{0,127}$")


def sanitize_schema_name(organization_name: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "_", organization_name.strip()).strip("_").lower()
    if not cleaned:
        raise ValueError("Organization name must not be empty.")
    if not cleaned[0].isalpha() and cleaned[0] != "_":
        cleaned = f"org_{cleaned}"
    cleaned = cleaned[:128]
    if not _SCHEMA_PATTERN.fullmatch(cleaned):
        raise ValueError("Organization name cannot be converted to a valid schema name.")
    return cleaned


def schema_exists(engine, schema_name: str) -> bool:
    with engine.connect() as connection:
        result = connection.execute(
            text("SELECT 1 FROM sys.schemas WHERE name = :schema_name"),
            {"schema_name": schema_name},
        ).first()
        return result is not None


def create_schema_and_tables(connection, schema_name: str) -> None:
    users_table, daily_tasks_table = build_tenant_tables(schema_name)
    connection.execute(
        text(f"IF SCHEMA_ID(N'{schema_name}') IS NULL EXEC('CREATE SCHEMA [{schema_name}]')")
    )
    users_table.create(bind=connection, checkfirst=True)
    daily_tasks_table.create(bind=connection, checkfirst=True)
