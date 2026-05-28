from __future__ import annotations

from secrets import randbelow

from sqlalchemy import select

from app.models.enterprise import Organization


def generate_unique_org_code(session, *, max_attempts: int = 50) -> str:
    existing_codes = set(
        session.execute(
            select(Organization.org_code).where(Organization.org_code.is_not(None))
        ).scalars().all()
    )

    for _ in range(max_attempts):
        candidate = f"{randbelow(900000) + 100000:06d}"
        if candidate not in existing_codes:
            return candidate

    raise RuntimeError("Unable to generate a unique organization security code")