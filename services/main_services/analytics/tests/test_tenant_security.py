"""
Test tenant isolation security in analytics views.
"""
import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.mark.django_db
class TestTenantSecurity:
    """Test that users cannot access other tenants' analytics data."""

    def setup_method(self):
        self.client = APIClient()

        # Create two users with different tenant_ids
        self.user1 = User.objects.create_user(
            email="user1@example.com",
            password="testpass123",
            first_name="User",
            last_name="One"
        )
        self.tenant1_id = str(self.user1.tenant_id)

        self.user2 = User.objects.create_user(
            email="user2@example.com",
            password="testpass123",
            first_name="User",
            last_name="Two"
        )
        self.tenant2_id = str(self.user2.tenant_id)

    def test_dashboard_rejects_wrong_tenant(self):
        """Dashboard should reject requests with mismatched tenant_id."""
        self.client.force_authenticate(user=self.user1)

        # Try to access user2's tenant data while authenticated as user1
        url = reverse("analytics-dashboard")
        response = self.client.get(url, HTTP_X_TENANT_ID=self.tenant2_id)

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "permission" in response.data["detail"].lower()

    def test_dashboard_allows_own_tenant(self):
        """Dashboard should allow requests with matching tenant_id."""
        self.client.force_authenticate(user=self.user1)

        # Access own tenant data
        url = reverse("analytics-dashboard")
        response = self.client.get(url, HTTP_X_TENANT_ID=self.tenant1_id)

        # Should succeed (even if data is empty)
        assert response.status_code == status.HTTP_200_OK

    def test_sales_list_rejects_wrong_tenant(self):
        """Sales list should reject requests with mismatched tenant_id."""
        self.client.force_authenticate(user=self.user1)

        url = reverse("analytics-sales-list")
        response = self.client.get(url, HTTP_X_TENANT_ID=self.tenant2_id)

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_stock_list_rejects_wrong_tenant(self):
        """Stock list should reject requests with mismatched tenant_id."""
        self.client.force_authenticate(user=self.user1)

        url = reverse("analytics-stock-list")
        response = self.client.get(url, HTTP_X_TENANT_ID=self.tenant2_id)

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_stockout_list_rejects_wrong_tenant(self):
        """Stockout list should reject requests with mismatched tenant_id."""
        self.client.force_authenticate(user=self.user1)

        url = reverse("analytics-stockouts-list")
        response = self.client.get(url, HTTP_X_TENANT_ID=self.tenant2_id)

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_export_rejects_wrong_tenant(self):
        """Export should reject requests with mismatched tenant_id."""
        self.client.force_authenticate(user=self.user1)

        url = reverse("analytics-export")
        response = self.client.get(
            url,
            {"metric": "sales"},
            HTTP_X_TENANT_ID=self.tenant2_id
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_missing_tenant_header_returns_400(self):
        """All endpoints should return 400 if X-Tenant-ID header is missing."""
        self.client.force_authenticate(user=self.user1)

        url = reverse("analytics-dashboard")
        response = self.client.get(url)  # No header

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "X-Tenant-ID" in str(response.data)

    def test_unauthenticated_request_rejected(self):
        """Unauthenticated requests should be rejected."""
        # Don't authenticate
        url = reverse("analytics-dashboard")
        response = self.client.get(url, HTTP_X_TENANT_ID=self.tenant1_id)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
