from __future__ import annotations

from flask_mail import Mail, Message

mail = Mail()


def init_mail(app) -> None:
    mail.init_app(app)
    app.extensions["mail"] = mail


def send_org_code_email(recipient_email: str, organization_name: str, org_code: str) -> None:
    if not recipient_email:
        raise ValueError("Recipient email is required")

    message = Message(
        subject=f"Organization security code for {organization_name}",
        recipients=[recipient_email],
        body=(
            f"Hello,\n\n"
            f"Your organization '{organization_name}' has been created.\n"
            f"Permanent organization security code: {org_code}\n\n"
            f"Security note: this code is required during every organization login. "
            f"Keep it private and share it only with authorized organization members.\n\n"
            f"Regards,\n"
            f"Task Management System"
        ),
    )
    mail.send(message)