import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.fixture
def api_client(db):
    return APIClient()


@pytest.fixture
def auth_client(api_client):
    """Authenticated API client with test user + tenant header"""
    user = User.objects.create_user(email="test@example.com", password="password123")
    api_client.force_authenticate(user=user)
    api_client.credentials(HTTP_X_TENANT_ID="11111111-1111-1111-1111-111111111111")
    return api_client


@pytest.fixture
def unauth_client(api_client):
    """No authentication, but it has a tenant header"""
    api_client.credentials(HTTP_X_TENANT_ID="11111111-1111-1111-1111-111111111111")
    return api_client
