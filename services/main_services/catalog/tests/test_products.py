import pytest
from main_services.catalog.models import Product, Category

# ---------- HAPPY PATH TESTS ----------


@pytest.mark.django_db
def test_create_product(auth_client):
    category = Category.objects.create(
        tenant_id="11111111-1111-1111-1111-111111111111", name="Beverages"
    )
    payload = {
        "name": "Coca-Cola 1L",
        "category": str(category.id),
        "price": "2.50",
        "barcode": "1234567890",
        "attributes": {"flavor": "original"},
    }
    response = auth_client.post("/api/catalog/products/", payload, format="json")
    assert response.status_code == 201
    assert Product.objects.count() == 1


@pytest.mark.django_db
def test_list_products(auth_client):
    Product.objects.create(
        tenant_id="11111111-1111-1111-1111-111111111111",
        name="Fanta 1L",
        price=2.00,
    )
    response = auth_client.get("/api/catalog/products/")
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert data["results"][0]["name"] == "Fanta 1L"


@pytest.mark.django_db
def test_update_product(auth_client):
    product = Product.objects.create(
        tenant_id="11111111-1111-1111-1111-111111111111",
        name="Old Product",
        price=5.00,
    )
    response = auth_client.patch(
        f"/api/catalog/products/{product.sku_id}/",
        {"name": "Updated Product"},
        format="json",
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Product"


@pytest.mark.django_db
def test_delete_product(auth_client):
    product = Product.objects.create(
        tenant_id="11111111-1111-1111-1111-111111111111",
        name="Fanta 1L",
        price=2.00,
    )
    response = auth_client.delete(f"/api/catalog/products/{product.sku_id}/")
    assert response.status_code == 204
    assert Product.objects.count() == 0


# ---------- NEGATIVE TESTS ----------


@pytest.mark.django_db
def test_create_product_missing_required_fields(auth_client):
    payload = {"price": "3.00"}  # missing name
    response = auth_client.post("/api/catalog/products/", payload, format="json")
    assert response.status_code == 400
    assert "name" in response.json()


@pytest.mark.django_db
def test_create_product_invalid_category(auth_client):
    payload = {"name": "Sprite 1L", "category": "not-a-uuid", "price": "2.00"}
    response = auth_client.post("/api/catalog/products/", payload, format="json")
    assert response.status_code == 400


@pytest.mark.django_db
def test_retrieve_product_invalid_uuid(auth_client):
    response = auth_client.get("/api/catalog/products/not-a-uuid/")
    assert response.status_code == 404 or response.status_code == 400


@pytest.mark.django_db
def test_access_without_tenant_header(api_client):
    response = api_client.get("/api/catalog/products/")
    assert response.status_code in [400, 401, 403]
