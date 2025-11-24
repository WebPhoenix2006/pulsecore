#!/usr/bin/env python
"""
Script to check orders in the database.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from main_services.orders.models import Order
from datetime import date

today = date.today()
orders = Order.objects.filter(created_at__date=today)

print("=" * 60)
print(f"Orders for {today}")
print("=" * 60)
print(f"\nTotal orders today: {orders.count()}\n")

if orders.exists():
    for order in orders:
        print(f"Order ID: {order.order_id}")
        print(f"  Status: {order.status}")
        print(f"  Payment Status: {order.payment_status}")
        print(f"  Total Amount: ${order.total_amount}")
        print(f"  Created: {order.created_at}")
        print(f"  Tenant: {order.tenant_id}")
        print()
else:
    print("No orders found for today")

print("=" * 60)
print("\nAll orders (any date):")
all_orders = Order.objects.all().order_by('-created_at')[:10]
print(f"Total orders: {Order.objects.count()}")
print(f"\nRecent orders (last 10):\n")

for order in all_orders:
    print(f"Order ID: {order.order_id}")
    print(f"  Status: {order.status}")
    print(f"  Payment Status: {order.payment_status}")
    print(f"  Total Amount: ${order.total_amount}")
    print(f"  Created: {order.created_at}")
    print()

print("=" * 60)
