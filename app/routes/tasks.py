from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal, InvalidOperation

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from sqlalchemy import and_, func, select

from app.db import get_engine, get_session
from app.models.enterprise import Organization
from app.models.tenant import build_tenant_tables
from app.utils.auth_helpers import current_identity, require_roles, resolve_organization

tasks_bp = Blueprint("tasks", __name__)

_ALLOWED_STATUSES = {"pending", "in_progress", "completed"}


def _serialize_value(value):
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    return value


def _serialize_row(row) -> dict:
    data = dict(row)
    return {key: _serialize_value(value) for key, value in data.items()}


def _parse_task_date(task_date_value):
    if task_date_value in (None, ""):
        return None
    if isinstance(task_date_value, date):
        return task_date_value
    return date.fromisoformat(str(task_date_value))


def _parse_hours_spent(hours_spent_value):
    if hours_spent_value in (None, ""):
        return None
    try:
        return Decimal(str(hours_spent_value))
    except (InvalidOperation, ValueError, TypeError) as exc:
        raise ValueError from exc


def _get_user_schema(identity: dict) -> tuple[str | None, int | None]:
    return identity.get("schema_name"), identity.get("user_id")


def _load_task_table(schema_name: str):
    _, daily_tasks_table = build_tenant_tables(schema_name)
    return daily_tasks_table


def _load_task_with_access(schema_name: str, task_id: int, user_id: int | None = None):
    tasks_table = _load_task_table(schema_name)
    engine = get_engine()
    with engine.connect() as connection:
        statement = select(tasks_table).where(tasks_table.c.id == task_id)
        if user_id is not None:
            statement = statement.where(tasks_table.c.user_id == user_id)
        row = connection.execute(statement).mappings().first()
    return tasks_table, row


@tasks_bp.get("/tasks/my")
@jwt_required()
def my_tasks():
    identity = current_identity()
    schema_name, user_id = _get_user_schema(identity)
    if not schema_name or user_id is None:
        return jsonify({"message": "Forbidden"}), 403

    tasks_table = _load_task_table(schema_name)
    engine = get_engine()

    with engine.connect() as connection:
        rows = connection.execute(
            select(tasks_table)
            .where(tasks_table.c.user_id == user_id)
            .order_by(tasks_table.c.task_date.desc(), tasks_table.c.created_at.desc())
        ).mappings().all()

    return jsonify([_serialize_row(row) for row in rows]), 200


@tasks_bp.post("/tasks")
@jwt_required()
def submit_task():
    identity = current_identity()
    schema_name, user_id = _get_user_schema(identity)
    if not schema_name or user_id is None:
        return jsonify({"message": "Forbidden"}), 403

    payload = request.get_json(silent=True) or {}
    title = str(payload.get("title", "")).strip()
    description = payload.get("description")
    task_date_value = payload.get("task_date")
    hours_spent = payload.get("hours_spent")

    if not title:
        return jsonify({"message": "title is required"}), 400

    try:
        task_date_value = _parse_task_date(task_date_value)
    except ValueError:
        return jsonify({"message": "task_date must be YYYY-MM-DD"}), 400

    try:
        hours_spent = _parse_hours_spent(hours_spent)
    except ValueError:
        return jsonify({"message": "hours_spent must be numeric"}), 400

    if payload.get("status") is not None:
        return jsonify({"message": "status is managed by the system on create"}), 400

    tasks_table = _load_task_table(schema_name)
    engine = get_engine()

    values = {
        "user_id": user_id,
        "title": title,
        "description": str(description).strip() if description is not None else None,
        "hours_spent": hours_spent,
    }
    if task_date_value is not None:
        values["task_date"] = task_date_value

    with engine.begin() as connection:
        result = connection.execute(tasks_table.insert().values(**values))
        task_id = result.inserted_primary_key[0]
        row = connection.execute(
            select(tasks_table).where(tasks_table.c.id == task_id)
        ).mappings().one()

    return jsonify(_serialize_row(row)), 201


@tasks_bp.put("/tasks/<int:task_id>")
@jwt_required()
def update_task(task_id: int):
    identity = current_identity()
    schema_name, user_id = _get_user_schema(identity)
    if not schema_name or user_id is None:
        return jsonify({"message": "Forbidden"}), 403

    payload = request.get_json(silent=True) or {}
    tasks_table = _load_task_table(schema_name)
    engine = get_engine()

    with engine.begin() as connection:
        existing_row = connection.execute(
            select(tasks_table).where(
                and_(tasks_table.c.id == task_id, tasks_table.c.user_id == user_id)
            )
        ).mappings().first()
        if existing_row is None:
            return jsonify({"message": "Task not found"}), 404

        updates = {}

        if "title" in payload:
            title = str(payload.get("title", "")).strip()
            if not title:
                return jsonify({"message": "title cannot be empty"}), 400
            updates["title"] = title

        if "description" in payload:
            description = payload.get("description")
            updates["description"] = str(description).strip() if description is not None else None

        if "status" in payload:
            status = str(payload.get("status", "")).strip().lower()
            if status not in _ALLOWED_STATUSES:
                return jsonify({"message": "Invalid task status"}), 400
            updates["status"] = status

        if "task_date" in payload:
            raw_task_date = payload.get("task_date")
            if raw_task_date in (None, ""):
                return jsonify({"message": "task_date must be YYYY-MM-DD"}), 400
            try:
                updates["task_date"] = _parse_task_date(raw_task_date)
            except ValueError:
                return jsonify({"message": "task_date must be YYYY-MM-DD"}), 400

        if "hours_spent" in payload:
            try:
                updates["hours_spent"] = _parse_hours_spent(payload.get("hours_spent"))
            except ValueError:
                return jsonify({"message": "hours_spent must be numeric"}), 400

        if not updates:
            return jsonify({"message": "No valid fields to update"}), 400

        connection.execute(
            tasks_table.update().where(tasks_table.c.id == task_id).values(**updates)
        )
        row = connection.execute(
            select(tasks_table).where(tasks_table.c.id == task_id)
        ).mappings().one()

    return jsonify(_serialize_row(row)), 200


@tasks_bp.get("/enterprise/tasks")
@require_roles("enterprise_admin")
def enterprise_tasks():
    identity = current_identity()
    session = get_session()
    organizations = session.execute(
        select(Organization)
        .where(Organization.enterprise_id == identity["enterprise_id"])
        .order_by(Organization.created_at.desc())
    ).scalars().all()

    engine = get_engine()
    results = []

    for organization in organizations:
        tasks_table = _load_task_table(organization.schema_name)
        users_table, _ = build_tenant_tables(organization.schema_name)
        with engine.connect() as connection:
            rows = connection.execute(
                select(
                    tasks_table,
                    users_table.c.full_name.label("user_full_name"),
                    users_table.c.email.label("user_email"),
                    users_table.c.role.label("user_role"),
                ).join(users_table, tasks_table.c.user_id == users_table.c.id)
            ).mappings().all()

        for row in rows:
            row_data = _serialize_row(row)
            row_data["organization"] = {
                "id": organization.id,
                "name": organization.name,
                "schema_name": organization.schema_name,
                "is_active": bool(organization.is_active),
            }
            results.append(row_data)

    return jsonify(results), 200


@tasks_bp.get("/orgs/<int:org_id>/tasks")
@require_roles("enterprise_admin", "org_admin")
def organization_tasks(org_id: int):
    identity = current_identity()
    session = get_session()
    organization, error = resolve_organization(session, identity, org_id)
    if error:
        return error

    tasks_table = _load_task_table(organization.schema_name)
    users_table, _ = build_tenant_tables(organization.schema_name)
    engine = get_engine()

    with engine.connect() as connection:
        rows = connection.execute(
            select(
                tasks_table,
                users_table.c.full_name.label("user_full_name"),
                users_table.c.email.label("user_email"),
                users_table.c.role.label("user_role"),
            ).join(users_table, tasks_table.c.user_id == users_table.c.id)
        ).mappings().all()

    results = []
    for row in rows:
        row_data = _serialize_row(row)
        row_data["organization"] = {
            "id": organization.id,
            "name": organization.name,
            "schema_name": organization.schema_name,
            "is_active": bool(organization.is_active),
        }
        results.append(row_data)

    return jsonify(results), 200
