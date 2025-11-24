#!/usr/bin/env python
"""
Script to check Celery task status and analytics data.
Usage: python check_task_status.py [task_id]
"""
import os
import sys
import django
from datetime import datetime

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from celery.result import AsyncResult
from backend.celery import app
from main_services.analytics.models import (
    AnalyticsDailySales,
    AnalyticsDailyStock,
    AnalyticsDailyTopSKU,
    StockoutIncident
)


def check_task_status(task_id):
    """Check the status of a specific task."""
    print("=" * 60)
    print(f"Checking Task Status: {task_id}")
    print("=" * 60)

    result = AsyncResult(task_id, app=app)

    print(f"\nStatus: {result.status}")
    print(f"Task ID: {result.id}")
    print(f"Task Name: {result.name if hasattr(result, 'name') else 'Unknown'}")

    if result.successful():
        print(f"Result: {result.result}")
        print("\n[SUCCESS] Task completed successfully!")
    elif result.failed():
        print(f"Error: {result.result}")
        print(f"Traceback: {result.traceback}")
        print("\n[FAILED] Task failed with error!")
    elif result.status == 'PENDING':
        print("\n[PENDING] Task is waiting to be executed")
        print("   - Check if Celery worker is running")
        print("   - Check Redis connection")
    elif result.status == 'STARTED':
        print("\n[RUNNING] Task is currently being executed")
    elif result.status == 'RETRY':
        print("\n[RETRY] Task is being retried")

    print("=" * 60)


def check_analytics_data():
    """Check if analytics data has been updated."""
    print("\n" + "=" * 60)
    print("Analytics Data Summary")
    print("=" * 60)

    today = datetime.now().date()

    # Check Daily Sales
    print("\n[1] Daily Sales Analytics:")
    sales_today = AnalyticsDailySales.objects.filter(date=today)
    if sales_today.exists():
        print(f"   Records found: {sales_today.count()}")
        for sale in sales_today:
            print(f"   - Tenant: {sale.tenant_id}")
            print(f"     Total Orders: {sale.total_orders}")
            print(f"     Total Revenue: ${sale.total_revenue}")
            print(f"     Total Items: {sale.total_items}")
            if sale.top_skus:
                print(f"     Top SKUs: {len(sale.top_skus)} products")
    else:
        print("   No records found for today")
        print("   (This is normal if you haven't created any orders yet)")

    # Check Daily Stock
    print("\n[2] Daily Stock Analytics:")
    stock_today = AnalyticsDailyStock.objects.filter(date=today)
    if stock_today.exists():
        print(f"   Records found: {stock_today.count()}")
        for stock in stock_today:
            print(f"   - Tenant: {stock.tenant_id}")
            print(f"     Total Stock: {stock.total_stock}")
            print(f"     Low Stock Items: {stock.low_stock_count}")
            print(f"     Stockout Items: {stock.stockout_count}")
    else:
        print("   No records found for today")

    # Check Top SKUs
    print("\n[3] Top SKUs Analytics:")
    top_skus_today = AnalyticsDailyTopSKU.objects.filter(date=today)
    if top_skus_today.exists():
        print(f"   Records found: {top_skus_today.count()}")
        for top in top_skus_today:
            print(f"   - Tenant: {top.tenant_id}")
            if top.sku_data:
                print(f"     Top Products: {len(top.sku_data)}")
    else:
        print("   No records found for today")

    # Check Stockout Incidents
    print("\n[4] Stockout Incidents:")
    stockouts_today = StockoutIncident.objects.filter(incident_date=today)
    if stockouts_today.exists():
        print(f"   Incidents found: {stockouts_today.count()}")
        for incident in stockouts_today:
            print(f"   - SKU: {incident.sku_name}")
            print(f"     Date: {incident.incident_date}")
            if incident.note:
                print(f"     Note: {incident.note}")
    else:
        print("   No stockout incidents for today")

    print("\n" + "=" * 60)

    # Summary
    total_records = (
        sales_today.count() +
        stock_today.count() +
        top_skus_today.count()
    )

    if total_records > 0:
        print("[SUCCESS] Analytics data is being generated!")
        print(f"Total records for today: {total_records}")
    else:
        print("[INFO] No analytics data generated yet")
        print("This could mean:")
        print("  - Tasks haven't run yet (check worker logs)")
        print("  - No order/inventory data exists to analyze")
        print("  - Tasks are still processing")

    print("=" * 60)


def list_recent_tasks():
    """List recent Celery tasks from Redis."""
    print("\n" + "=" * 60)
    print("Recent Celery Tasks (from Redis)")
    print("=" * 60)

    try:
        import redis
        from decouple import config

        redis_url = config('CELERY_BROKER_URL', default='redis://localhost:6379/0')
        r = redis.from_url(redis_url)

        # Get all celery result keys
        result_keys = r.keys('celery-task-meta-*')

        if result_keys:
            print(f"\nFound {len(result_keys)} task results in Redis")
            print("\nRecent tasks (last 10):")

            for key in result_keys[-10:]:
                task_id = key.decode().replace('celery-task-meta-', '')
                result = AsyncResult(task_id, app=app)
                print(f"\n  Task ID: {task_id}")
                print(f"  Status: {result.status}")
                if hasattr(result, 'name') and result.name:
                    print(f"  Name: {result.name}")
        else:
            print("\n[INFO] No task results found in Redis")
            print("Tasks may have expired or haven't been run yet")

    except Exception as e:
        print(f"\n[ERROR] Could not fetch tasks from Redis: {e}")

    print("\n" + "=" * 60)


def main():
    """Main function."""
    if len(sys.argv) > 1:
        # Check specific task
        task_id = sys.argv[1]
        check_task_status(task_id)
    else:
        # Show analytics data summary
        print("=" * 60)
        print("Celery Task & Analytics Data Checker")
        print("=" * 60)
        print("\nUsage:")
        print("  Check specific task:  python check_task_status.py <task_id>")
        print("  Check all data:       python check_task_status.py")

        list_recent_tasks()
        check_analytics_data()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n[CANCELLED] Cancelled by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
