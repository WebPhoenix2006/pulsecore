import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from main_services.analytics.models import AnalyticsDailySales, AnalyticsDailyStock
from main_services.orders.models import Order
from main_services.inventory.models import SKU

print("=== TENANT IDs IN DATABASE ===\n")

# Check analytics
sales = AnalyticsDailySales.objects.first()
if sales:
    print(f"Analytics Sales Tenant ID: {sales.tenant_id}")

stock = AnalyticsDailyStock.objects.first()
if stock:
    print(f"Analytics Stock Tenant ID: {stock.tenant_id}")

# Check orders
print(f"\n=== ORDERS (Total: {Order.objects.count()}) ===")
for order in Order.objects.all()[:5]:
    print(f"  Tenant: {order.tenant_id}")

# Check SKUs
print(f"\n=== SKUs (Total: {SKU.objects.count()}) ===")
for sku in SKU.objects.all()[:5]:
    print(f"  Tenant: {sku.tenant_id}")

# Get unique tenants
print("\n=== UNIQUE TENANT IDs ===")
from django.db.models import Q

tenant_ids = set()
tenant_ids.update(Order.objects.values_list('tenant_id', flat=True).distinct())
tenant_ids.update(SKU.objects.values_list('tenant_id', flat=True).distinct())

for tid in tenant_ids:
    print(f"  {tid}")

if tenant_ids:
    print(f"\n>>> USE THIS TENANT ID: {list(tenant_ids)[0]}")
