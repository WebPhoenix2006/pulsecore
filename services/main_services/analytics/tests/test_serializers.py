"""
Unit tests for analytics serializers.

Tests cover:
- Serialization of model instances
- Data validation
- Read-only fields
- Nested serializers
- Composite serializers
"""

import pytest
from decimal import Decimal
from django.utils import timezone
import uuid
import datetime

from main_services.analytics.models import (
    AnalyticsDailySales,
    AnalyticsDailyStock,
    AnalyticsDailyTopSKU,
    StockoutIncident,
)
from main_services.analytics.serializers import (
    AnalyticsDailySalesSerializer,
    AnalyticsDailyStockSerializer,
    AnalyticsDailyTopSKUSerializer,
    StockoutIncidentSerializer,
    TopSKUSerializer,
    DashboardAnalyticsSerializer,
    TimeSeriesPointSerializer,
)


@pytest.mark.django_db
class TestAnalyticsDailySalesSerializer:
    """Test cases for AnalyticsDailySalesSerializer."""

    def test_serialize_daily_sales(self, tenant_id):
        """Test serializing a daily sales instance."""
        today = timezone.localdate()
        top_skus = [{"sku_id": str(uuid.uuid4()), "revenue": 500.00}]

        sales = AnalyticsDailySales.objects.create(
            tenant_id=tenant_id,
            date=today,
            total_orders=10,
            total_items=25,
            total_revenue=Decimal("500.00"),
            top_skus=top_skus
        )

        serializer = AnalyticsDailySalesSerializer(sales)
        data = serializer.data

        assert str(data["sales_rollup_id"]) == str(sales.sales_rollup_id)
        assert str(data["tenant_id"]) == str(tenant_id)
        assert data["date"] == str(today)
        assert data["total_orders"] == 10
        assert data["total_items"] == 25
        assert data["total_revenue"] == "500.00"
        assert "created_at" in data
        assert "updated_at" in data

    def test_serialize_daily_sales_with_top_skus(self, tenant_id, test_skus):
        """Test serializing daily sales with top SKUs."""
        today = timezone.localdate()
        top_skus = [
            {"sku_id": str(test_skus[0].sku_id), "revenue": 500.00},
            {"sku_id": str(test_skus[1].sku_id), "revenue": 300.00}
        ]

        sales = AnalyticsDailySales.objects.create(
            tenant_id=tenant_id,
            date=today,
            total_orders=15,
            total_revenue=Decimal("800.00"),
            top_skus=top_skus
        )

        serializer = AnalyticsDailySalesSerializer(sales)
        data = serializer.data

        assert len(data["top_skus"]) == 2

    def test_serialize_daily_sales_empty_top_skus(self, tenant_id):
        """Test serializing daily sales with empty top SKUs."""
        today = timezone.localdate()

        sales = AnalyticsDailySales.objects.create(
            tenant_id=tenant_id,
            date=today,
            total_orders=5,
            total_revenue=Decimal("200.00"),
            top_skus=[]
        )

        serializer = AnalyticsDailySalesSerializer(sales)
        data = serializer.data

        assert data["top_skus"] == []

    def test_all_fields_read_only(self, tenant_id):
        """Test that all fields are read-only."""
        serializer = AnalyticsDailySalesSerializer()

        expected_fields = [
            "sales_rollup_id",
            "tenant_id",
            "date",
            "total_orders",
            "total_items",
            "total_revenue",
            "top_skus",
            "created_at",
            "updated_at"
        ]

        for field in expected_fields:
            assert field in serializer.fields
            assert serializer.fields[field].read_only is True


@pytest.mark.django_db
class TestAnalyticsDailyStockSerializer:
    """Test cases for AnalyticsDailyStockSerializer."""

    def test_serialize_daily_stock(self, tenant_id):
        """Test serializing a daily stock instance."""
        today = timezone.localdate()

        stock = AnalyticsDailyStock.objects.create(
            tenant_id=tenant_id,
            date=today,
            total_stock=1000,
            low_stock_count=5,
            stockout_count=2
        )

        serializer = AnalyticsDailyStockSerializer(stock)
        data = serializer.data

        assert str(data["stock_rollup_id"]) == str(stock.stock_rollup_id)
        assert str(data["tenant_id"]) == str(tenant_id)
        assert data["date"] == str(today)
        assert data["total_stock"] == 1000
        assert data["low_stock_count"] == 5
        assert data["stockout_count"] == 2
        assert "created_at" in data
        assert "updated_at" in data

    def test_serialize_stock_with_adjustments(self, tenant_id):
        """Test serializing stock with adjustments summary."""
        today = timezone.localdate()
        adjustments = [
            {"type": "restock", "amount": 100},
            {"type": "correction", "amount": -5}
        ]

        stock = AnalyticsDailyStock.objects.create(
            tenant_id=tenant_id,
            date=today,
            total_stock=1095,
            adjustments_summary=adjustments
        )

        serializer = AnalyticsDailyStockSerializer(stock)
        data = serializer.data

        assert data["adjustments_summary"] == adjustments

    def test_all_fields_read_only(self):
        """Test that all fields are read-only."""
        serializer = AnalyticsDailyStockSerializer()

        expected_fields = [
            "stock_rollup_id",
            "tenant_id",
            "date",
            "total_stock",
            "low_stock_count",
            "stockout_count",
            "adjustments_summary",
            "created_at",
            "updated_at"
        ]

        for field in expected_fields:
            assert field in serializer.fields
            assert serializer.fields[field].read_only is True


@pytest.mark.django_db
class TestAnalyticsDailyTopSKUSerializer:
    """Test cases for AnalyticsDailyTopSKUSerializer."""

    def test_serialize_top_sku(self, tenant_id, test_skus):
        """Test serializing a top SKU instance."""
        today = timezone.localdate()
        sku = test_skus[0]

        top_sku = AnalyticsDailyTopSKU.objects.create(
            tenant_id=tenant_id,
            date=today,
            sku_id=sku.sku_id,
            sku_name=sku.name,
            sold_quantity=50,
            revenue=Decimal("500.00")
        )

        serializer = AnalyticsDailyTopSKUSerializer(top_sku)
        data = serializer.data

        assert str(data["topsku_id"]) == str(top_sku.topsku_id)
        assert str(data["tenant_id"]) == str(tenant_id)
        assert data["date"] == str(today)
        assert str(data["sku_id"]) == str(sku.sku_id)
        assert data["sku_name"] == sku.name
        assert data["sold_quantity"] == 50
        assert data["revenue"] == "500.00"
        assert "created_at" in data
        assert "updated_at" in data

    def test_serialize_multiple_top_skus(self, tenant_id, test_skus):
        """Test serializing multiple top SKU instances."""
        today = timezone.localdate()

        top_skus = []
        for i, sku in enumerate(test_skus[:3]):
            top_sku = AnalyticsDailyTopSKU.objects.create(
                tenant_id=tenant_id,
                date=today,
                sku_id=sku.sku_id,
                sku_name=sku.name,
                sold_quantity=10 * (i + 1),
                revenue=Decimal(str(100 * (i + 1)))
            )
            top_skus.append(top_sku)

        serializer = AnalyticsDailyTopSKUSerializer(top_skus, many=True)
        data = serializer.data

        assert len(data) == 3
        assert data[0]["sold_quantity"] == 10
        assert data[1]["sold_quantity"] == 20
        assert data[2]["sold_quantity"] == 30

    def test_all_fields_read_only(self):
        """Test that all fields are read-only."""
        serializer = AnalyticsDailyTopSKUSerializer()

        expected_fields = [
            "topsku_id",
            "tenant_id",
            "date",
            "sku_id",
            "sku_name",
            "sold_quantity",
            "revenue",
            "created_at",
            "updated_at"
        ]

        for field in expected_fields:
            assert field in serializer.fields
            assert serializer.fields[field].read_only is True


@pytest.mark.django_db
class TestStockoutIncidentSerializer:
    """Test cases for StockoutIncidentSerializer."""

    def test_serialize_stockout_incident(self, tenant_id, test_skus):
        """Test serializing a stockout incident."""
        today = timezone.localdate()
        sku = test_skus[0]

        incident = StockoutIncident.objects.create(
            tenant_id=tenant_id,
            sku_id=sku.sku_id,
            sku_name=sku.name,
            incident_date=today,
            note="Test stockout"
        )

        serializer = StockoutIncidentSerializer(incident)
        data = serializer.data

        assert str(data["stockout_id"]) == str(incident.stockout_id)
        assert str(data["tenant_id"]) == str(tenant_id)
        assert str(data["sku_id"]) == str(sku.sku_id)
        assert data["sku_name"] == sku.name
        assert data["incident_date"] == str(today)
        assert data["note"] == "Test stockout"
        assert "created_at" in data

    def test_serialize_incident_with_order(self, tenant_id, test_skus):
        """Test serializing incident with order reference."""
        today = timezone.localdate()
        sku = test_skus[0]
        order_id = uuid.uuid4()

        incident = StockoutIncident.objects.create(
            tenant_id=tenant_id,
            sku_id=sku.sku_id,
            sku_name=sku.name,
            incident_date=today,
            order_id=order_id,
            note="Stockout during order"
        )

        serializer = StockoutIncidentSerializer(incident)
        data = serializer.data

        assert str(data["order_id"]) == str(order_id)

    def test_serialize_incident_with_created_by(self, tenant_id, test_skus, django_user_model):
        """Test serializing incident with created_by user."""
        today = timezone.localdate()
        sku = test_skus[0]
        user = django_user_model.objects.create_user(
            email="test@example.com",
            password="testpass",
            username="testuser"
        )

        incident = StockoutIncident.objects.create(
            tenant_id=tenant_id,
            sku_id=sku.sku_id,
            sku_name=sku.name,
            incident_date=today,
            created_by=user
        )

        serializer = StockoutIncidentSerializer(incident)
        data = serializer.data

        assert data["created_by"] == user.pk

    def test_all_fields_read_only(self):
        """Test that all fields are read-only."""
        serializer = StockoutIncidentSerializer()

        expected_fields = [
            "stockout_id",
            "tenant_id",
            "sku_id",
            "sku_name",
            "incident_date",
            "note",
            "order_id",
            "created_by",
            "created_at"
        ]

        for field in expected_fields:
            assert field in serializer.fields
            assert serializer.fields[field].read_only is True


class TestTopSKUSerializer:
    """Test cases for TopSKUSerializer."""

    def test_serialize_top_sku_data(self):
        """Test serializing top SKU data structure."""
        sku_id = uuid.uuid4()
        data = {
            "sku_id": sku_id,
            "revenue": Decimal("500.00")
        }

        serializer = TopSKUSerializer(data=data)
        assert serializer.is_valid()

        validated_data = serializer.validated_data
        assert validated_data["sku_id"] == sku_id
        assert validated_data["revenue"] == Decimal("500.00")

    def test_serialize_multiple_top_skus(self):
        """Test serializing multiple top SKUs."""
        data = [
            {
                "sku_id": uuid.uuid4(),
                "revenue": Decimal("500.00")
            },
            {
                "sku_id": uuid.uuid4(),
                "revenue": Decimal("300.00")
            }
        ]

        serializer = TopSKUSerializer(data=data, many=True)
        assert serializer.is_valid()
        assert len(serializer.validated_data) == 2


class TestTimeSeriesPointSerializer:
    """Test cases for TimeSeriesPointSerializer."""

    def test_serialize_time_series_point(self):
        """Test serializing a time series data point."""
        today = timezone.localdate()
        data = {
            "date": today,
            "value": Decimal("500.00")
        }

        serializer = TimeSeriesPointSerializer(data=data)
        assert serializer.is_valid()

        validated_data = serializer.validated_data
        assert validated_data["date"] == today
        assert validated_data["value"] == Decimal("500.00")

    def test_serialize_time_series_list(self):
        """Test serializing a list of time series points."""
        today = timezone.localdate()
        yesterday = today - datetime.timedelta(days=1)

        data = [
            {"date": yesterday, "value": Decimal("400.00")},
            {"date": today, "value": Decimal("500.00")}
        ]

        serializer = TimeSeriesPointSerializer(data=data, many=True)
        assert serializer.is_valid()
        assert len(serializer.validated_data) == 2


class TestDashboardAnalyticsSerializer:
    """Test cases for DashboardAnalyticsSerializer."""

    def test_serialize_dashboard_data(self):
        """Test serializing complete dashboard analytics data."""
        today = timezone.localdate()
        yesterday = today - datetime.timedelta(days=1)

        data = {
            "stock_total": 1000,
            "low_stock_count": 5,
            "stockout_count": 2,
            "sales_count": 15,
            "revenue_total": Decimal("800.00"),
            "top_skus": [
                {
                    "sku_id": uuid.uuid4(),
                    "revenue": Decimal("500.00")
                }
            ],
            "revenue_trend": [
                {"date": yesterday, "value": Decimal("400.00")},
                {"date": today, "value": Decimal("500.00")}
            ],
            "stock_trend": [
                {"date": yesterday, "value": Decimal("900.00")},
                {"date": today, "value": Decimal("1000.00")}
            ]
        }

        serializer = DashboardAnalyticsSerializer(data)
        serialized_data = serializer.data

        assert serialized_data["stock_total"] == 1000
        assert serialized_data["low_stock_count"] == 5
        assert serialized_data["stockout_count"] == 2
        assert serialized_data["sales_count"] == 15
        assert serialized_data["revenue_total"] == "800.00"
        assert len(serialized_data["top_skus"]) == 1
        assert len(serialized_data["revenue_trend"]) == 2
        assert len(serialized_data["stock_trend"]) == 2

    def test_serialize_dashboard_empty_trends(self):
        """Test serializing dashboard with empty trend data."""
        data = {
            "stock_total": 0,
            "low_stock_count": 0,
            "stockout_count": 0,
            "sales_count": 0,
            "revenue_total": Decimal("0.00"),
            "top_skus": [],
            "revenue_trend": [],
            "stock_trend": []
        }

        serializer = DashboardAnalyticsSerializer(data)
        serialized_data = serializer.data

        assert serialized_data["stock_total"] == 0
        assert serialized_data["revenue_total"] == "0.00"
        assert serialized_data["top_skus"] == []
        assert serialized_data["revenue_trend"] == []
        assert serialized_data["stock_trend"] == []

    def test_dashboard_has_all_required_fields(self):
        """Test that dashboard serializer includes all required fields."""
        serializer = DashboardAnalyticsSerializer()

        expected_fields = [
            "stock_total",
            "low_stock_count",
            "stockout_count",
            "sales_count",
            "revenue_total",
            "top_skus",
            "revenue_trend",
            "stock_trend"
        ]

        for field in expected_fields:
            assert field in serializer.fields

    def test_dashboard_validates_nested_data(self):
        """Test that dashboard serializer validates nested structures."""
        today = timezone.localdate()

        # Valid data
        valid_data = {
            "stock_total": 1000,
            "low_stock_count": 5,
            "stockout_count": 2,
            "sales_count": 10,
            "revenue_total": Decimal("500.00"),
            "top_skus": [
                {
                    "sku_id": uuid.uuid4(),
                    "revenue": Decimal("500.00")
                }
            ],
            "revenue_trend": [
                {"date": today, "value": Decimal("500.00")}
            ],
            "stock_trend": [
                {"date": today, "value": Decimal("1000.00")}
            ]
        }

        serializer = DashboardAnalyticsSerializer(data=valid_data)
        assert serializer.is_valid()
