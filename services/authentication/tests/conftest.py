import pytest
import uuid
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from authentication.models import OneTimeToken

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def auth_client(api_client, db):
    """Authenticated API client with test user"""
    user = User.objects.create_user(
        email="test@example.com", password="testpassword123", is_active=True
    )
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def unauth_client():
    """Unauthenticated API client"""
    return APIClient()


@pytest.fixture
def inactive_user(db):
    """Create an inactive user for testing"""
    return User.objects.create_user(
        email="inactive@example.com", password="testpassword123", is_active=False
    )


@pytest.fixture
def active_user(db):
    """Create an active user for testing"""
    return User.objects.create_user(
        email="active@example.com", password="testpassword123", is_active=True
    )


@pytest.fixture
def email_verification_token(inactive_user):
    """Create email verification token for inactive user"""
    return OneTimeToken.create_token(inactive_user, "email_verify")


@pytest.fixture
def password_reset_token(active_user):
    """Create password reset token for active user"""
    return OneTimeToken.create_token(active_user, "password_reset")


@pytest.fixture
def valid_register_data():
    """Valid user registration data"""
    return {
        "email": "newuser@example.com",
        "password": "newpassword123",
        "confirm_password": "newpassword123",
        "first_name": "New",
        "last_name": "User",
    }


@pytest.fixture
def valid_login_data():
    """Valid login credentials"""
    return {"email": "test@example.com", "password": "testpassword123"}