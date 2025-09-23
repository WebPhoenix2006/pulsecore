# suppliers/tests/test_suppliers.py
import uuid
import pytest
from rest_framework.test import APIClient
from django.urls import reverse
from django.contrib.auth import get_user_model

from main_services.suppliers.models import Supplier, PurchaseOrder, PurchaseOrderItem


@pytest.fixture
def api_client(db):
    client = APIClient()
    User = get_user_model()
    user = User.objects.create_user(
        email="tester@example.com",
        password="pass123",
    )
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def tenant_id():
    return uuid.uuid4()


@pytest.fixture
def auth_headers(tenant_id):
    return {"HTTP_X_Tenant_ID": str(tenant_id)}


# ----------------------------
# SUPPLIER TESTS
# ----------------------------


@pytest.mark.django_db
def test_create_supplier(api_client, auth_headers, tenant_id):
    url = reverse("supplier-list")
    payload = {"name": "Test Supplier", "email": "test@supplier.com"}
    response = api_client.post(url, payload, format="json", **auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Supplier"
    assert str(tenant_id) == data["tenant_id"]


@pytest.mark.django_db
def test_list_suppliers(api_client, auth_headers, tenant_id):
    Supplier.objects.create(tenant_id=tenant_id, name="Supplier A", email="a@test.com")
    url = reverse("supplier-list")
    response = api_client.get(url, **auth_headers)
    assert response.status_code == 200
    results = response.json()["results"]
    assert any(s["name"] == "Supplier A" for s in results)


@pytest.mark.django_db
def test_supplier_requires_tenant_id(api_client):
    url = reverse("supplier-list")
    response = api_client.get(url)  # missing header
    assert response.status_code in (401, 403)


@pytest.mark.django_db
def test_update_supplier(api_client, auth_headers, tenant_id):
    supplier = Supplier.objects.create(tenant_id=tenant_id, name="Old Name")
    url = reverse("supplier-detail", args=[supplier.supplier_id])
    payload = {"name": "New Name"}
    response = api_client.patch(url, payload, format="json", **auth_headers)
    assert response.status_code == 200
    supplier.refresh_from_db()
    assert supplier.name == "New Name"


@pytest.mark.django_db
def test_delete_supplier(api_client, auth_headers, tenant_id):
    supplier = Supplier.objects.create(tenant_id=tenant_id, name="To Delete")
    url = reverse("supplier-detail", args=[supplier.supplier_id])
    response = api_client.delete(url, **auth_headers)
    assert response.status_code == 204
    assert Supplier.objects.count() == 0


# ----------------------------
# PURCHASE ORDER TESTS
# ----------------------------


@pytest.mark.django_db
def test_create_purchase_order(api_client, auth_headers, tenant_id):
    supplier = Supplier.objects.create(tenant_id=tenant_id, name="Supplier B")
    url = reverse("purchaseorder-list")
    payload = {
        "supplier": str(supplier.supplier_id),
        "reference": "PO-001",
        "status": "draft",
        "items": [
            {
                "sku_id": str(uuid.uuid4()),
                "name": "Item 1",
                "quantity": 2,
                "unit_cost": "50.00",
            },
            {
                "sku_id": str(uuid.uuid4()),
                "name": "Item 2",
                "quantity": 1,
                "unit_cost": "100.00",
            },
        ],
    }
    response = api_client.post(url, payload, format="json", **auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["reference"] == "PO-001"
    assert float(data["total_cost"]) == 200.0


@pytest.mark.django_db
def test_retrieve_purchase_order(api_client, auth_headers, tenant_id):
    supplier = Supplier.objects.create(tenant_id=tenant_id, name="Supplier C")
    po = PurchaseOrder.objects.create(
        tenant_id=tenant_id, supplier=supplier, reference="PO-XYZ"
    )
    PurchaseOrderItem.objects.create(
        purchase_order=po,
        sku_id=uuid.uuid4(),
        name="Rice Bag",
        quantity=5,
        unit_cost=20,
    )
    url = reverse("purchaseorder-detail", args=[po.po_id])
    response = api_client.get(url, **auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert float(data["total_cost"]) == 100.0


@pytest.mark.django_db
def test_update_purchase_order(api_client, auth_headers, tenant_id):
    supplier = Supplier.objects.create(tenant_id=tenant_id, name="Supplier D")
    po = PurchaseOrder.objects.create(
        tenant_id=tenant_id, supplier=supplier, reference="PO-OLD"
    )
    url = reverse("purchaseorder-detail", args=[po.po_id])
    payload = {"reference": "PO-NEW"}
    response = api_client.patch(url, payload, format="json", **auth_headers)
    assert response.status_code == 200
    po.refresh_from_db()
    assert po.reference == "PO-NEW"


@pytest.mark.django_db
def test_delete_purchase_order(api_client, auth_headers, tenant_id):
    supplier = Supplier.objects.create(tenant_id=tenant_id, name="Supplier E")
    po = PurchaseOrder.objects.create(
        tenant_id=tenant_id, supplier=supplier, reference="PO-DEL"
    )
    url = reverse("purchaseorder-detail", args=[po.po_id])
    response = api_client.delete(url, **auth_headers)
    assert response.status_code == 204
    assert PurchaseOrder.objects.count() == 0


@pytest.mark.django_db
def test_create_po_invalid_status(api_client, auth_headers, tenant_id):
    supplier = Supplier.objects.create(tenant_id=tenant_id, name="Supplier F")
    url = reverse("purchaseorder-list")
    payload = {
        "supplier": str(supplier.supplier_id),
        "status": "invalid_status",
        "items": [],
    }
    response = api_client.post(url, payload, format="json", **auth_headers)
    assert response.status_code == 400


@pytest.mark.django_db
def test_export_po_pdf(api_client, auth_headers, tenant_id):
    supplier = Supplier.objects.create(tenant_id=tenant_id, name="Supplier G")
    po = PurchaseOrder.objects.create(
        tenant_id=tenant_id, supplier=supplier, reference="PO-PDF"
    )
    url = reverse("purchaseorder-export-pdf", args=[po.po_id])
    response = api_client.get(url, **auth_headers)
    assert response.status_code == 200
    assert response["Content-Type"] == "application/pdf"
