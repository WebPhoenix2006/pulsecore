import pytest
from django.urls import reverse
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

from authentication.models import OneTimeToken

User = get_user_model()


# ----- REGISTRATION TESTS -----


@pytest.mark.django_db
def test_register_user_success(unauth_client, valid_register_data):
    url = reverse("register")
    response = unauth_client.post(url, valid_register_data, format="json")

    assert response.status_code == status.HTTP_201_CREATED
    assert "verification_token" in response.data
    assert response.data["message"] == "User created successfully. Please verify your email."

    user = User.objects.get(email="newuser@example.com")
    assert not user.is_active
    assert user.first_name == "New"


@pytest.mark.django_db
def test_register_duplicate_email_inactive_user(unauth_client, valid_register_data, inactive_user):
    valid_register_data["email"] = inactive_user.email
    url = reverse("register")
    response = unauth_client.post(url, valid_register_data, format="json")

    assert response.status_code == status.HTTP_200_OK
    assert response.data["message"] == "Verification email re-sent."


@pytest.mark.django_db
def test_register_duplicate_email_active_user(unauth_client, valid_register_data, active_user):
    valid_register_data["email"] = active_user.email
    url = reverse("register")
    response = unauth_client.post(url, valid_register_data, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_register_password_mismatch(unauth_client, valid_register_data):
    valid_register_data["confirm_password"] = "differentpassword"
    url = reverse("register")
    response = unauth_client.post(url, valid_register_data, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_register_missing_email(unauth_client, valid_register_data):
    del valid_register_data["email"]
    url = reverse("register")
    response = unauth_client.post(url, valid_register_data, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST


# ----- LOGIN TESTS -----


@pytest.mark.django_db
def test_login_success(unauth_client, active_user):
    url = reverse("login")
    data = {"email": active_user.email, "password": "testpassword123"}
    response = unauth_client.post(url, data, format="json")

    assert response.status_code == status.HTTP_200_OK
    assert "access" in response.data
    assert "refresh" in response.data
    assert "user" in response.data
    assert "tenant_id" in response.data


@pytest.mark.django_db
def test_login_invalid_password(unauth_client, active_user):
    url = reverse("login")
    data = {"email": active_user.email, "password": "wrongpassword"}
    response = unauth_client.post(url, data, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_login_nonexistent_user(unauth_client):
    url = reverse("login")
    data = {"email": "nonexistent@example.com", "password": "testpassword123"}
    response = unauth_client.post(url, data, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_login_inactive_user(unauth_client, inactive_user):
    url = reverse("login")
    data = {"email": inactive_user.email, "password": "testpassword123"}
    response = unauth_client.post(url, data, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_login_missing_credentials(unauth_client):
    url = reverse("login")
    response = unauth_client.post(url, {}, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST


# ----- LOGOUT TESTS -----


@pytest.mark.django_db
def test_logout_success(auth_client, active_user):
    refresh = RefreshToken.for_user(active_user)
    url = reverse("logout")
    data = {"refresh": str(refresh)}
    response = auth_client.post(url, data, format="json")

    assert response.status_code == status.HTTP_205_RESET_CONTENT
    assert response.data["detail"] == "Successfully logged out."


@pytest.mark.django_db
def test_logout_missing_refresh_token(auth_client):
    url = reverse("logout")
    response = auth_client.post(url, {}, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.data["detail"] == "Refresh token is required."


@pytest.mark.django_db
def test_logout_invalid_refresh_token(auth_client):
    url = reverse("logout")
    data = {"refresh": "invalid_token"}
    response = auth_client.post(url, data, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_logout_without_authentication(unauth_client):
    refresh = RefreshToken()
    url = reverse("logout")
    data = {"refresh": str(refresh)}
    response = unauth_client.post(url, data, format="json")

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


# ----- EMAIL VERIFICATION TESTS -----


@pytest.mark.django_db
def test_verify_email_success(unauth_client, email_verification_token):
    url = reverse("verify-email")
    data = {"token": email_verification_token.token}
    response = unauth_client.post(url, data, format="json")

    assert response.status_code == status.HTTP_200_OK
    assert "token" in response.data
    assert "refresh" in response.data
    assert "user" in response.data

    email_verification_token.user.refresh_from_db()
    assert email_verification_token.user.is_active

    # Token should be deleted after use
    assert not OneTimeToken.objects.filter(id=email_verification_token.id).exists()


@pytest.mark.django_db
def test_verify_email_invalid_token(unauth_client):
    url = reverse("verify-email")
    data = {"token": "invalid_token"}
    response = unauth_client.post(url, data, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.data["detail"] == "Invalid token"


@pytest.mark.django_db
def test_verify_email_expired_token(unauth_client, inactive_user):
    expired_token = OneTimeToken.create_token(inactive_user, "email_verify", ttl_minutes=0)
    url = reverse("verify-email")
    data = {"token": expired_token.token}
    response = unauth_client.post(url, data, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.data["detail"] == "Token has expired"


@pytest.mark.django_db
def test_verify_email_missing_token(unauth_client):
    url = reverse("verify-email")
    response = unauth_client.post(url, {}, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.data["detail"] == "Token is required"


# ----- PASSWORD RESET TESTS -----


@pytest.mark.django_db
def test_password_reset_request_success(unauth_client, active_user):
    url = reverse("password-reset")
    data = {"email": active_user.email}
    response = unauth_client.post(url, data, format="json")

    assert response.status_code == status.HTTP_200_OK
    assert "If an account with this email exists" in response.data["detail"]

    # Check token was created
    assert OneTimeToken.objects.filter(user=active_user, token_type="password_reset").exists()


@pytest.mark.django_db
def test_password_reset_request_nonexistent_email(unauth_client):
    url = reverse("password-reset")
    data = {"email": "nonexistent@example.com"}
    response = unauth_client.post(url, data, format="json")

    # Should return same response for security
    assert response.status_code == status.HTTP_200_OK
    assert "If an account with this email exists" in response.data["detail"]


@pytest.mark.django_db
def test_password_reset_request_missing_email(unauth_client):
    url = reverse("password-reset")
    response = unauth_client.post(url, {}, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.data["detail"] == "Email is required"


@pytest.mark.django_db
def test_password_reset_confirm_success(unauth_client, password_reset_token):
    url = reverse("confirm-password-reset")
    data = {"token": password_reset_token.token, "password": "newpassword123"}
    response = unauth_client.post(url, data, format="json")

    assert response.status_code == status.HTTP_200_OK
    assert "token" in response.data
    assert "refresh" in response.data
    assert "user" in response.data

    password_reset_token.user.refresh_from_db()
    assert password_reset_token.user.check_password("newpassword123")
    assert password_reset_token.user.is_active

    # Token should be deleted after use
    assert not OneTimeToken.objects.filter(id=password_reset_token.id).exists()


@pytest.mark.django_db
def test_password_reset_confirm_invalid_token(unauth_client):
    url = reverse("confirm-password-reset")
    data = {"token": "invalid_token", "password": "newpassword123"}
    response = unauth_client.post(url, data, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.data["detail"] == "Invalid or expired token."


@pytest.mark.django_db
def test_password_reset_confirm_expired_token(unauth_client, active_user):
    expired_token = OneTimeToken.create_token(active_user, "password_reset", ttl_minutes=0)
    url = reverse("confirm-password-reset")
    data = {"token": expired_token.token, "password": "newpassword123"}
    response = unauth_client.post(url, data, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.data["detail"] == "Token has expired"


@pytest.mark.django_db
def test_password_reset_confirm_missing_data(unauth_client):
    url = reverse("confirm-password-reset")
    response = unauth_client.post(url, {}, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.data["detail"] == "Token and new password are required."


# ----- CURRENT USER TESTS -----


@pytest.mark.django_db
def test_get_current_user_success(auth_client, active_user):
    url = reverse("current-user")
    response = auth_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["email"] == active_user.email
    assert response.data["first_name"] == active_user.first_name
    assert response.data["last_name"] == active_user.last_name


@pytest.mark.django_db
def test_get_current_user_without_authentication(unauth_client):
    url = reverse("current-user")
    response = unauth_client.get(url)

    assert response.status_code == status.HTTP_401_UNAUTHORIZED