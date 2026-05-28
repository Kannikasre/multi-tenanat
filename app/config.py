from __future__ import annotations

import os
from datetime import timedelta

import pyodbc
from sqlalchemy.engine import URL


def pick_sql_server_driver() -> str:
    preferred_drivers = [
        "ODBC Driver 18 for SQL Server",
        "ODBC Driver 17 for SQL Server",
        "SQL Server",
    ]
    installed_drivers = set(pyodbc.drivers())
    for driver_name in preferred_drivers:
        if driver_name in installed_drivers:
            return driver_name
    return os.getenv("DB_DRIVER", "SQL Server")


def build_database_uri() -> str:
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        return database_url

    default_driver = os.getenv("DB_DRIVER") or pick_sql_server_driver()

    if os.getenv("USE_DOCKER_SQL_SERVER", "true").lower() == "true":
        return (
            "mssql+pyodbc://sa:YourStrongPass%40123@127.0.0.1/TaskManagementDB?"
            "driver=ODBC+Driver+18+for+SQL+Server&TrustServerCertificate=yes"
        )

    driver = default_driver
    host = os.getenv("DB_HOST", "127.0.0.1")
    port = int(os.getenv("DB_PORT", "1433"))
    database = os.getenv("DB_NAME", "TaskManagementDB")
    username = os.getenv("DB_USER")
    password = os.getenv("DB_PASSWORD")
    encrypt = os.getenv("DB_ENCRYPT", "no")
    trust_server_certificate = os.getenv("DB_TRUST_SERVER_CERTIFICATE", "yes")

    query = {
        "driver": driver,
        "Encrypt": encrypt,
        "TrustServerCertificate": trust_server_certificate,
    }

    if username and password:
        return str(
            URL.create(
                "mssql+pyodbc",
                username=username,
                password=password,
                host=host,
                port=port,
                database=database,
                query=query,
            )
        )

    query["Trusted_Connection"] = "yes"
    return str(
        URL.create(
            "mssql+pyodbc",
            host=host,
            port=port,
            database=database,
            query=query,
        )
    )


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "change-me")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        seconds=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_SECONDS", "3600"))
    )
    SQLALCHEMY_DATABASE_URI = build_database_uri()
    SQLALCHEMY_ECHO = os.getenv("SQLALCHEMY_ECHO", "false").lower() == "true"
    CORS_ORIGINS = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://127.0.0.1:4200").split(",") if origin.strip()]
    MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(os.getenv("MAIL_PORT", "587"))
    MAIL_USE_TLS = os.getenv("MAIL_USE_TLS", "true").lower() == "true"
    MAIL_USE_SSL = os.getenv("MAIL_USE_SSL", "false").lower() == "true"
    MAIL_USERNAME = os.getenv("MAIL_USERNAME")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
    MAIL_DEFAULT_SENDER = os.getenv("MAIL_DEFAULT_SENDER")
    MAIL_SUPPRESS_SEND = os.getenv("MAIL_SUPPRESS_SEND", "false").lower() == "true"
