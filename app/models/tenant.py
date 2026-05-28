from __future__ import annotations

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Identity,
    Integer,
    MetaData,
    Numeric,
    String,
    Table,
    func,
    text,
)


def build_tenant_tables(schema_name: str, metadata: MetaData | None = None) -> tuple[Table, Table]:
    metadata = metadata or MetaData()

    organizations_ref = Table(
        "organizations",
        metadata,
        Column("id", Integer),
        schema="dbo",
        extend_existing=True,
    )

    users = Table(
        "users",
        metadata,
        Column("id", Integer, Identity(start=1), primary_key=True),
        Column("org_id", Integer, ForeignKey(organizations_ref.c.id), nullable=False, index=True),
        Column("full_name", String(255), nullable=False),
        Column("email", String(255), nullable=False, unique=True, index=True),
        Column("password_hash", String(255), nullable=False),
        Column("role", String(50), nullable=False, server_default=text("'user'")),
        Column("is_active", Boolean, nullable=False, server_default=text("1")),
        Column("created_at", DateTime, nullable=False, server_default=func.getdate()),
        schema=schema_name,
    )

    daily_tasks = Table(
        "daily_tasks",
        metadata,
        Column("id", Integer, Identity(start=1), primary_key=True),
        Column(
            "user_id",
            Integer,
            ForeignKey(f"{schema_name}.users.id"),
            nullable=False,
            index=True,
        ),
        Column("task_date", Date, nullable=False, server_default=text("CAST(GETDATE() AS date)")),
        Column("title", String(255), nullable=False),
        Column("description", String(2000), nullable=True),
        Column("status", String(50), nullable=False, server_default=text("'pending'")),
        Column("hours_spent", Numeric(5, 2), nullable=True),
        Column("created_at", DateTime, nullable=False, server_default=func.getdate()),
        schema=schema_name,
    )

    return users, daily_tasks
