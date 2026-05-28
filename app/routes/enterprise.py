from __future__ import annotations

from flask import Blueprint, jsonify, request
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select

from app.db import get_engine, get_session
from app.models.enterprise import Organization
from app.utils.email import send_org_code_email
from app.utils.auth_helpers import current_identity, require_roles, resolve_organization
from app.utils.org_code import generate_unique_org_code
from app.utils.schema import create_schema_and_tables, sanitize_schema_name, schema_exists

enterprise_bp = Blueprint("enterprise", __name__)


def _serialize_organization(organization: Organization) -> dict:
    return {
        "id": organization.id,
        "enterprise_id": organization.enterprise_id,
        "name": organization.name,
        "schema_name": organization.schema_name,
        "created_at": organization.created_at.isoformat() if organization.created_at else None,
        "is_active": bool(organization.is_active),
    }


@enterprise_bp.get("/organizations")
@require_roles("enterprise_admin")
def list_organizations():
    identity = current_identity()
    session = get_session()
    organizations = session.execute(
        select(Organization)
        .where(Organization.enterprise_id == identity["enterprise_id"])
        .order_by(Organization.created_at.desc())
    ).scalars().all()
    return jsonify([_serialize_organization(organization) for organization in organizations]), 200


@enterprise_bp.post("/organizations")
@require_roles("enterprise_admin")
def create_organization():
    identity = current_identity()
    payload = request.get_json(silent=True) or {}
    name = str(payload.get("name", "")).strip()
    org_admin_email = str(payload.get("org_admin_email", "")).strip().lower()

    if not name:
        return jsonify({"message": "Organization name is required"}), 400

    if not org_admin_email:
        return jsonify({"message": "org_admin_email is required"}), 400

    try:
        schema_name = sanitize_schema_name(name)
    except ValueError as exc:
        return jsonify({"message": str(exc)}), 400

    engine = get_engine()
    session = get_session()

    if schema_exists(engine, schema_name):
        return jsonify({"message": "Schema already exists"}), 400

    if session.execute(select(Organization).where(Organization.schema_name == schema_name)).scalar_one_or_none():
        return jsonify({"message": "Schema already exists"}), 400

    try:
        organization_id = None
        organization_code = None
        for _ in range(10):
            organization_code = generate_unique_org_code(session)
            try:
                with engine.begin() as connection:
                    result = connection.execute(
                        Organization.__table__.insert().values(
                            enterprise_id=identity["enterprise_id"],
                            name=name,
                            schema_name=schema_name,
                            org_code=organization_code,
                            is_active=True,
                        )
                    )
                    organization_id = result.inserted_primary_key[0]
                    create_schema_and_tables(connection, schema_name)
                    # Audit logging can be added here when a persistent audit sink is available.
                break
            except IntegrityError:
                organization_id = None
                organization_code = None
                continue
        if organization_id is None:
            return jsonify({"message": "Failed to create organization"}), 500
    except Exception:
        return jsonify({"message": "Failed to create organization"}), 500

    created_organization = session.get(Organization, organization_id)
    if created_organization is None:
        return jsonify({"message": "Failed to create organization"}), 500

    try:
        send_org_code_email(org_admin_email, created_organization.name, organization_code or created_organization.org_code)
    except Exception:
        return jsonify({"message": "Organization was created but the security code email could not be sent"}), 500

    return jsonify(_serialize_organization(created_organization)), 201


@enterprise_bp.get("/organizations/<int:org_id>")
@require_roles("enterprise_admin")
def get_organization(org_id: int):
    identity = current_identity()
    session = get_session()
    organization, error = resolve_organization(session, identity, org_id, require_active=False)
    if error:
        return error
    return jsonify(_serialize_organization(organization)), 200


@enterprise_bp.put("/organizations/<int:org_id>")
@require_roles("enterprise_admin")
def update_organization(org_id: int):
    identity = current_identity()
    payload = request.get_json(silent=True) or {}
    session = get_session()
    organization, error = resolve_organization(session, identity, org_id, require_active=False)
    if error:
        return error

    updated = False
    if "name" in payload:
        name = str(payload.get("name", "")).strip()
        if not name:
            return jsonify({"message": "Organization name cannot be empty"}), 400
        organization.name = name
        updated = True

    if "is_active" in payload:
        organization.is_active = bool(payload.get("is_active"))
        updated = True

    if not updated:
        return jsonify({"message": "No valid fields to update"}), 400

    session.commit()
    return jsonify(_serialize_organization(organization)), 200


@enterprise_bp.delete("/organizations/<int:org_id>")
@require_roles("enterprise_admin")
def delete_organization(org_id: int):
    identity = current_identity()
    session = get_session()
    organization, error = resolve_organization(session, identity, org_id, require_active=False)
    if error:
        return error

    organization.is_active = False
    session.commit()
    return jsonify({"message": "Organization deactivated"}), 200


@enterprise_bp.post("/organizations/<int:org_id>/org-code/regenerate")
@require_roles("enterprise_admin")
def regenerate_organization_code(org_id: int):
    identity = current_identity()
    payload = request.get_json(silent=True) or {}
    org_admin_email = str(payload.get("org_admin_email", "")).strip().lower()

    if not org_admin_email:
        return jsonify({"message": "org_admin_email is required"}), 400

    session = get_session()
    organization, error = resolve_organization(session, identity, org_id, require_active=False)
    if error:
        return error

    try:
        for _ in range(10):
            new_code = generate_unique_org_code(session)
            try:
                organization.org_code = new_code
                session.flush()
                session.commit()
                send_org_code_email(org_admin_email, organization.name, new_code)
                break
            except IntegrityError:
                session.rollback()
                continue
        else:
            return jsonify({"message": "Failed to regenerate organization security code"}), 500
    except Exception:
        session.rollback()
        return jsonify({"message": "Failed to regenerate organization security code"}), 500

    return jsonify({"message": "Organization security code regenerated and emailed"}), 200
