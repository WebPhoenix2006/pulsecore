#!/usr/bin/env python
"""
Backfill script to generate historical analytics data.
This creates analytics records for past dates to populate trend charts.
"""

import os
import django
from datetime import date, timedelta
from decimal import Decimal

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from main_services.orders.models import Order, OrderItem
from main_services.inventory.models import SKU
from main_services.analytics.models import (
    AnalyticsDailySales,
    AnalyticsDailyStock,
    AnalyticsDailyTopSKU,
    StockoutIncident,
)
from django.db.models import Sum, Count


def backfill_analytics(days=30):
    """
    Generate analytics data for the past N days.

    Args:
        days: Number of days to backfill (default: 30)
    """
    print("=" * 70)
    print(f"BACKFILLING ANALYTICS DATA - LAST {days} DAYS")
    print("=" * 70)
    print()

    today = date.today()
    tenants = Order.objects.values_list("tenant_id", flat=True).distinct()

    if not tenants:
        print("[WARNING] No tenants found. Please create some orders first.")
        return

    print(f"Found {len(tenants)} tenant(s) to process\n")

    total_records = 0

    for tenant_id in tenants:
        print(f"Processing Tenant: {tenant_id}")
        print("-" * 70)

        for i in range(days - 1, -1, -1):
            target_date = today - timedelta(days=i)

            # Fetch all tenant orders up to this date
            orders = Order.objects.filter(
                tenant_id=tenant_id,
                created_at__date__lte=target_date,
                status__in=["delivered", "processing"],
                payment_status="paid",
            )

            # Orders specific to this day
            daily_orders = orders.filter(created_at__date=target_date)

            daily_totals = daily_orders.aggregate(
                total_orders=Count("order_id"),
                total_items=Sum("items__quantity"),
                total_revenue=Sum("total_amount"),
            )

            total_orders = daily_totals["total_orders"] or 0
            total_items = daily_totals["total_items"] or 0
            total_revenue = daily_totals["total_revenue"] or Decimal("0.00")

            # Create/update daily sales record
            AnalyticsDailySales.objects.update_or_create(
                tenant_id=tenant_id,
                date=target_date,
                defaults={
                    "total_orders": total_orders,
                    "total_items": total_items,
                    "total_revenue": total_revenue,
                },
            )

            # STOCK ANALYTICS --------------------------
            skus = SKU.objects.filter(tenant_id=tenant_id)

            total_stock = skus.aggregate(total=Sum("stock_level"))["total"] or 0
            low_stock_count = skus.filter(
                stock_level__gt=0, stock_level__lte=10
            ).count()
            stockout_count = skus.filter(stock_level=0).count()

            AnalyticsDailyStock.objects.update_or_create(
                tenant_id=tenant_id,
                date=target_date,
                defaults={
                    "total_stock": total_stock,
                    "low_stock_count": low_stock_count,
                    "stockout_count": stockout_count,
                },
            )

            # TOP SKUs (Quantity only) --------------------
            top_skus = (
                OrderItem.objects.filter(
                    order__tenant_id=tenant_id,
                    order__created_at__date__lte=target_date,
                    order__status__in=["delivered", "processing"],
                    order__payment_status="paid",
                )
                .values("sku_id")
                .annotate(total_sold=Sum("quantity"))
                .order_by("-total_sold")[:10]
            )

            # Enrich with SKU names (safe, no joins)
            top_skus_data = []
            for item in top_skus:
                sku_name = (
                    SKU.objects.filter(sku_id=item["sku_id"])
                    .values_list("name", flat=True)
                    .first()
                    or "Unknown"
                )

                top_skus_data.append(
                    {
                        "sku_id": str(item["sku_id"]),
                        "sku_name": sku_name,
                        "total_sold": item["total_sold"] or 0,
                    }
                )

            AnalyticsDailyTopSKU.objects.update_or_create(
                tenant_id=tenant_id,
                date=target_date,
                defaults={"sku_data": top_skus_data},
            )

            # Stockout incident log -----------------------
            if stockout_count > 0:
                for sku in skus.filter(stock_level=0):
                    StockoutIncident.objects.get_or_create(
                        tenant_id=tenant_id,
                        sku_id=sku.sku_id,
                        incident_date=target_date,
                        defaults={"sku_name": sku.name},
                    )

            total_records += 3

            # Progress log every 7 days
            if (days - i) % 7 == 0 or i == 0:
                print(
                    f"  [OK] {target_date}: "
                    f"Orders={total_orders}, "
                    f"Revenue=N{total_revenue:,.2f}, "
                    f"Stock={total_stock}"
                )

        print()

    print("=" * 70)
    print("[SUCCESS] BACKFILL COMPLETE!")
    print(f"   Total records created/updated: {total_records}")
    print(f"   Date range: {today - timedelta(days=days-1)} to {today}")
    print("=" * 70)
    print("\nAnalytics dashboard is now fully populated!\n")


if __name__ == "__main__":
    import sys

    days = 30
    if len(sys.argv) > 1:
        try:
            days = int(sys.argv[1])
        except ValueError:
            print("Usage: python backfill_analytics.py [days]")
            print("Example: python backfill_analytics.py 60")
            sys.exit(1)

    backfill_analytics(days)
