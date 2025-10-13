import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from main_services.analytics.models import (
    AnalyticsDailySales,
    AnalyticsDailyStock,
    AnalyticsDailyTopSKU
)
from django.utils import timezone

print("=== ANALYTICS DATA IN DATABASE ===\n")

# Check what tenant_id to use
sales = AnalyticsDailySales.objects.first()
if sales:
    tenant_id = sales.tenant_id
    print(f"Found Tenant ID: {tenant_id}\n")

    # Check sales data
    print(f"=== SALES DATA (Total: {AnalyticsDailySales.objects.filter(tenant_id=tenant_id).count()}) ===")
    for sale in AnalyticsDailySales.objects.filter(tenant_id=tenant_id).order_by('-date')[:5]:
        print(f"  Date: {sale.date}")
        print(f"  Orders: {sale.total_orders}")
        print(f"  Revenue: {sale.total_revenue}")
        print(f"  Top SKUs: {sale.top_skus}")
        print()

    # Check stock data
    print(f"=== STOCK DATA (Total: {AnalyticsDailyStock.objects.filter(tenant_id=tenant_id).count()}) ===")
    for stock in AnalyticsDailyStock.objects.filter(tenant_id=tenant_id).order_by('-date')[:5]:
        print(f"  Date: {stock.date}")
        print(f"  Total Stock: {stock.total_stock}")
        print(f"  Low Stock Count: {stock.low_stock_count}")
        print(f"  Stockout Count: {stock.stockout_count}")
        print()

    # Check top SKUs
    print(f"=== TOP SKU DATA (Total: {AnalyticsDailyTopSKU.objects.filter(tenant_id=tenant_id).count()}) ===")
    for top in AnalyticsDailyTopSKU.objects.filter(tenant_id=tenant_id).order_by('-date')[:5]:
        print(f"  Date: {top.date}")
        print(f"  SKU Data: {top.sku_data}")
        print()

    # Show today's date
    today = timezone.localdate()
    print(f"=== DATE INFO ===")
    print(f"Today (server): {today}")
    print(f"Timezone: {timezone.get_current_timezone()}")

    # Check date range that dashboard would use
    print(f"\n=== DASHBOARD QUERY RANGE (Last 30 days) ===")
    end_date = today
    start_date = end_date - timezone.timedelta(days=30)
    print(f"Start: {start_date}")
    print(f"End: {end_date}")

    sales_in_range = AnalyticsDailySales.objects.filter(
        tenant_id=tenant_id,
        date__range=[start_date, end_date]
    ).count()
    stock_in_range = AnalyticsDailyStock.objects.filter(
        tenant_id=tenant_id,
        date__range=[start_date, end_date]
    ).count()

    print(f"Sales records in range: {sales_in_range}")
    print(f"Stock records in range: {stock_in_range}")

else:
    print("No analytics data found! Run: python manage.py generate_analytics")
