# Here we have email helpers and token creation utils
from django.urls import reverse
from django.conf import settings
from django.core.mail import send_mail
from .models import OneTimeToken


def send_verification_email(user, request=None):
    token_obj = OneTimeToken.create_token(
        user, token_type="email_verify", ttl_minutes=60 * 24
    )
    # explain this line of code(question)
    token = token_obj.token
    # build verification link: frontend would call verify endpoint with token
    # e.g, https://localhost:4200/verify-email?token=<token> or call backend verify endpoint
    verify_url = (
        f"{settings.FRONTEND_BASE_URL}/auth/verify-email?token={token}"
        if hasattr(settings, "FRONTEND_BASE_URL")
        else token
    )
    subject = "Verify your email"
    message = f"Welcome! Click the link to verify your email: {verify_url}"
    from_email = settings.DEFAULT_FROM_EMAIL
    recipient_list = [user.email]
    send_mail(subject, message, from_email, recipient_list, fail_silently=False)
    return token_obj


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
