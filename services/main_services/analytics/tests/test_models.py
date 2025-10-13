"""
Unit tests for analytics models.

Tests cover:
- Model creation and validation
- Unique constraints
- Class methods (update_or_create_for_date, increment, record)
- Transaction handling
- Data integrity
"""

import pytest
from decimal import Decimal
from django.db import IntegrityError, transaction
from django.utils import timezone
import uuid
import datetime

from main_services.analytics.models import (
    AnalyticsDailySales,
    AnalyticsDailyStock,
    AnalyticsDailyTopSKU,
    StockoutIncident,
)


@pytest.mark.django_db
class TestAnalyticsDailySales:
    """Test cases for AnalyticsDailySales model."""

    def test_create_daily_sales(self, tenant_id, analytics_date):
        """Test creating a daily sales record."""
        sales = AnalyticsDailySales.objects.create(
            tenant_id=tenant_id,
            date=analytics_date,
            total_orders=10,
            total_items=25,
            total_revenue=Decimal("500.00"),
            top_skus=[{"sku_id": str(uuid.uuid4()), "revenue": 200.00}]
        )

        assert sales.sales_rollup_id is not None
        assert sales.tenant_id == tenant_id
        assert sales.date == analytics_date
        assert sales.total_orders == 10
        assert sales.total_items == 25
        assert sales.total_revenue == Decimal("500.00")
        assert len(sales.top_skus) == 1

    def test_unique_constraint_tenant_date(self, tenant_id, analytics_date):
        """Test that tenant_id and date combination must be unique."""
        AnalyticsDailySales.objects.create(
            tenant_id=tenant_id,
            date=analytics_date,
            total_orders=5,
        )

        with pytest.raises(IntegrityError):
            AnalyticsDailySales.objects.create(
                tenant_id=tenant_id,
                date=analytics_date,
                total_orders=10,
            )

    def test_update_or_create_for_date_create(self, tenant_id, analytics_date):
        """Test update_or_create_for_date creates new record."""
        top_skus = [{"sku_id": str(uuid.uuid4()), "revenue": 150.00}]

        sales = AnalyticsDailySales.update_or_create_for_date(
            tenant_id=tenant_id,
            date=analytics_date,
            total_orders=15,
            total_items=40,
            total_revenue=Decimal("750.00"),
            top_skus=top_skus
        )

        assert sales.total_orders == 15
        assert sales.total_items == 40
        assert sales.total_revenue == Decimal("750.00")
        assert sales.top_skus == top_skus
        assert AnalyticsDailySales.objects.count() == 1

    def test_update_or_create_for_date_update(self, tenant_id, analytics_date):
        """Test update_or_create_for_date updates existing record."""
        # Create initial record
        AnalyticsDailySales.objects.create(
            tenant_id=tenant_id,
            date=analytics_date,
            total_orders=5,
            total_items=10,
            total_revenue=Decimal("200.00")
        )

        # Update using class method
        new_top_skus = [{"sku_id": str(uuid.uuid4()), "revenue": 300.00}]
        sales = AnalyticsDailySales.update_or_create_for_date(
            tenant_id=tenant_id,
            date=analytics_date,
            total_orders=20,
            total_items=50,
            total_revenue=Decimal("1000.00"),
            top_skus=new_top_skus
        )

        assert sales.total_orders == 20
        assert sales.total_items == 50
        assert sales.total_revenue == Decimal("1000.00")
        assert sales.top_skus == new_top_skus
        assert AnalyticsDailySales.objects.count() == 1

    def test_default_values(self, tenant_id, analytics_date):
        """Test default values for optional fields."""
        sales = AnalyticsDailySales.objects.create(
            tenant_id=tenant_id,
            date=analytics_date
        )

        assert sales.total_orders == 0
        assert sales.total_items == 0
        assert sales.total_revenue == Decimal("0.00")
        assert sales.top_skus == []

    def test_string_representation(self, tenant_id, analytics_date):
        """Test __str__ method."""
        sales = AnalyticsDailySales.objects.create(
            tenant_id=tenant_id,
            date=analytics_date
        )

        expected = f"SalesRollup {tenant_id} @ {analytics_date}"
        assert str(sales) == expected


@pytest.mark.django_db
class TestAnalyticsDailyStock:
    """Test cases for AnalyticsDailyStock model."""

    def test_create_daily_stock(self, tenant_id, analytics_date):
        """Test creating a daily stock record."""
        stock = AnalyticsDailyStock.objects.create(
            tenant_id=tenant_id,
            date=analytics_date,
            total_stock=500,
            low_stock_count=10,
            stockout_count=2
        )

        assert stock.stock_rollup_id is not None
        assert stock.tenant_id == tenant_id
        assert stock.date == analytics_date
        assert stock.total_stock == 500
        assert stock.low_stock_count == 10
        assert stock.stockout_count == 2

    def test_unique_constraint_tenant_date(self, tenant_id, analytics_date):
        """Test that tenant_id and date combination must be unique."""
        AnalyticsDailyStock.objects.create(
            tenant_id=tenant_id,
            date=analytics_date,
            total_stock=100
        )

        with pytest.raises(IntegrityError):
            AnalyticsDailyStock.objects.create(
                tenant_id=tenant_id,
                date=analytics_date,
                total_stock=200
            )

    def test_update_or_create_for_date_create(self, tenant_id, analytics_date):
        """Test update_or_create_for_date creates new record."""
        adjustments = [{"type": "adjustment", "amount": 50}]

        stock = AnalyticsDailyStock.update_or_create_for_date(
            tenant_id=tenant_id,
            date=analytics_date,
            total_stock=1000,
            low_stock_count=15,
            stockout_count=3,
            adjustments_summary=adjustments
        )

        assert stock.total_stock == 1000
        assert stock.low_stock_count == 15
        assert stock.stockout_count == 3
        assert stock.adjustments_summary == adjustments
        assert AnalyticsDailyStock.objects.count() == 1

    def test_update_or_create_for_date_update(self, tenant_id, analytics_date):
        """Test update_or_create_for_date updates existing record."""
        # Create initial record
        AnalyticsDailyStock.objects.create(
            tenant_id=tenant_id,
            date=analytics_date,
            total_stock=500,
            low_stock_count=5
        )

        # Update using class method
        stock = AnalyticsDailyStock.update_or_create_for_date(
            tenant_id=tenant_id,
            date=analytics_date,
            total_stock=750,
            low_stock_count=10,
            stockout_count=1
        )

        assert stock.total_stock == 750
        assert stock.low_stock_count == 10
        assert stock.stockout_count == 1
        assert AnalyticsDailyStock.objects.count() == 1

    def test_string_representation(self, tenant_id, analytics_date):
        """Test __str__ method."""
        stock = AnalyticsDailyStock.objects.create(
            tenant_id=tenant_id,
            date=analytics_date
        )

        expected = f"StockRollup {tenant_id} @ {analytics_date}"
        assert str(stock) == expected


@pytest.mark.django_db
class TestAnalyticsDailyTopSKU:
    """Test cases for AnalyticsDailyTopSKU model."""

    def test_create_daily_top_sku(self, tenant_id, analytics_date, test_skus):
        """Test creating a daily top SKU record."""
        sku = test_skus[0]
        top_sku = AnalyticsDailyTopSKU.objects.create(
            tenant_id=tenant_id,
            date=analytics_date,
            sku_id=sku.sku_id,
            sku_name=sku.name,
            sold_quantity=50,
            revenue=Decimal("500.00")
        )

        assert top_sku.topsku_id is not None
        assert top_sku.tenant_id == tenant_id
        assert top_sku.sku_id == sku.sku_id
        assert top_sku.sold_quantity == 50
        assert top_sku.revenue == Decimal("500.00")

    def test_unique_constraint_tenant_date_sku(self, tenant_id, analytics_date, test_skus):
        """Test that tenant_id, date, and sku_id combination must be unique."""
        sku = test_skus[0]

        AnalyticsDailyTopSKU.objects.create(
            tenant_id=tenant_id,
            date=analytics_date,
            sku_id=sku.sku_id,
            sku_name=sku.name,
            sold_quantity=10
        )

        with pytest.raises(IntegrityError):
            AnalyticsDailyTopSKU.objects.create(
                tenant_id=tenant_id,
                date=analytics_date,
                sku_id=sku.sku_id,
                sku_name=sku.name,
                sold_quantity=20
            )

    def test_increment_create(self, tenant_id, analytics_date, test_skus):
        """Test increment creates new record when it doesn't exist."""
        sku = test_skus[0]

        result = AnalyticsDailyTopSKU.increment(
            tenant_id=tenant_id,
            date=analytics_date,
            sku_id=sku.sku_id,
            sku_name=sku.name,
            quantity=25,
            revenue=Decimal("250.00")
        )

        assert result.sold_quantity == 25
        assert result.revenue == Decimal("250.00")
        assert AnalyticsDailyTopSKU.objects.count() == 1

    def test_increment_update(self, tenant_id, analytics_date, test_skus):
        """Test increment adds to existing record."""
        sku = test_skus[0]

        # Create initial record
        AnalyticsDailyTopSKU.objects.create(
            tenant_id=tenant_id,
            date=analytics_date,
            sku_id=sku.sku_id,
            sku_name=sku.name,
            sold_quantity=10,
            revenue=Decimal("100.00")
        )

        # Increment
        result = AnalyticsDailyTopSKU.increment(
            tenant_id=tenant_id,
            date=analytics_date,
            sku_id=sku.sku_id,
            sku_name=sku.name,
            quantity=15,
            revenue=Decimal("150.00")
        )

        assert result.sold_quantity == 25  # 10 + 15
        assert result.revenue == Decimal("250.00")  # 100 + 150
        assert AnalyticsDailyTopSKU.objects.count() == 1

    def test_increment_multiple_times(self, tenant_id, analytics_date, test_skus):
        """Test multiple increments accumulate correctly."""
        sku = test_skus[0]

        # First increment
        AnalyticsDailyTopSKU.increment(
            tenant_id=tenant_id,
            date=analytics_date,
            sku_id=sku.sku_id,
            sku_name=sku.name,
            quantity=5,
            revenue=Decimal("50.00")
        )

        # Second increment
        AnalyticsDailyTopSKU.increment(
            tenant_id=tenant_id,
            date=analytics_date,
            sku_id=sku.sku_id,
            sku_name=sku.name,
            quantity=10,
            revenue=Decimal("100.00")
        )

        # Third increment
        result = AnalyticsDailyTopSKU.increment(
            tenant_id=tenant_id,
            date=analytics_date,
            sku_id=sku.sku_id,
            sku_name=sku.name,
            quantity=7,
            revenue=Decimal("70.00")
        )

        assert result.sold_quantity == 22  # 5 + 10 + 7
        assert result.revenue == Decimal("220.00")  # 50 + 100 + 70

    def test_string_representation(self, tenant_id, analytics_date, test_skus):
        """Test __str__ method."""
        sku = test_skus[0]
        top_sku = AnalyticsDailyTopSKU.objects.create(
            tenant_id=tenant_id,
            date=analytics_date,
            sku_id=sku.sku_id,
            sku_name=sku.name
        )

        expected = f"TokSKU {sku.name} ({sku.sku_id}) @ {analytics_date}"
        assert str(top_sku) == expected


@pytest.mark.django_db
class TestStockoutIncident:
    """Test cases for StockoutIncident model."""

    def test_create_stockout_incident(self, tenant_id, test_skus):
        """Test creating a stockout incident."""
        sku = test_skus[0]
        incident_date = timezone.localdate()

        incident = StockoutIncident.objects.create(
            tenant_id=tenant_id,
            sku_id=sku.sku_id,
            sku_name=sku.name,
            incident_date=incident_date,
            note="Stock depleted during high demand"
        )

        assert incident.stockout_id is not None
        assert incident.tenant_id == tenant_id
        assert incident.sku_id == sku.sku_id
        assert incident.sku_name == sku.name
        assert incident.incident_date == incident_date
        assert incident.note == "Stock depleted during high demand"

    def test_create_with_order_reference(self, tenant_id, test_skus):
        """Test creating a stockout incident with order reference."""
        sku = test_skus[0]
        order_id = uuid.uuid4()

        incident = StockoutIncident.objects.create(
            tenant_id=tenant_id,
            sku_id=sku.sku_id,
            sku_name=sku.name,
            incident_date=timezone.localdate(),
            order_id=order_id,
            note="Stockout occurred during order processing"
        )

        assert incident.order_id == order_id

    def test_record_class_method(self, tenant_id, test_skus, django_user_model):
        """Test record class method creates incident."""
        sku = test_skus[0]
        user = django_user_model.objects.create_user(
            email="test@example.com",
            password="testpass",
            username="testuser"
        )

        incident = StockoutIncident.record(
            tenant_id=tenant_id,
            sku_id=sku.sku_id,
            sku_name=sku.name,
            note="Recorded via class method",
            created_by=user
        )

        assert incident.tenant_id == tenant_id
        assert incident.sku_id == sku.sku_id
        assert incident.sku_name == sku.name
        assert incident.note == "Recorded via class method"
        assert incident.created_by == user
        assert incident.incident_date == timezone.localdate()

    def test_record_with_custom_date(self, tenant_id, test_skus):
        """Test record class method with custom incident date."""
        sku = test_skus[0]
        custom_date = timezone.localdate() - datetime.timedelta(days=5)

        incident = StockoutIncident.record(
            tenant_id=tenant_id,
            sku_id=sku.sku_id,
            sku_name=sku.name,
            incident_date=custom_date,
            note="Historical stockout"
        )

        assert incident.incident_date == custom_date

    def test_multiple_incidents_same_sku(self, tenant_id, test_skus):
        """Test that multiple incidents can be recorded for the same SKU."""
        sku = test_skus[0]
        today = timezone.localdate()

        incident1 = StockoutIncident.objects.create(
            tenant_id=tenant_id,
            sku_id=sku.sku_id,
            sku_name=sku.name,
            incident_date=today,
            note="First incident"
        )

        incident2 = StockoutIncident.objects.create(
            tenant_id=tenant_id,
            sku_id=sku.sku_id,
            sku_name=sku.name,
            incident_date=today,
            note="Second incident"
        )

        assert incident1.stockout_id != incident2.stockout_id
        assert StockoutIncident.objects.filter(sku_id=sku.sku_id).count() == 2

    def test_string_representation(self, tenant_id, test_skus):
        """Test __str__ method."""
        sku = test_skus[0]
        incident_date = timezone.localdate()

        incident = StockoutIncident.objects.create(
            tenant_id=tenant_id,
            sku_id=sku.sku_id,
            sku_name=sku.name,
            incident_date=incident_date
        )

        expected = f"Stockout {sku.name} on {incident_date}"
        assert str(incident) == expected
