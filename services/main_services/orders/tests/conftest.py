import pytest
from rest_framework.test import APIClient
import uuid


@pytest.fixture
def tenant_id():
    return str(uuid.uuid4())


@pytest.fixture
def auth_client(django_user_model):
    """
    Creates a test user and returns an authenticated DRF APIClient.
    """
    user = django_user_model.objects.create_user(
        email="test@example.com",
        password="pass1234",
        username="testuser",
    )
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def order_payload():
    return {
        "customer_name": "John Doe",
        "items": [
            {"item_id": "item-001", "sku_id": str(uuid.uuid4()), "quantity": 2},
            {"item_id": "item-002", "sku_id": str(uuid.uuid4()), "quantity": 1},
        ],
        "status": "pending",
        "payment_status": "unpaid",
    }
