from __future__ import annotations

from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token
from sqlalchemy import func, select
from werkzeug.security import check_password_hash

from app.db import get_engine, get_session
from app.models.enterprise import Enterprise, Organization
from app.models.tenant import build_tenant_tables
from app.models.super_admin import SuperAdmin
from werkzeug.security import generate_password_hash

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/enterprise/login")
def enterprise_login():
    payload = request.get_json(silent=True) or {}
    email = str(payload.get("email", "")).strip().lower()
    password = str(payload.get("password", ""))

    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400

    session = get_session()
    # TODO: Add request/IP-based rate limiting to slow brute-force attempts.
    enterprise = session.execute(
        select(Enterprise).where(func.lower(Enterprise.email) == email)
    ).scalar_one_or_none()

    if enterprise is None or not check_password_hash(enterprise.password_hash, password):
        return jsonify({"message": "Invalid credentials"}), 401

    additional_claims = {
        "actor_type": "enterprise_admin",
        "role": "enterprise_admin",
        "enterprise_id": enterprise.id,
        "enterprise_name": enterprise.name,
        "enterprise_email": enterprise.email,
    }
    access_token = create_access_token(identity=str(enterprise.id), additional_claims=additional_claims)

    return (
        jsonify(
            {
                "access_token": access_token,
                "user": {
                    "id": enterprise.id,
                    "name": enterprise.name,
                    "email": enterprise.email,
                    "role": "enterprise_admin",
                },
            }
        ),
        200,
    )


@auth_bp.post("/org/login")
def org_login():
    payload = request.get_json(silent=True) or {}
    email = str(payload.get("email", "")).strip().lower()
    password = str(payload.get("password", ""))
    org_code = str(payload.get("org_code", "")).strip()

    if not email or not password or not org_code:
        return jsonify({"message": "email, password and org_code are required"}), 400

    # TODO: Add request/IP-based rate limiting to slow brute-force attempts.
    session = get_session()
    engine = get_engine()

    organization = session.execute(
        select(Organization).where(Organization.org_code == org_code)
    ).scalar_one_or_none()

    if organization is None or not organization.is_active:
        return jsonify({"message": "Invalid organization security code"}), 403

    users_table, _ = build_tenant_tables(organization.schema_name)
    with engine.connect() as connection:
        user_row = connection.execute(
            select(users_table).where(func.lower(users_table.c.email) == email)
        ).mappings().first()

    if user_row is None or not check_password_hash(user_row["password_hash"], password):
        return jsonify({"message": "Invalid credentials"}), 401

    role = str(user_row["role"]).lower()
    if role not in {"user", "org_admin"}:
        return jsonify({"message": "Invalid credentials"}), 401

    if not bool(user_row["is_active"]):
        return jsonify({"message": "User account is inactive"}), 403

    additional_claims = {
        "actor_type": "org_user",
        "role": role,
        "enterprise_id": organization.enterprise_id,
        "org_id": organization.id,
        "schema_name": organization.schema_name,
        "user_id": user_row["id"],
        "user_name": user_row["full_name"],
        "user_email": user_row["email"],
    }
    access_token = create_access_token(identity=str(user_row["id"]), additional_claims=additional_claims)

    return (
        jsonify(
            {
                "access_token": access_token,
                "role": role,
            }
        ),
        200,
    )


@auth_bp.post("/super/login")
def super_login():
    payload = request.get_json(silent=True) or {}
    email = str(payload.get("email", "")).strip().lower()
    password = str(payload.get("password", ""))

    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400

    session = get_session()
    super_admin = session.execute(
        select(SuperAdmin).where(func.lower(SuperAdmin.email) == email)
    ).scalar_one_or_none()

    if super_admin is None or not check_password_hash(super_admin.password_hash, password):
        return jsonify({"message": "Invalid credentials"}), 401

    additional_claims = {
        "actor_type": "super_admin",
        "role": "super_admin",
        "super_admin_id": super_admin.id,
        "super_admin_email": super_admin.email,
    }
    access_token = create_access_token(identity=str(super_admin.id), additional_claims=additional_claims)

    return (
        jsonify(
            {
                "access_token": access_token,
                "user": {
                    "id": super_admin.id,
                    "email": super_admin.email,
                    "role": "super_admin",
                },
            }
        ),
        200,
    )
