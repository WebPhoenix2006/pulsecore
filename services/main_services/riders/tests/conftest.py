import pytest
import uuid
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from authentication.models import User
from main_services.riders.models import Rider, DispatchOrder

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def tenant_id():
    return uuid.uuid4()


@pytest.fixture
def test_user(tenant_id):
    return User.objects.create_user(
        email="testuser@example.com",
        username="testuser",
        password="testpass123",
        tenant_id=tenant_id,
        is_active=True,
    )


@pytest.fixture
def auth_headers(test_user, tenant_id):
    refresh = RefreshToken.for_user(test_user)
    access_token = refresh.access_token
    return {
        "HTTP_AUTHORIZATION": f"Bearer {access_token}",
        "HTTP_X_TENANT_ID": str(tenant_id),
    }


@pytest.fixture
def test_rider(tenant_id):
    return Rider.objects.create(
        tenant_id=tenant_id,
        first_name="John",
        last_name="Doe",
        email="john.doe@example.com",
        phone="123-456-7890",
        vehicle_type="motorcycle",
        vehicle_plate="ABC-123",
        location={"latitude": 40.7128, "longitude": -74.0060}
    )


@pytest.fixture
def inactive_rider(tenant_id):
    return Rider.objects.create(
        tenant_id=tenant_id,
        first_name="Jane",
        last_name="Smith",
        email="jane.smith@example.com",
        phone="098-765-4321",
        vehicle_type="bicycle",
        status="inactive"
    )


@pytest.fixture
def test_dispatch_order(tenant_id):
    return DispatchOrder.objects.create(
        tenant_id=tenant_id,
        order_id=uuid.uuid4(),
        customer_name="Customer Test",
        customer_phone="555-0123",
        pickup_address="123 Pickup St, City",
        delivery_address="456 Delivery Ave, City",
        pickup_location={"latitude": 40.7128, "longitude": -74.0060},
        delivery_location={"latitude": 40.7614, "longitude": -73.9776},
        priority="medium",
        estimated_duration=30,
        distance=5.5
    )


@pytest.fixture
def assigned_dispatch_order(tenant_id, test_rider):
    from django.utils import timezone
    order = DispatchOrder.objects.create(
        tenant_id=tenant_id,
        rider=test_rider,
        order_id=uuid.uuid4(),
        customer_name="Assigned Customer",
        customer_phone="555-0456",
        pickup_address="789 Assigned St, City",
        delivery_address="321 Assigned Ave, City",
        status="assigned",
        priority="high",
        assigned_at=timezone.now()
    )
    return order


@pytest.fixture
def other_tenant_id():
    return uuid.uuid4()


@pytest.fixture
def other_tenant_rider(other_tenant_id):
    return Rider.objects.create(
        tenant_id=other_tenant_id,
        first_name="Other",
        last_name="Tenant",
        email="other@tenant.com",
        phone="000-000-0000",
        vehicle_type="car"
    )