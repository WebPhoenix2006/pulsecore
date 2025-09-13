# Here we have email helpers and token creation utils
from django.urls import reverse
from django.conf import settings
from django.core.mail import send_mail
from .models import OneTimeToken


def send_verification_email(user, request=None, token=None):
    """
    Sends verification email with either a provided token
    or generates a new one if none is given.
    """
    from .models import OneTimeToken  # avoid circular import

    if not token:
        token_obj = OneTimeToken.create_token(
            user, token_type="email_verify", ttl_minutes=60
        )
        token = token_obj.token

    # Build frontend URL
    verify_url = f"{settings.FRONTEND_BASE_URL}/auth/verify?token={token}"

    subject = "Verify your PulseCore account"
    message = f"Click the link to verify your account: {verify_url}"

    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])


def send_password_reset_email(user):
    token_obj = OneTimeToken.create_token(
        user, token_type="password_reset", ttl_minutes=60
    )
    token = token_obj.token
    reset_url = (
        f"{settings.FRONTEND_BASE_URL}/auth/reset-password?token={token}"
        if hasattr(settings, "FRONTEND_BASE_URL")
        else token
    )
    send_mail(
        "Reset your password",
        f"Use this link to reset: {reset_url}",
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
    )
    return token_obj
