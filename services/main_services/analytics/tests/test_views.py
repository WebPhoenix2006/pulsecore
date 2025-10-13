"""
End-to-end tests for analytics API views.

Tests cover:
- Dashboard API endpoint
- Sales analytics endpoints
- Stock analytics endpoints
- Stockout incidents endpoints
- Export functionality
- Authentication and authorization
- Tenant isolation
"""

import pytest
from decimal import Decimal
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
import datetime
import uuid

from main_services.analytics.models import (
    AnalyticsDailySales,
    AnalyticsDailyStock,
    AnalyticsDailyTopSKU,
    StockoutIncident,
)


@pytest.mark.django_db
class TestDashboardAPIView:
    """Test cases for Dashboard API view."""

    def test_dashboard_requires_authentication(self, client, tenant_id):
        """Test that dashboard endpoint requires authentication."""
        url = reverse("analytics-dashboard")
        response = client.get(url, HTTP_X_TENANT_ID=str(tenant_id))

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_dashboard_requires_tenant_header(self, auth_client):
        """Test that dashboard endpoint requires X-Tenant-ID header."""
        url = reverse("analytics-dashboard")
        response = auth_client.get(url)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_dashboard_returns_empty_data_no_analytics(self, auth_client, tenant_id):
        """Test dashboard returns empty data when no analytics exist."""
        url = reverse("analytics-dashboard")
        response = auth_client.get(url, HTTP_X_TENANT_ID=str(tenant_id))

        assert response.status_code == status.HTTP_200_OK
        data = response.data
        assert data["stock_total"] == 0
        assert data["low_stock_count"] == 0
        assert data["stockout_count"] == 0
        assert data["sales_count"] == 0
        assert data["revenue_total"] == "0.00"

    def test_dashboard_returns_aggregated_data(self, auth_client, tenant_id, sample_top_skus_data):
        """Test dashboard returns correctly aggregated data."""
        today = timezone.localdate()
        yesterday = today - datetime.timedelta(days=1)

        # Create sales data for multiple days
        AnalyticsDailySales.objects.create(
            tenant_id=tenant_id,
            date=today,
            total_orders=10,
            total_items=25,
            total_revenue=Decimal("500.00"),
            top_skus=sample_top_skus_data
        )

        AnalyticsDailySales.objects.create(
            tenant_id=tenant_id,
            date=yesterday,
            total_orders=5,
            total_items=15,
            total_revenue=Decimal("300.00"),
            top_skus=[]
        )

        # Create stock data
        AnalyticsDailyStock.objects.create(
            tenant_id=tenant_id,
            date=today,
            total_stock=1000,
            low_stock_count=5,
            stockout_count=2
        )

        url = reverse("analytics-dashboard")
        response = auth_client.get(url, HTTP_X_TENANT_ID=str(tenant_id))

        assert response.status_code == status.HTTP_200_OK
        data = response.data

        # Check aggregated values
        assert data["sales_count"] == 15  # 10 + 5
        assert data["revenue_total"] == "800.00"  # 500 + 300
        assert data["stock_total"] == 1000
        assert data["low_stock_count"] == 5
        assert data["stockout_count"] == 2

        # Check that top SKUs from latest sales are returned
        assert len(data["top_skus"]) == len(sample_top_skus_data)

    def test_dashboard_respects_date_range(self, auth_client, tenant_id):
        """Test dashboard filters data by date range."""
        today = timezone.localdate()
        five_days_ago = today - datetime.timedelta(days=5)
        ten_days_ago = today - datetime.timedelta(days=10)
        forty_days_ago = today - datetime.timedelta(days=40)

        # Create sales within range
        AnalyticsDailySales.objects.create(
            tenant_id=tenant_id,
            date=five_days_ago,
            total_orders=10,
            total_revenue=Decimal("500.00")
        )

        # Create sales outside default 30-day range
        AnalyticsDailySales.objects.create(
            tenant_id=tenant_id,
            date=forty_days_ago,
            total_orders=5,
            total_revenue=Decimal("300.00")
        )

        url = reverse("analytics-dashboard")
        response = auth_client.get(url, HTTP_X_TENANT_ID=str(tenant_id))

        assert response.status_code == status.HTTP_200_OK
        # Should only include data from last 30 days
        assert response.data["sales_count"] == 10
        assert response.data["revenue_total"] == "500.00"

    def test_dashboard_custom_date_range(self, auth_client, tenant_id):
        """Test dashboard with custom start_date and end_date parameters."""
        today = timezone.localdate()
        seven_days_ago = today - datetime.timedelta(days=7)
        three_days_ago = today - datetime.timedelta(days=3)

        # Create sales data
        AnalyticsDailySales.objects.create(
            tenant_id=tenant_id,
            date=seven_days_ago,
            total_orders=5,
            total_revenue=Decimal("250.00")
        )

        AnalyticsDailySales.objects.create(
            tenant_id=tenant_id,
            date=three_days_ago,
            total_orders=10,
            total_revenue=Decimal("500.00")
        )

        url = reverse("analytics-dashboard")
        response = auth_client.get(
            url,
            {
                "start_date": str(seven_days_ago),
                "end_date": str(today)
            },
            HTTP_X_TENANT_ID=str(tenant_id)
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["sales_count"] == 15

    def test_dashboard_tenant_isolation(self, auth_client):
        """Test that dashboard only returns data for the specified tenant."""
        tenant_1 = uuid.uuid4()
        tenant_2 = uuid.uuid4()
        today = timezone.localdate()

        # Create data for tenant 1
        AnalyticsDailySales.objects.create(
            tenant_id=tenant_1,
            date=today,
            total_orders=10,
            total_revenue=Decimal("500.00")
        )

        # Create data for tenant 2
        AnalyticsDailySales.objects.create(
            tenant_id=tenant_2,
            date=today,
            total_orders=20,
            total_revenue=Decimal("1000.00")
        )

        url = reverse("analytics-dashboard")
        response = auth_client.get(url, HTTP_X_TENANT_ID=str(tenant_1))

        assert response.status_code == status.HTTP_200_OK
        # Should only return data for tenant 1
        assert response.data["sales_count"] == 10
        assert response.data["revenue_total"] == "500.00"


@pytest.mark.django_db
class TestSalesAnalyticsListView:
    """Test cases for Sales Analytics List view."""

    def test_sales_list_requires_authentication(self, client, tenant_id):
        """Test that sales endpoint requires authentication."""
        url = reverse("analytics-sales-list")
        response = client.get(url, HTTP_X_TENANT_ID=str(tenant_id))

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_sales_list_requires_tenant_header(self, auth_client):
        """Test that sales endpoint requires X-Tenant-ID header."""
        url = reverse("analytics-sales-list")
        response = auth_client.get(url)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_sales_list_returns_data(self, auth_client, tenant_id):
        """Test sales list returns correct data."""
        today = timezone.localdate()

        # Create sales records
        AnalyticsDailySales.objects.create(
            tenant_id=tenant_id,
            date=today,
            total_orders=10,
            total_items=25,
            total_revenue=Decimal("500.00")
        )

        url = reverse("analytics-sales-list")
        response = auth_client.get(url, HTTP_X_TENANT_ID=str(tenant_id))

        assert response.status_code == status.HTTP_200_OK
        # Handle both paginated and non-paginated responses
        data = response.data.get("results", response.data) if isinstance(response.data, dict) else response.data
        assert len(data) > 0
        assert data[0]["total_orders"] == 10
        assert data[0]["total_revenue"] == "500.00"

    def test_sales_list_filters_by_date_range(self, auth_client, tenant_id):
        """Test sales list filters by date range."""
        today = timezone.localdate()
        week_ago = today - datetime.timedelta(days=7)
        month_ago = today - datetime.timedelta(days=35)

        # Create sales for different dates
        AnalyticsDailySales.objects.create(
            tenant_id=tenant_id,
            date=today,
            total_orders=10,
            total_revenue=Decimal("500.00")
        )

        AnalyticsDailySales.objects.create(
            tenant_id=tenant_id,
            date=month_ago,
            total_orders=5,
            total_revenue=Decimal("250.00")
        )

        url = reverse("analytics-sales-list")
        response = auth_client.get(
            url,
            {"start_date": str(week_ago), "end_date": str(today)},
            HTTP_X_TENANT_ID=str(tenant_id)
        )

        assert response.status_code == status.HTTP_200_OK
        # Handle pagination
        data = response.data.get("results", response.data) if isinstance(response.data, dict) else response.data
        # Should only return today's record
        assert len(data) == 1
        assert data[0]["total_orders"] == 10

    def test_sales_list_ordered_by_date(self, auth_client, tenant_id):
        """Test sales list is ordered by date."""
        today = timezone.localdate()
        yesterday = today - datetime.timedelta(days=1)

        # Create records in reverse order
        AnalyticsDailySales.objects.create(
            tenant_id=tenant_id,
            date=today,
            total_orders=10,
            total_revenue=Decimal("500.00")
        )

        AnalyticsDailySales.objects.create(
            tenant_id=tenant_id,
            date=yesterday,
            total_orders=5,
            total_revenue=Decimal("250.00")
        )

        url = reverse("analytics-sales-list")
        response = auth_client.get(url, HTTP_X_TENANT_ID=str(tenant_id))

        assert response.status_code == status.HTTP_200_OK
        # Handle pagination
        data = response.data.get("results", response.data) if isinstance(response.data, dict) else response.data
        # Should be ordered chronologically
        assert len(data) == 2
        assert data[0]["date"] == str(yesterday)
        assert data[1]["date"] == str(today)

    def test_sales_list_tenant_isolation(self, auth_client):
        """Test sales list respects tenant isolation."""
        tenant_1 = uuid.uuid4()
        tenant_2 = uuid.uuid4()
        today = timezone.localdate()

        # Create sales for different tenants
        AnalyticsDailySales.objects.create(
            tenant_id=tenant_1,
            date=today,
            total_orders=10,
            total_revenue=Decimal("500.00")
        )

        AnalyticsDailySales.objects.create(
            tenant_id=tenant_2,
            date=today,
            total_orders=20,
            total_revenue=Decimal("1000.00")
        )

        url = reverse("analytics-sales-list")
        response = auth_client.get(url, HTTP_X_TENANT_ID=str(tenant_1))

        assert response.status_code == status.HTTP_200_OK
        # Handle pagination
        data = response.data.get("results", response.data) if isinstance(response.data, dict) else response.data
        assert len(data) == 1
        assert data[0]["total_orders"] == 10


@pytest.mark.django_db
class TestStockAnalyticsListView:
    """Test cases for Stock Analytics List view."""

    def test_stock_list_requires_authentication(self, client, tenant_id):
        """Test that stock endpoint requires authentication."""
        url = reverse("analytics-stock-list")
        response = client.get(url, HTTP_X_TENANT_ID=str(tenant_id))

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_stock_list_returns_data(self, auth_client, tenant_id):
        """Test stock list returns correct data."""
        today = timezone.localdate()

        AnalyticsDailyStock.objects.create(
            tenant_id=tenant_id,
            date=today,
            total_stock=1000,
            low_stock_count=5,
            stockout_count=2
        )

        url = reverse("analytics-stock-list")
        response = auth_client.get(url, HTTP_X_TENANT_ID=str(tenant_id))

        assert response.status_code == status.HTTP_200_OK
        # Handle pagination
        data = response.data.get("results", response.data) if isinstance(response.data, dict) else response.data
        assert len(data) > 0
        assert data[0]["total_stock"] == 1000
        assert data[0]["low_stock_count"] == 5

    def test_stock_list_filters_by_date_range(self, auth_client, tenant_id):
        """Test stock list filters by date range."""
        today = timezone.localdate()
        week_ago = today - datetime.timedelta(days=7)
        month_ago = today - datetime.timedelta(days=35)

        # Create stock records for different dates
        AnalyticsDailyStock.objects.create(
            tenant_id=tenant_id,
            date=today,
            total_stock=1000
        )

        AnalyticsDailyStock.objects.create(
            tenant_id=tenant_id,
            date=month_ago,
            total_stock=800
        )

        url = reverse("analytics-stock-list")
        response = auth_client.get(
            url,
            {"start_date": str(week_ago), "end_date": str(today)},
            HTTP_X_TENANT_ID=str(tenant_id)
        )

        assert response.status_code == status.HTTP_200_OK
        # Handle pagination
        data = response.data.get("results", response.data) if isinstance(response.data, dict) else response.data
        # Should only return today's record
        assert len(data) == 1
        assert data[0]["total_stock"] == 1000

    def test_stock_list_tenant_isolation(self, auth_client):
        """Test stock list respects tenant isolation."""
        tenant_1 = uuid.uuid4()
        tenant_2 = uuid.uuid4()
        today = timezone.localdate()

        AnalyticsDailyStock.objects.create(
            tenant_id=tenant_1,
            date=today,
            total_stock=1000
        )

        AnalyticsDailyStock.objects.create(
            tenant_id=tenant_2,
            date=today,
            total_stock=2000
        )

        url = reverse("analytics-stock-list")
        response = auth_client.get(url, HTTP_X_TENANT_ID=str(tenant_1))

        assert response.status_code == status.HTTP_200_OK
        # Handle pagination
        data = response.data.get("results", response.data) if isinstance(response.data, dict) else response.data
        assert len(data) == 1
        assert data[0]["total_stock"] == 1000


@pytest.mark.django_db
class TestStockoutIncidentListView:
    """Test cases for Stockout Incident List view."""

    def test_stockout_list_requires_authentication(self, client, tenant_id):
        """Test that stockout endpoint requires authentication."""
        url = reverse("analytics-stockouts-list")
        response = client.get(url, HTTP_X_TENANT_ID=str(tenant_id))

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_stockout_list_returns_data(self, auth_client, tenant_id, test_skus):
        """Test stockout list returns correct data."""
        today = timezone.localdate()
        sku = test_skus[0]

        StockoutIncident.objects.create(
            tenant_id=tenant_id,
            sku_id=sku.sku_id,
            sku_name=sku.name,
            incident_date=today,
            note="Test stockout"
        )

        url = reverse("analytics-stockouts-list")
        response = auth_client.get(url, HTTP_X_TENANT_ID=str(tenant_id))

        assert response.status_code == status.HTTP_200_OK
        # Handle pagination
        data = response.data.get("results", response.data) if isinstance(response.data, dict) else response.data
        assert len(data) > 0
        assert data[0]["sku_name"] == sku.name
        assert data[0]["note"] == "Test stockout"

    def test_stockout_list_filters_by_date_range(self, auth_client, tenant_id, test_skus):
        """Test stockout list filters by date range."""
        today = timezone.localdate()
        week_ago = today - datetime.timedelta(days=7)
        month_ago = today - datetime.timedelta(days=35)
        sku = test_skus[0]

        # Create incidents for different dates
        StockoutIncident.objects.create(
            tenant_id=tenant_id,
            sku_id=sku.sku_id,
            sku_name=sku.name,
            incident_date=today
        )

        StockoutIncident.objects.create(
            tenant_id=tenant_id,
            sku_id=sku.sku_id,
            sku_name=sku.name,
            incident_date=month_ago
        )

        url = reverse("analytics-stockouts-list")
        response = auth_client.get(
            url,
            {"start_date": str(week_ago), "end_date": str(today)},
            HTTP_X_TENANT_ID=str(tenant_id)
        )

        assert response.status_code == status.HTTP_200_OK
        # Handle pagination
        data = response.data.get("results", response.data) if isinstance(response.data, dict) else response.data
        # Should only return today's incident
        assert len(data) == 1

    def test_stockout_list_ordered_by_date_desc(self, auth_client, tenant_id, test_skus):
        """Test stockout list is ordered by date descending."""
        today = timezone.localdate()
        yesterday = today - datetime.timedelta(days=1)
        sku = test_skus[0]

        # Create incidents
        StockoutIncident.objects.create(
            tenant_id=tenant_id,
            sku_id=sku.sku_id,
            sku_name=sku.name,
            incident_date=yesterday
        )

        StockoutIncident.objects.create(
            tenant_id=tenant_id,
            sku_id=sku.sku_id,
            sku_name=sku.name,
            incident_date=today
        )

        url = reverse("analytics-stockouts-list")
        response = auth_client.get(url, HTTP_X_TENANT_ID=str(tenant_id))

        assert response.status_code == status.HTTP_200_OK
        # Handle pagination
        data = response.data.get("results", response.data) if isinstance(response.data, dict) else response.data
        # Should be ordered with most recent first
        assert len(data) == 2
        assert data[0]["incident_date"] == str(today)
        assert data[1]["incident_date"] == str(yesterday)

    def test_stockout_list_tenant_isolation(self, auth_client, test_skus):
        """Test stockout list respects tenant isolation."""
        tenant_1 = uuid.uuid4()
        tenant_2 = uuid.uuid4()
        today = timezone.localdate()
        sku = test_skus[0]

        StockoutIncident.objects.create(
            tenant_id=tenant_1,
            sku_id=sku.sku_id,
            sku_name=sku.name,
            incident_date=today
        )

        StockoutIncident.objects.create(
            tenant_id=tenant_2,
            sku_id=sku.sku_id,
            sku_name=sku.name,
            incident_date=today
        )

        url = reverse("analytics-stockouts-list")
        response = auth_client.get(url, HTTP_X_TENANT_ID=str(tenant_1))

        assert response.status_code == status.HTTP_200_OK
        # Handle pagination
        data = response.data.get("results", response.data) if isinstance(response.data, dict) else response.data
        assert len(data) == 1


@pytest.mark.django_db
class TestAnalyticsExportView:
    """Test cases for Analytics Export view."""

    def test_export_requires_authentication(self, client, tenant_id):
        """Test that export endpoint requires authentication."""
        url = reverse("analytics-export")
        response = client.get(url, {"metric": "sales"}, HTTP_X_TENANT_ID=str(tenant_id))

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_export_requires_metric_parameter(self, auth_client, tenant_id):
        """Test that export requires metric parameter."""
        url = reverse("analytics-export")
        response = auth_client.get(url, HTTP_X_TENANT_ID=str(tenant_id))

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_export_sales_csv(self, auth_client, tenant_id):
        """Test exporting sales data as CSV."""
        today = timezone.localdate()

        AnalyticsDailySales.objects.create(
            tenant_id=tenant_id,
            date=today,
            total_orders=10,
            total_items=25,
            total_revenue=Decimal("500.00")
        )

        url = reverse("analytics-export")
        response = auth_client.get(
            url,
            {"metric": "sales"},
            HTTP_X_TENANT_ID=str(tenant_id)
        )

        assert response.status_code == status.HTTP_200_OK
        assert response["Content-Type"] == "text/csv"
        assert "attachment" in response["Content-Disposition"]

        # Check CSV content
        content = response.getvalue().decode("utf-8")
        assert "date,total_orders,total_items,total_revenue" in content
        assert str(today) in content
        assert "10" in content

    def test_export_stock_csv(self, auth_client, tenant_id):
        """Test exporting stock data as CSV."""
        today = timezone.localdate()

        AnalyticsDailyStock.objects.create(
            tenant_id=tenant_id,
            date=today,
            total_stock=1000,
            low_stock_count=5,
            stockout_count=2
        )

        url = reverse("analytics-export")
        response = auth_client.get(
            url,
            {"metric": "stock"},
            HTTP_X_TENANT_ID=str(tenant_id)
        )

        assert response.status_code == status.HTTP_200_OK
        assert response["Content-Type"] == "text/csv"

        content = response.getvalue().decode("utf-8")
        assert "date,total_stock,low_stock_count,stockout_count" in content
        assert "1000" in content

    def test_export_stockouts_csv(self, auth_client, tenant_id, test_skus):
        """Test exporting stockout incidents as CSV."""
        today = timezone.localdate()
        sku = test_skus[0]

        StockoutIncident.objects.create(
            tenant_id=tenant_id,
            sku_id=sku.sku_id,
            sku_name=sku.name,
            incident_date=today,
            note="Test stockout"
        )

        url = reverse("analytics-export")
        response = auth_client.get(
            url,
            {"metric": "stockouts"},
            HTTP_X_TENANT_ID=str(tenant_id)
        )

        assert response.status_code == status.HTTP_200_OK
        assert response["Content-Type"] == "text/csv"

        content = response.getvalue().decode("utf-8")
        assert "incident_date,sku_name,note,order_id" in content
        assert sku.name in content

    def test_export_invalid_metric(self, auth_client, tenant_id):
        """Test export with invalid metric type."""
        url = reverse("analytics-export")
        response = auth_client.get(
            url,
            {"metric": "invalid"},
            HTTP_X_TENANT_ID=str(tenant_id)
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_export_filters_by_date_range(self, auth_client, tenant_id):
        """Test export filters data by date range."""
        today = timezone.localdate()
        week_ago = today - datetime.timedelta(days=7)
        month_ago = today - datetime.timedelta(days=35)

        # Create sales for different dates
        AnalyticsDailySales.objects.create(
            tenant_id=tenant_id,
            date=today,
            total_orders=10,
            total_revenue=Decimal("500.00")
        )

        AnalyticsDailySales.objects.create(
            tenant_id=tenant_id,
            date=month_ago,
            total_orders=5,
            total_revenue=Decimal("250.00")
        )

        url = reverse("analytics-export")
        response = auth_client.get(
            url,
            {
                "metric": "sales",
                "start_date": str(week_ago),
                "end_date": str(today)
            },
            HTTP_X_TENANT_ID=str(tenant_id)
        )

        assert response.status_code == status.HTTP_200_OK
        content = response.getvalue().decode("utf-8")
        lines = content.strip().split("\n")
        # Should have header + 1 data row (only today's data)
        assert len(lines) == 2

    def test_export_tenant_isolation(self, auth_client, test_skus):
        """Test export respects tenant isolation."""
        tenant_1 = uuid.uuid4()
        tenant_2 = uuid.uuid4()
        today = timezone.localdate()

        AnalyticsDailySales.objects.create(
            tenant_id=tenant_1,
            date=today,
            total_orders=10,
            total_revenue=Decimal("500.00")
        )

        AnalyticsDailySales.objects.create(
            tenant_id=tenant_2,
            date=today,
            total_orders=20,
            total_revenue=Decimal("1000.00")
        )

        url = reverse("analytics-export")
        response = auth_client.get(
            url,
            {"metric": "sales"},
            HTTP_X_TENANT_ID=str(tenant_1)
        )

        assert response.status_code == status.HTTP_200_OK
        content = response.getvalue().decode("utf-8")
        # Should only contain tenant 1's data
        assert "500" in content
        assert "1000" not in content
