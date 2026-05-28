from __future__ import annotations

from flask import Blueprint, jsonify, request
from sqlalchemy import select
from werkzeug.security import generate_password_hash

from app.db import get_session
from app.models.super_admin import SuperAdmin
from app.utils.auth_helpers import require_roles
from app.models.enterprise import Enterprise

super_bp = Blueprint("super_admin", __name__)


@super_bp.post("/setup/super-admin")
def setup_super_admin():
    """Create the initial super-admin. Only allowed when none exist."""
    payload = request.get_json(silent=True) or {}
    email = str(payload.get("email", "")).strip().lower()
    password = str(payload.get("password", ""))

    if not email or not password:
        return jsonify({"message": "email and password are required"}), 400

    session = get_session()
    existing = session.execute(select(SuperAdmin)).scalar_one_or_none()
    if existing is not None:
        return jsonify({"message": "Super admin already exists"}), 400

    admin = SuperAdmin(email=email, password_hash=generate_password_hash(password))
    session.add(admin)
    session.commit()

    return jsonify({"message": "Super admin created"}), 201


@super_bp.post("/enterprise-admins")
@require_roles("super_admin")
def create_enterprise_admin():
    """Create a new Enterprise (enterprise-admin account)."""
    payload = request.get_json(silent=True) or {}
    name = str(payload.get("name", "")).strip()
    email = str(payload.get("email", "")).strip().lower()
    password = str(payload.get("password", ""))

    if not name or not email or not password:
        return jsonify({"message": "name, email and password are required"}), 400

    session = get_session()
    existing = session.execute(select(Enterprise).where(Enterprise.email == email)).scalar_one_or_none()
    if existing is not None:
        return jsonify({"message": "Email already exists"}), 400

    enterprise = Enterprise(name=name, email=email, password_hash=generate_password_hash(password))
    session.add(enterprise)
    session.commit()

    return jsonify({"id": enterprise.id, "name": enterprise.name, "email": enterprise.email}), 201


@super_bp.post("/super-admins")
@require_roles("super_admin")
def create_super_admin():
    """Create additional super-admins. Requires existing super-admin token."""
    payload = request.get_json(silent=True) or {}
    email = str(payload.get("email", "")).strip().lower()
    password = str(payload.get("password", ""))

    if not email or not password:
        return jsonify({"message": "email and password are required"}), 400

    session = get_session()
    existing = session.execute(select(SuperAdmin).where(SuperAdmin.email == email)).scalar_one_or_none()
    if existing is not None:
        return jsonify({"message": "Email already exists"}), 400

    admin = SuperAdmin(email=email, password_hash=generate_password_hash(password))
    session.add(admin)
    session.commit()

    return jsonify({"message": "Super admin created"}), 201
