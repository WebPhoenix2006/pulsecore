import datetime
from decimal import Decimal

from django.db.models import Sum, F
from django.utils import timezone
from celery import shared_task

from main_services.orders.models import Order
from main_services.inventory.models import SKU
from .models import (
    AnalyticsDailySales,
    AnalyticsDailyStock,
    AnalyticsDailyTopSKU,
    StockoutIncident,
)


@shared_task(name="analytics.generate_daily_sales")
def generate_daily_sales(date=None):
    """
    Aggregate daily sales from Orders into AnalyticsDailySales.
    """
    if date is None:
        date = timezone.localdate()

    start = datetime.datetime.combine(
        date, datetime.time.min, tzinfo=timezone.get_current_timezone()
    )
    end = datetime.datetime.combine(
        date, datetime.time.max, tzinfo=timezone.get_current_timezone()
    )

    # Group by tenant
    tenants = Order.objects.values_list("tenant_id", flat=True).distinct()
    for tenant_id in tenants:
        orders = Order.objects.filter(
            tenant_id=tenant_id,
            created_at__range=[start, end],
            status__in=["completed", "paid", "delivered", "processing"],
            payment_status="paid",
        )
        totals = orders.aggregate(
            total_orders=Sum(1),
            total_items=Sum("items__quantity"),
            total_revenue=Sum("total_amount"),
        )

        total_orders = orders.count()
        total_items = totals["total_items"] or 0
        total_revenue = totals["total_revenue"] or Decimal("0.00")

        # Determine top SKUs - aggregate by sku_id and sum the total_amount for orders containing that SKU
        # Note: This is a simplified approach since OrderItem doesn't have unit_price
        # We're using order total_amount divided by item count as approximation
        top_skus = (
            orders.values(sku_id=F("items__sku_id"))
            .annotate(revenue=Sum("total_amount"))
            .order_by("-revenue")[:5]
        )
        top_skus_list = [
            {"sku_id": str(s["sku_id"]), "revenue": float(s["revenue"])} for s in top_skus
        ]

        AnalyticsDailySales.objects.update_or_create(
            tenant_id=tenant_id,
            date=date,
            defaults={
                "total_orders": total_orders,
                "total_items": total_items,
                "total_revenue": total_revenue,
                "top_skus": top_skus_list,
            },
        )


@shared_task(name="analytics.generate_daily_stock")
def generate_daily_stock(date=None):
    """
    Aggregate daily stock levels from SKUs into AnalyticsDailyStock.
    """
    if date is None:
        date = timezone.localdate()

    tenants = SKU.objects.values_list("tenant_id", flat=True).distinct()
    for tenant_id in tenants:
        skus = SKU.objects.filter(tenant_id=tenant_id)
        total_stock = skus.aggregate(total=Sum("stock_level"))["total"] or 0
        low_stock_count = skus.filter(
            reorder_threshold__isnull=False, stock_level__lte=F("reorder_threshold")
        ).count()
        stockout_count = skus.filter(stock_level__lte=0).count()

        AnalyticsDailyStock.objects.update_or_create(
            tenant_id=tenant_id,
            date=date,
            defaults={
                "total_stock": total_stock,
                "low_stock_count": low_stock_count,
                "stockout_count": stockout_count,
            },
        )

        # Optional: log stockouts
        for sku in skus.filter(stock_level__lte=0):
            StockoutIncident.objects.get_or_create(
                tenant_id=tenant_id,
                sku_id=sku.sku_id,
                sku_name=sku.name,
                incident_date=date,
                defaults={"note": "Detected during daily rollup"},
            )


@shared_task(name="analytics.generate_top_skus")
def generate_top_skus(date=None):
    """
    Periodically recompute global top SKUs (by revenue).
    """
    if date is None:
        date = timezone.localdate()

    tenants = AnalyticsDailySales.objects.values_list("tenant_id", flat=True).distinct()
    for tenant_id in tenants:
        top = AnalyticsDailySales.objects.filter(tenant_id=tenant_id).order_by(
            "-total_revenue"
        )[:10]
        top_skus_data = []
        for s in top:
            if isinstance(s.top_skus, list):
                top_skus_data.extend(s.top_skus)
        AnalyticsDailyTopSKU.objects.update_or_create(
            tenant_id=tenant_id,
            date=date,
            defaults={"sku_data": top_skus_data[:10]},
        )
