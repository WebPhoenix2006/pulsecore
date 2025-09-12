import pytest
import uuid
from datetime import timedelta
from django.utils import timezone
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from main_services.inventory.models import SKU, Batch, StockAdjustment, Alert

User = get_user_model()


# --------------------------
# Fixtures
# --------------------------
@pytest.fixture
def db_client(db):
    return APIClient()


@pytest.fixture
def tenant_uuid():
    return uuid.uuid4()


@pytest.fixture
def auth_client(db_client, tenant_uuid):
    user = User.objects.create_user(email="test@example.com", password="pass")
    db_client.force_authenticate(user=user)
    db_client.credentials(HTTP_X_TENANT_ID=str(tenant_uuid))
    return db_client


@pytest.fixture
def sku(db, tenant_uuid):
    return SKU.objects.create(
        name="TestSKU",
        tenant_id=tenant_uuid,
        category="Beverage",
        stock_level=10,
        reorder_threshold=5,
        track_batches=True,
    )


@pytest.fixture
def another_tenant_sku(db):
    return SKU.objects.create(
        name="OtherTenantSKU",
        tenant_id=uuid.uuid4(),
        category="Other",
        stock_level=100,
    )


@pytest.fixture
def batch(sku):
    # NOTE: don't set remaining_quantity explicitly — model.save() handles it.
    return Batch.objects.create(
        sku=sku,
        tenant_id=sku.tenant_id,
        batch_number="B123",
        quantity=20,
        received_at=timezone.now().date(),
        expiry_date=timezone.now().date() + timedelta(days=25),
        cost_price=5.0,
    )


# --------------------------
# SKU Tests
# --------------------------
@pytest.mark.django_db
def test_create_sku(auth_client):
    url = "/api/inventory/skus/"
    data = {"name": "Coke 1L", "category": "Beverage", "price": 1.99}
    resp = auth_client.post(url, data, format="json")
    assert resp.status_code == 201
    assert resp.data["name"] == "Coke 1L"
    assert resp.data["stock_level"] == 0


@pytest.mark.django_db
def test_adjust_stock_triggers_stockadjustment_and_lowstock(sku):
    adjusted_sku, adjustment = sku.adjust_stock(delta=-6, reason="sale")
    sku.refresh_from_db()
    assert sku.stock_level == 4

    adj = StockAdjustment.objects.filter(sku=sku).first()
    assert adj is not None
    assert adj.quantity == -6

    alert = Alert.objects.filter(sku=sku, type=Alert.Type.LOW_STOCK).first()
    assert alert is not None
    assert alert.current_stock == 4


@pytest.mark.django_db
def test_adjust_stock_with_batch(sku, batch):
    adjusted_sku, adjustment = sku.adjust_stock(delta=-5, reason="sale", batch=batch)
    # refresh the batch to get concrete remaining_quantity after F() update
    batch.refresh_from_db()
    assert batch.remaining_quantity == 15
    # double-check stock adjusted properly
    sku.refresh_from_db()
    assert sku.stock_level == 5


@pytest.mark.django_db
def test_tenant_isolation(auth_client, another_tenant_sku):
    resp = auth_client.get(f"/api/inventory/skus/{another_tenant_sku.sku_id}/")
    assert resp.status_code == 404


# --------------------------
# Batch Tests
# --------------------------
@pytest.mark.django_db
def test_batch_defaults_remaining_quantity(sku):
    b = Batch.objects.create(
        sku=sku,
        tenant_id=sku.tenant_id,
        batch_number="B999",
        quantity=50,
    )
    # model.save() should set remaining_quantity == quantity
    assert b.remaining_quantity == 50


@pytest.mark.django_db
def test_batch_expiry_alert_created(batch):
    # refresh from DB to ensure signal committed
    batch.refresh_from_db()
    alert = Alert.objects.filter(sku=batch.sku, type=Alert.Type.BATCH_EXPIRY).first()
    assert alert is not None
    assert alert.current_stock == batch.remaining_quantity


# --------------------------
# Alert Tests
# --------------------------
@pytest.mark.django_db
def test_acknowledge_alert(sku):
    alert = Alert.objects.create(
        sku=sku,
        tenant_id=sku.tenant_id,
        sku_name=sku.name,
        current_stock=0,
        threshold=5,
        type=Alert.Type.LOW_STOCK,
    )
    alert.acknowledge(
        user=User.objects.create_user(email="ack@example.com", password="pass")
    )
    alert.refresh_from_db()
    assert alert.acknowledged is True
    assert alert.acknowledged_by.email == "ack@example.com"


# --------------------------
# StockAdjustment Read Tests
# --------------------------
@pytest.mark.django_db
def test_stockadjustment_list(sku):
    sku.adjust_stock(delta=5, reason="purchase")
    adjustments = StockAdjustment.objects.filter(sku=sku)
    assert adjustments.exists()
    assert adjustments.first().quantity == 5
