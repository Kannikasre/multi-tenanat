from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from flask import Blueprint, jsonify, request
from sqlalchemy import func, select
from werkzeug.security import generate_password_hash

from app.db import get_engine, get_session
from app.models.tenant import build_tenant_tables
from app.utils.auth_helpers import current_identity, require_roles, resolve_organization

users_bp = Blueprint("users", __name__)


def _serialize_value(value):
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    return value


def _serialize_row(row) -> dict:
    data = dict(row)
    return {key: _serialize_value(value) for key, value in data.items()}


def _validate_role(role: str) -> bool:
    return role in {"user", "org_admin"}


@users_bp.get("/orgs/<int:org_id>/users")
@require_roles("enterprise_admin", "org_admin")
def list_users(org_id: int):
    identity = current_identity()
    session = get_session()
    organization, error = resolve_organization(session, identity, org_id)
    if error:
        return error

    users_table, _ = build_tenant_tables(organization.schema_name)
    engine = get_engine()

    with engine.connect() as connection:
        rows = connection.execute(
            select(users_table).order_by(users_table.c.created_at.desc())
        ).mappings().all()

    return jsonify([_serialize_row(row) for row in rows]), 200


@users_bp.post("/orgs/<int:org_id>/users")
@require_roles("enterprise_admin", "org_admin")
def create_user(org_id: int):
    identity = current_identity()
    payload = request.get_json(silent=True) or {}
    full_name = str(payload.get("full_name", "")).strip()
    email = str(payload.get("email", "")).strip().lower()
    password = str(payload.get("password", ""))
    role = str(payload.get("role", "user")).strip().lower() or "user"

    if not full_name or not email or not password:
        return jsonify({"message": "full_name, email and password are required"}), 400

    if not _validate_role(role):
        return jsonify({"message": "Role must be user or org_admin"}), 400

    session = get_session()
    organization, error = resolve_organization(session, identity, org_id)
    if error:
        return error

    users_table, _ = build_tenant_tables(organization.schema_name)
    engine = get_engine()

    with engine.begin() as connection:
        existing_user = connection.execute(
            select(users_table.c.id).where(func.lower(users_table.c.email) == email)
        ).first()
        if existing_user is not None:
            return jsonify({"message": "Email already exists in this organization"}), 400

        result = connection.execute(
            users_table.insert().values(
                org_id=organization.id,
                full_name=full_name,
                email=email,
                password_hash=generate_password_hash(password),
                role=role,
                is_active=True,
            )
        )
        user_id = result.inserted_primary_key[0]
        row = connection.execute(
            select(users_table).where(users_table.c.id == user_id)
        ).mappings().one()

    return jsonify(_serialize_row(row)), 201


@users_bp.put("/orgs/<int:org_id>/users/<int:user_id>")
@require_roles("enterprise_admin", "org_admin")
def update_user(org_id: int, user_id: int):
    identity = current_identity()
    payload = request.get_json(silent=True) or {}
    session = get_session()
    organization, error = resolve_organization(session, identity, org_id)
    if error:
        return error

    users_table, _ = build_tenant_tables(organization.schema_name)
    engine = get_engine()

    with engine.begin() as connection:
        existing_row = connection.execute(
            select(users_table).where(users_table.c.id == user_id)
        ).mappings().first()
        if existing_row is None:
            return jsonify({"message": "User not found"}), 404

        updates = {}
        if "full_name" in payload:
            full_name = str(payload.get("full_name", "")).strip()
            if not full_name:
                return jsonify({"message": "full_name cannot be empty"}), 400
            updates["full_name"] = full_name

        if "email" in payload:
            email = str(payload.get("email", "")).strip().lower()
            if not email:
                return jsonify({"message": "email cannot be empty"}), 400
            duplicate = connection.execute(
                select(users_table.c.id).where(
                    func.lower(users_table.c.email) == email,
                    users_table.c.id != user_id,
                )
            ).first()
            if duplicate is not None:
                return jsonify({"message": "Email already exists in this organization"}), 400
            updates["email"] = email

        if "password" in payload:
            password = str(payload.get("password", ""))
            if not password:
                return jsonify({"message": "password cannot be empty"}), 400
            updates["password_hash"] = generate_password_hash(password)

        if "role" in payload:
            role = str(payload.get("role", "")).strip().lower()
            if not _validate_role(role):
                return jsonify({"message": "Role must be user or org_admin"}), 400
            updates["role"] = role

        if "is_active" in payload:
            updates["is_active"] = bool(payload.get("is_active"))

        if not updates:
            return jsonify({"message": "No valid fields to update"}), 400

        connection.execute(
            users_table.update().where(users_table.c.id == user_id).values(**updates)
        )
        row = connection.execute(
            select(users_table).where(users_table.c.id == user_id)
        ).mappings().one()

    return jsonify(_serialize_row(row)), 200


@users_bp.delete("/orgs/<int:org_id>/users/<int:user_id>")
@require_roles("enterprise_admin", "org_admin")
def delete_user(org_id: int, user_id: int):
    identity = current_identity()
    session = get_session()
    organization, error = resolve_organization(session, identity, org_id)
    if error:
        return error

    users_table, _ = build_tenant_tables(organization.schema_name)
    engine = get_engine()

    with engine.begin() as connection:
        existing_row = connection.execute(
            select(users_table.c.id).where(users_table.c.id == user_id)
        ).first()
        if existing_row is None:
            return jsonify({"message": "User not found"}), 404

        connection.execute(
            users_table.update().where(users_table.c.id == user_id).values(is_active=False)
        )

    return jsonify({"message": "User deactivated"}), 200
