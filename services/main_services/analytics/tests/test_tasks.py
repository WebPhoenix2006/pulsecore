"""
Unit tests for analytics Celery tasks.

Tests cover:
- generate_daily_sales task
- generate_daily_stock task
- generate_top_skus task
- Edge cases and error handling
- Data aggregation logic
"""

import pytest
from decimal import Decimal
from django.utils import timezone
from unittest.mock import patch
import datetime
import uuid

from main_services.analytics.tasks import (
    generate_daily_sales,
    generate_daily_stock,
    generate_top_skus,
)
from main_services.analytics.models import (
    AnalyticsDailySales,
    AnalyticsDailyStock,
    AnalyticsDailyTopSKU,
    StockoutIncident,
)
from main_services.orders.models import Order, OrderItem
from main_services.inventory.models import SKU


@pytest.mark.django_db
class TestGenerateDailySales:
    """Test cases for generate_daily_sales task."""

    def test_generate_daily_sales_with_completed_orders(self, tenant_id, test_orders):
        """Test generating daily sales from completed orders."""
        today = timezone.localdate()

        # Run the task
        generate_daily_sales(date=today)

        # Check that sales record was created
        sales = AnalyticsDailySales.objects.filter(
            tenant_id=tenant_id,
            date=today
        ).first()

        assert sales is not None
        assert sales.total_orders > 0
        assert sales.total_items > 0
        assert sales.total_revenue > Decimal("0.00")

    def test_generate_daily_sales_filters_by_status(self, tenant_id, test_skus):
        """Test that only completed and paid orders are included."""
        today = timezone.now()
        sku = test_skus[0]

        # Create orders with different statuses
        completed_order = Order.objects.create(
            tenant_id=tenant_id,
            customer_name="Completed Customer",
            status="completed",
            payment_status="paid",
            total_amount=Decimal("100.00"),
            created_at=today
        )
        OrderItem.objects.create(
            order=completed_order,
            sku_id=sku.sku_id,
            quantity=2
        )

        paid_order = Order.objects.create(
            tenant_id=tenant_id,
            customer_name="Paid Customer",
            status="paid",
            payment_status="paid",
            total_amount=Decimal("75.00"),
            created_at=today
        )
        OrderItem.objects.create(
            order=paid_order,
            sku_id=sku.sku_id,
            quantity=1
        )

        pending_order = Order.objects.create(
            tenant_id=tenant_id,
            customer_name="Pending Customer",
            status="pending",
            payment_status="unpaid",
            total_amount=Decimal("50.00"),
            created_at=today
        )
        OrderItem.objects.create(
            order=pending_order,
            sku_id=sku.sku_id,
            quantity=1
        )

        # Run the task
        generate_daily_sales(date=timezone.localdate())

        # Check results
        sales = AnalyticsDailySales.objects.get(tenant_id=tenant_id)
        assert sales.total_orders == 2  # Only completed and paid orders
        assert sales.total_items == 3  # 2 + 1 items

    def test_generate_daily_sales_filters_by_date(self, tenant_id, test_skus):
        """Test that only orders from the specified date are included."""
        today = timezone.now()
        yesterday = today - datetime.timedelta(days=1)
        sku = test_skus[0]

        # Create order for today
        today_order = Order.objects.create(
            tenant_id=tenant_id,
            customer_name="Today Customer",
            status="completed",
            payment_status="paid",
            total_amount=Decimal("100.00"),
            created_at=today
        )
        OrderItem.objects.create(
            order=today_order,
            sku_id=sku.sku_id,
            quantity=2
        )

        # Create order for yesterday
        yesterday_order = Order.objects.create(
            tenant_id=tenant_id,
            customer_name="Yesterday Customer",
            status="completed",
            payment_status="paid",
            total_amount=Decimal("50.00"),
            created_at=yesterday
        )
        OrderItem.objects.create(
            order=yesterday_order,
            sku_id=sku.sku_id,
            quantity=1
        )

        # Run task for today only
        generate_daily_sales(date=timezone.localdate())

        # Check that only today's orders are included
        sales = AnalyticsDailySales.objects.get(
            tenant_id=tenant_id,
            date=timezone.localdate()
        )
        assert sales.total_orders == 1
        assert sales.total_items == 2

    def test_generate_daily_sales_calculates_top_skus(self, tenant_id, test_skus):
        """Test that top SKUs are calculated correctly."""
        today = timezone.now()

        # Create orders with different SKUs
        for i, sku in enumerate(test_skus[:3]):
            order = Order.objects.create(
                tenant_id=tenant_id,
                customer_name=f"Customer {i}",
                status="completed",
                payment_status="paid",
                total_amount=Decimal("0.00"),
                created_at=today
            )
            # Higher quantity for first SKU
            quantity = 10 - i * 2
            OrderItem.objects.create(
                order=order,
                sku_id=sku.sku_id,
                quantity=quantity
            )

        # Run the task
        generate_daily_sales(date=timezone.localdate())

        # Check top SKUs
        sales = AnalyticsDailySales.objects.get(tenant_id=tenant_id)
        assert len(sales.top_skus) > 0
        # First SKU should have highest revenue
        assert sales.top_skus[0]["sku_id"] == str(test_skus[0].sku_id)

    def test_generate_daily_sales_multiple_tenants(self, test_skus):
        """Test that sales are segregated by tenant."""
        today = timezone.now()
        tenant_1 = uuid.uuid4()
        tenant_2 = uuid.uuid4()

        # Create orders for tenant 1
        order1 = Order.objects.create(
            tenant_id=tenant_1,
            customer_name="Tenant 1 Customer",
            status="completed",
            payment_status="paid",
            total_amount=Decimal("100.00"),
            created_at=today
        )
        OrderItem.objects.create(
            order=order1,
            sku_id=test_skus[0].sku_id,
            quantity=2
        )

        # Create orders for tenant 2
        order2 = Order.objects.create(
            tenant_id=tenant_2,
            customer_name="Tenant 2 Customer",
            status="completed",
            payment_status="paid",
            total_amount=Decimal("200.00"),
            created_at=today
        )
        OrderItem.objects.create(
            order=order2,
            sku_id=test_skus[0].sku_id,
            quantity=4
        )

        # Run the task
        generate_daily_sales(date=timezone.localdate())

        # Check that both tenants have separate records
        sales_1 = AnalyticsDailySales.objects.get(tenant_id=tenant_1)
        sales_2 = AnalyticsDailySales.objects.get(tenant_id=tenant_2)

        assert sales_1.total_orders == 1
        assert sales_2.total_orders == 1
        assert sales_1.total_items == 2
        assert sales_2.total_items == 4

    def test_generate_daily_sales_no_orders(self, tenant_id):
        """Test task behavior when there are no orders."""
        # Create a tenant with SKUs but no orders
        generate_daily_sales(date=timezone.localdate())

        # No analytics record should be created for this tenant
        sales_count = AnalyticsDailySales.objects.filter(tenant_id=tenant_id).count()
        assert sales_count == 0

    def test_generate_daily_sales_updates_existing_record(self, tenant_id, test_skus):
        """Test that running the task again updates the existing record."""
        today = timezone.now()
        sku = test_skus[0]

        # Create initial order
        order1 = Order.objects.create(
            tenant_id=tenant_id,
            customer_name="Customer 1",
            status="completed",
            payment_status="paid",
            total_amount=Decimal("100.00"),
            created_at=today
        )
        OrderItem.objects.create(order=order1, sku_id=sku.sku_id, quantity=2)

        # Run task first time
        generate_daily_sales(date=timezone.localdate())
        first_count = AnalyticsDailySales.objects.filter(tenant_id=tenant_id).count()

        # Create another order
        order2 = Order.objects.create(
            tenant_id=tenant_id,
            customer_name="Customer 2",
            status="completed",
            payment_status="paid",
            total_amount=Decimal("150.00"),
            created_at=today
        )
        OrderItem.objects.create(order=order2, sku_id=sku.sku_id, quantity=3)

        # Run task again
        generate_daily_sales(date=timezone.localdate())
        second_count = AnalyticsDailySales.objects.filter(tenant_id=tenant_id).count()

        # Should still be one record, but updated
        assert first_count == 1
        assert second_count == 1

        sales = AnalyticsDailySales.objects.get(tenant_id=tenant_id)
        assert sales.total_orders == 2
        assert sales.total_items == 5

    def test_generate_daily_sales_default_date(self, tenant_id, test_skus):
        """Test that task uses current date when date parameter is None."""
        today = timezone.now()
        sku = test_skus[0]

        order = Order.objects.create(
            tenant_id=tenant_id,
            customer_name="Customer",
            status="completed",
            payment_status="paid",
            total_amount=Decimal("100.00"),
            created_at=today
        )
        OrderItem.objects.create(order=order, sku_id=sku.sku_id, quantity=2)

        # Run task without date parameter
        generate_daily_sales()

        # Should create record for today
        sales = AnalyticsDailySales.objects.filter(
            tenant_id=tenant_id,
            date=timezone.localdate()
        ).first()
        assert sales is not None


@pytest.mark.django_db
class TestGenerateDailyStock:
    """Test cases for generate_daily_stock task."""

    def test_generate_daily_stock_basic(self, tenant_id, test_skus):
        """Test generating daily stock analytics."""
        generate_daily_stock(date=timezone.localdate())

        stock = AnalyticsDailyStock.objects.get(tenant_id=tenant_id)
        assert stock.total_stock > 0
        assert stock.low_stock_count == 0  # No low stock SKUs in test_skus
        assert stock.stockout_count == 0

    def test_generate_daily_stock_identifies_low_stock(self, tenant_id, test_skus, low_stock_skus):
        """Test that low stock SKUs are correctly identified."""
        generate_daily_stock(date=timezone.localdate())

        stock = AnalyticsDailyStock.objects.get(tenant_id=tenant_id)
        assert stock.low_stock_count == len(low_stock_skus)

    def test_generate_daily_stock_identifies_stockouts(self, tenant_id, test_skus, stockout_skus):
        """Test that stockout SKUs are correctly identified."""
        generate_daily_stock(date=timezone.localdate())

        stock = AnalyticsDailyStock.objects.get(tenant_id=tenant_id)
        assert stock.stockout_count == len(stockout_skus)

    def test_generate_daily_stock_creates_stockout_incidents(self, tenant_id, stockout_skus):
        """Test that stockout incidents are created for zero-stock SKUs."""
        generate_daily_stock(date=timezone.localdate())

        # Check that incidents were created
        incidents = StockoutIncident.objects.filter(tenant_id=tenant_id)
        assert incidents.count() == len(stockout_skus)

        # Verify incident details
        for incident in incidents:
            assert incident.sku_id in [sku.sku_id for sku in stockout_skus]
            assert incident.note == "Detected during daily rollup"

    def test_generate_daily_stock_no_duplicate_incidents(self, tenant_id, stockout_skus):
        """Test that running the task twice doesn't create duplicate incidents."""
        today = timezone.localdate()

        # Run task twice
        generate_daily_stock(date=today)
        generate_daily_stock(date=today)

        # Should only have one incident per stockout SKU
        incidents = StockoutIncident.objects.filter(
            tenant_id=tenant_id,
            incident_date=today
        )
        assert incidents.count() == len(stockout_skus)

    def test_generate_daily_stock_multiple_tenants(self):
        """Test that stock analytics are segregated by tenant."""
        tenant_1 = uuid.uuid4()
        tenant_2 = uuid.uuid4()

        # Create SKUs for each tenant
        SKU.objects.create(
            tenant_id=tenant_1,
            name="Tenant 1 SKU",
            sku_code="T1-SKU-001",
            category="Test Category",
            stock_level=100,
            price=Decimal("10.00")
        )

        SKU.objects.create(
            tenant_id=tenant_2,
            name="Tenant 2 SKU",
            sku_code="T2-SKU-001",
            category="Test Category",
            stock_level=200,
            price=Decimal("10.00")
        )

        # Run the task
        generate_daily_stock(date=timezone.localdate())

        # Check that both tenants have separate records
        stock_1 = AnalyticsDailyStock.objects.get(tenant_id=tenant_1)
        stock_2 = AnalyticsDailyStock.objects.get(tenant_id=tenant_2)

        assert stock_1.total_stock == 100
        assert stock_2.total_stock == 200

    def test_generate_daily_stock_updates_existing_record(self, tenant_id, test_skus):
        """Test that running the task again updates the existing record."""
        # Run task first time
        generate_daily_stock(date=timezone.localdate())
        first_count = AnalyticsDailyStock.objects.filter(tenant_id=tenant_id).count()

        # Update stock levels
        test_skus[0].stock_level = 0
        test_skus[0].save()

        # Run task again
        generate_daily_stock(date=timezone.localdate())
        second_count = AnalyticsDailyStock.objects.filter(tenant_id=tenant_id).count()

        # Should still be one record, but updated
        assert first_count == 1
        assert second_count == 1

        stock = AnalyticsDailyStock.objects.get(tenant_id=tenant_id)
        assert stock.stockout_count >= 1

    def test_generate_daily_stock_default_date(self, tenant_id, test_skus):
        """Test that task uses current date when date parameter is None."""
        # Run task without date parameter
        generate_daily_stock()

        # Should create record for today
        stock = AnalyticsDailyStock.objects.filter(
            tenant_id=tenant_id,
            date=timezone.localdate()
        ).first()
        assert stock is not None


@pytest.mark.django_db
class TestGenerateTopSKUs:
    """Test cases for generate_top_skus task."""

    def test_generate_top_skus_basic(self, tenant_id, test_skus):
        """Test generating top SKUs analytics."""
        today = timezone.localdate()

        # Create sales data first
        top_skus_data = [
            {"sku_id": str(test_skus[0].sku_id), "revenue": 1000.00},
            {"sku_id": str(test_skus[1].sku_id), "revenue": 750.00},
            {"sku_id": str(test_skus[2].sku_id), "revenue": 500.00},
        ]

        AnalyticsDailySales.objects.create(
            tenant_id=tenant_id,
            date=today,
            total_orders=10,
            total_revenue=Decimal("2250.00"),
            top_skus=top_skus_data
        )

        # Run the task
        generate_top_skus(date=today)

        # Check results
        top_sku = AnalyticsDailyTopSKU.objects.filter(tenant_id=tenant_id, date=today).first()
        assert top_sku is not None

    def test_generate_top_skus_aggregates_multiple_days(self, tenant_id, test_skus):
        """Test that top SKUs aggregates data from multiple sales records."""
        today = timezone.localdate()
        yesterday = today - datetime.timedelta(days=1)

        # Create sales for two days
        AnalyticsDailySales.objects.create(
            tenant_id=tenant_id,
            date=today,
            total_orders=5,
            total_revenue=Decimal("500.00"),
            top_skus=[{"sku_id": str(test_skus[0].sku_id), "revenue": 500.00}]
        )

        AnalyticsDailySales.objects.create(
            tenant_id=tenant_id,
            date=yesterday,
            total_orders=3,
            total_revenue=Decimal("300.00"),
            top_skus=[{"sku_id": str(test_skus[1].sku_id), "revenue": 300.00}]
        )

        # Run the task
        generate_top_skus(date=today)

        # Should have aggregated data
        top_sku_record = AnalyticsDailyTopSKU.objects.filter(
            tenant_id=tenant_id,
            date=today
        ).first()
        assert top_sku_record is not None

    def test_generate_top_skus_limits_to_top_10(self, tenant_id, test_skus):
        """Test that only top 10 SKUs are stored."""
        today = timezone.localdate()

        # Create 15 SKUs with revenues
        top_skus_data = [
            {"sku_id": str(uuid.uuid4()), "revenue": float(1000 - i * 50)}
            for i in range(15)
        ]

        AnalyticsDailySales.objects.create(
            tenant_id=tenant_id,
            date=today,
            total_orders=50,
            total_revenue=Decimal("10000.00"),
            top_skus=top_skus_data
        )

        # Run the task
        generate_top_skus(date=today)

        # Check that only 10 are stored
        top_sku_record = AnalyticsDailyTopSKU.objects.get(tenant_id=tenant_id, date=today)
        assert len(top_sku_record.sku_data) <= 10

    def test_generate_top_skus_multiple_tenants(self, test_skus):
        """Test that top SKUs are segregated by tenant."""
        today = timezone.localdate()
        tenant_1 = uuid.uuid4()
        tenant_2 = uuid.uuid4()

        # Create sales for two tenants
        AnalyticsDailySales.objects.create(
            tenant_id=tenant_1,
            date=today,
            total_orders=10,
            total_revenue=Decimal("1000.00"),
            top_skus=[{"sku_id": str(test_skus[0].sku_id), "revenue": 1000.00}]
        )

        AnalyticsDailySales.objects.create(
            tenant_id=tenant_2,
            date=today,
            total_orders=5,
            total_revenue=Decimal("500.00"),
            top_skus=[{"sku_id": str(test_skus[1].sku_id), "revenue": 500.00}]
        )

        # Run the task
        generate_top_skus(date=today)

        # Check that both tenants have separate records
        top_sku_1 = AnalyticsDailyTopSKU.objects.filter(tenant_id=tenant_1, date=today).first()
        top_sku_2 = AnalyticsDailyTopSKU.objects.filter(tenant_id=tenant_2, date=today).first()

        assert top_sku_1 is not None
        assert top_sku_2 is not None

    def test_generate_top_skus_no_sales_data(self, tenant_id):
        """Test task behavior when there's no sales data."""
        # Run the task without any sales data
        generate_top_skus(date=timezone.localdate())

        # Should not create any top SKU records
        top_sku_count = AnalyticsDailyTopSKU.objects.filter(tenant_id=tenant_id).count()
        assert top_sku_count == 0

    def test_generate_top_skus_default_date(self, tenant_id, test_skus):
        """Test that task uses current date when date parameter is None."""
        today = timezone.localdate()

        # Create sales data
        AnalyticsDailySales.objects.create(
            tenant_id=tenant_id,
            date=today,
            total_orders=5,
            total_revenue=Decimal("500.00"),
            top_skus=[{"sku_id": str(test_skus[0].sku_id), "revenue": 500.00}]
        )

        # Run task without date parameter
        generate_top_skus()

        # Should create record for today
        top_sku = AnalyticsDailyTopSKU.objects.filter(
            tenant_id=tenant_id,
            date=today
        ).first()
        assert top_sku is not None
