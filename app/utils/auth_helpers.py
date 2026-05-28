from __future__ import annotations

from functools import wraps

from flask import jsonify
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

from app.models.enterprise import Organization


def current_identity() -> dict:
    claims = get_jwt() or {}
    identity = get_jwt_identity()
    result = {key: value for key, value in claims.items() if key not in {"fresh", "iat", "jti", "type", "nbf", "csrf", "exp", "sub"}}
    if identity is not None:
        result["subject"] = identity
    return result


def require_roles(*allowed_roles: str):
    def decorator(view_func):
        @wraps(view_func)
        @jwt_required()
        def wrapper(*args, **kwargs):
            identity = current_identity()
            role = identity.get("role")
            # Allow `super_admin` to perform any action
            if role == "super_admin":
                return view_func(*args, **kwargs)

            if allowed_roles and role not in allowed_roles:
                return jsonify({"message": "Forbidden"}), 403
            return view_func(*args, **kwargs)

        return wrapper

    return decorator


def resolve_organization(session, identity: dict, org_id: int, *, require_active: bool = True):
    organization = session.get(Organization, org_id)
    if organization is None:
        return None, (jsonify({"message": "Organization not found"}), 404)

    role = identity.get("role")
    if role == "enterprise_admin":
        if organization.enterprise_id != identity.get("enterprise_id"):
            return None, (jsonify({"message": "Forbidden"}), 403)
    elif role == "org_admin":
        if organization.id != identity.get("org_id"):
            return None, (jsonify({"message": "Forbidden"}), 403)
    else:
        return None, (jsonify({"message": "Forbidden"}), 403)

    if require_active and not organization.is_active:
        return None, (jsonify({"message": "Organization not found"}), 404)

    return organization, None
