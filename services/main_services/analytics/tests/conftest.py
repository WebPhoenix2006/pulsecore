import pytest
from rest_framework.test import APIClient
from decimal import Decimal
from django.utils import timezone
import uuid
import datetime

from main_services.orders.models import Order, OrderItem
from main_services.inventory.models import SKU
from main_services.catalog.models import Category, Product


@pytest.fixture
def tenant_id():
    """Generate a unique tenant ID for tests."""
    return uuid.uuid4()


@pytest.fixture
def auth_client(django_user_model):
    """
    Creates a test user and returns an authenticated DRF APIClient.
    """
    user = django_user_model.objects.create_user(
        email="analytics_test@example.com",
        password="test_password123",
        username="analytics_testuser",
    )
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def test_category(tenant_id):
    """Create a test category for products."""
    return Category.objects.create(
        tenant_id=tenant_id, name="Test Category", description="Category for testing"
    )


@pytest.fixture
def test_product(tenant_id, test_category):
    """Create a test product."""
    return Product.objects.create(
        tenant_id=tenant_id,
        name="Test Product",
        category=test_category,
        price=Decimal("10.00")
    )


@pytest.fixture
def test_skus(tenant_id):
    """Create multiple test SKUs for analytics testing."""
    skus = []
    for i in range(5):
        sku = SKU.objects.create(
            tenant_id=tenant_id,
            name=f"Test SKU {i+1}",
            sku_code=f"SKU-TEST-{i+1:03d}",
            category="Test Category",
            stock_level=100 + i * 10,
            reorder_threshold=20,
            price=Decimal(f"{10 + i * 5}.00"),
        )
        skus.append(sku)
    return skus


@pytest.fixture
def low_stock_skus(tenant_id):
    """Create SKUs with low stock levels."""
    skus = []
    for i in range(3):
        sku = SKU.objects.create(
            tenant_id=tenant_id,
            name=f"Low Stock SKU {i+1}",
            sku_code=f"SKU-LOW-{i+1:03d}",
            category="Test Category",
            stock_level=5 + i,  # Below reorder threshold
            reorder_threshold=20,
            price=Decimal("15.00"),
        )
        skus.append(sku)
    return skus


@pytest.fixture
def stockout_skus(tenant_id):
    """Create SKUs with zero or negative stock."""
    skus = []
    for i in range(2):
        sku = SKU.objects.create(
            tenant_id=tenant_id,
            name=f"Stockout SKU {i+1}",
            sku_code=f"SKU-OUT-{i+1:03d}",
            category="Test Category",
            stock_level=0,
            reorder_threshold=10,
            price=Decimal("20.00"),
        )
        skus.append(sku)
    return skus


@pytest.fixture
def test_orders(tenant_id, test_skus):
    """Create test orders with items for analytics testing."""
    orders = []
    today = timezone.now()

    for i in range(5):
        # Create orders over the past 5 days
        created_time = today - datetime.timedelta(days=i)

        # Calculate total amount
        total_amount = Decimal("0.00")
        for j in range(2 + (i % 2)):
            sku = test_skus[j % len(test_skus)]
            quantity = 1 + (i % 3)
            total_amount += sku.price * quantity

        order = Order.objects.create(
            tenant_id=tenant_id,
            customer_name=f"Customer {i+1}",
            status="completed" if i < 3 else "processing",
            payment_status="paid",
            total_amount=total_amount,
            created_at=created_time,
        )

        # Add 2-3 items to each order
        for j in range(2 + (i % 2)):
            sku = test_skus[j % len(test_skus)]
            quantity = 1 + (i % 3)

            OrderItem.objects.create(
                order=order,
                sku_id=sku.sku_id,
                quantity=quantity
            )

        orders.append(order)

    return orders


@pytest.fixture
def analytics_date():
    """Provide a consistent date for analytics testing."""
    return timezone.localdate()


@pytest.fixture
def date_range():
    """Provide a date range for analytics testing."""
    end_date = timezone.localdate()
    start_date = end_date - datetime.timedelta(days=30)
    return {"start_date": start_date, "end_date": end_date}


@pytest.fixture
def sample_top_skus_data(test_skus):
    """Sample top SKUs data structure for testing."""
    return [
        {"sku_id": str(test_skus[0].sku_id), "revenue": 500.00},
        {"sku_id": str(test_skus[1].sku_id), "revenue": 350.00},
        {"sku_id": str(test_skus[2].sku_id), "revenue": 200.00},
    ]
