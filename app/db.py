from __future__ import annotations

from flask import current_app, g
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker


class Base(DeclarativeBase):
    pass


_engine = None
SessionLocal = None


def init_db(app) -> None:
    global _engine, SessionLocal

    _engine = create_engine(
        app.config["SQLALCHEMY_DATABASE_URI"],
        future=True,
        pool_pre_ping=True,
        echo=app.config.get("SQLALCHEMY_ECHO", False),
    )
    SessionLocal = sessionmaker(bind=_engine, autoflush=False, autocommit=False, future=True)

    app.extensions["db_engine"] = _engine
    app.extensions["db_session_factory"] = SessionLocal

    from app.models.enterprise import Enterprise, Organization  # noqa: F401
    from app.models.super_admin import SuperAdmin  # noqa: F401

    Base.metadata.create_all(bind=_engine)

    @app.teardown_appcontext
    def shutdown_session(exception: Exception | None = None) -> None:
        session = g.pop("db_session", None)
        if session is not None:
            session.close()


def get_engine():
    engine = current_app.extensions.get("db_engine")
    if engine is None:
        raise RuntimeError("Database engine is not initialized")
    return engine


def get_session():
    if SessionLocal is None:
        raise RuntimeError("Database session factory is not initialized")

    session = g.get("db_session")
    if session is None:
        session = SessionLocal()
        g.db_session = session
    return session
