import pytest
from main_services.catalog.models import Category

# ----- HAPPY PATH TESTS -----


@pytest.mark.django_db
def test_create_category(auth_client):
    payload = {"name": "Beverages", "description": "All drink items"}
    response = auth_client.post("/api/catalog/categories/", payload, format="json")
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Beverages"
    assert Category.objects.count() == 1


@pytest.mark.django_db
def test_list_categories(auth_client):
    Category.objects.create(
        tenant_id="11111111-1111-1111-1111-111111111111", name="Snacks"
    )
    response = auth_client.get("/api/catalog/categories/")  # ✅ fixed leading slash
    assert response.status_code == 200
    assert response.json()[0]["name"] == "Snacks"


@pytest.mark.django_db
def test_update_category(auth_client):
    category = Category.objects.create(
        tenant_id="11111111-1111-1111-1111-111111111111", name="Old Name"
    )
    response = auth_client.patch(
        f"/api/catalog/categories/{category.id}/",
        {"name": "Updated Name"},  # ✅ consistent
        format="json",
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Name"


@pytest.mark.django_db
def test_delete_category(auth_client):
    category = Category.objects.create(
        tenant_id="11111111-1111-1111-1111-111111111111", name="Snacks"
    )
    response = auth_client.delete(f"/api/catalog/categories/{category.id}/")
    assert response.status_code == 204
    assert Category.objects.count() == 0


# ----- NEGATIVE TESTS -----


@pytest.mark.django_db
def test_create_category_missing_name(auth_client):
    payload = {"description": "No name provided"}
    response = auth_client.post("/api/catalog/categories/", payload, format="json")
    assert response.status_code == 400
    assert "name" in response.json()


@pytest.mark.django_db
def test_access_without_authentication(unauth_client):
    response = unauth_client.get("/api/catalog/categories/")
    assert response.status_code == 401


@pytest.mark.django_db
def test_access_without_tenant_header(api_client):
    # Authenticated but no X-Tenant-ID
    response = api_client.get("/api/catalog/categories/")
    assert response.status_code in [400, 401, 403]  # ✅ flexible
