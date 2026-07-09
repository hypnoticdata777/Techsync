"""Email delivery for password resets and user invitations."""

from email.message import EmailMessage
from smtplib import SMTP
from urllib.parse import urlencode

from core.config import settings
from logger import logger


class EmailDeliveryError(Exception):
    """Raised when an email cannot be delivered."""


def _link(path: str, token: str) -> str:
    if not settings.APP_BASE_URL:
        raise EmailDeliveryError("APP_BASE_URL is required to build email links")
    return f"{settings.APP_BASE_URL.rstrip('/')}{path}?{urlencode({'token': token})}"


def _send_email(to_email: str, subject: str, body: str) -> None:
    if settings.EMAIL_DELIVERY_METHOD == "log":
        logger.info(
            "email.dev_delivery",
            extra={
                "event": "email_dev_delivery",
                "to_email": to_email,
                "subject": subject,
                "body": body,
            },
        )
        return

    if not settings.EMAIL_FROM or not settings.SMTP_HOST:
        raise EmailDeliveryError("SMTP email settings are incomplete")

    message = EmailMessage()
    message["From"] = settings.EMAIL_FROM
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(body)

    try:
        with SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as smtp:
            if settings.SMTP_USE_TLS:
                smtp.starttls()
            if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
                smtp.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            smtp.send_message(message)
    except Exception as exc:
        raise EmailDeliveryError("Email delivery failed") from exc


def send_password_reset_email(to_email: str, token: str) -> None:
    reset_link = _link("/reset-password", token)
    body = (
        "A password reset was requested for your TechSync account.\n\n"
        f"Open this link to reset your password: {reset_link}\n\n"
        f"If your app asks for a token, paste this value: {token}\n\n"
        "If you did not request this, you can ignore this email."
    )
    _send_email(to_email, "Reset your TechSync password", body)


def send_invitation_email(to_email: str, token: str, organization_name: str, role: str) -> None:
    invite_link = _link("/accept-invitation", token)
    body = (
        f"You have been invited to join {organization_name} on TechSync as {role}.\n\n"
        f"Open this link to accept the invitation: {invite_link}\n\n"
        f"If your app asks for a token, paste this value: {token}\n\n"
        "If you were not expecting this invitation, you can ignore this email."
    )
    _send_email(to_email, f"You're invited to {organization_name} on TechSync", body)