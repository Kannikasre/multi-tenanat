from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS

from app.config import Config
from app.db import init_db
from app.utils.email import init_mail

jwt = JWTManager()


def create_app(config_object: type[Config] = Config) -> Flask:
    app = Flask(__name__)
    app.config.from_object(config_object)

    CORS(app, resources={r"/api/*": {"origins": app.config.get("CORS_ORIGINS", [])}})
    jwt.init_app(app)
    init_mail(app)
    init_db(app)

    from app.routes.auth import auth_bp
    from app.routes.enterprise import enterprise_bp
    from app.routes.users import users_bp
    from app.routes.tasks import tasks_bp
    from app.routes.super_admin import super_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(enterprise_bp, url_prefix="/api/enterprise")
    app.register_blueprint(users_bp, url_prefix="/api")
    app.register_blueprint(tasks_bp, url_prefix="/api")
    app.register_blueprint(super_bp, url_prefix="/api")

    @app.get("/")
    @app.get("/health")
    def health_check():
        return {"message": "Task Management API is running"}, 200

    return app
