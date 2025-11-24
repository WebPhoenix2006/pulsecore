#!/usr/bin/env python
"""
Script to manually trigger Celery tasks.
Usage: python run_tasks.py
"""
import os
import sys
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

# Now import tasks after Django is configured
from main_services.analytics.tasks import (
    generate_daily_sales,
    generate_daily_stock,
    generate_top_skus
)


def main():
    """Run analytics tasks."""
    print("=" * 60)
    print("Running Celery Analytics Tasks")
    print("=" * 60)

    print("\n[1/3] Triggering generate_daily_sales task...")
    result1 = generate_daily_sales.delay()
    print(f"   Task ID: {result1.id}")
    print(f"   Status: Queued")

    print("\n[2/3] Triggering generate_daily_stock task...")
    result2 = generate_daily_stock.delay()
    print(f"   Task ID: {result2.id}")
    print(f"   Status: Queued")

    print("\n[3/3] Triggering generate_top_skus task...")
    result3 = generate_top_skus.delay()
    print(f"   Task ID: {result3.id}")
    print(f"   Status: Queued")

    print("\n" + "=" * 60)
    print("All tasks queued successfully!")
    print("=" * 60)
    print("\nNote: Make sure Celery worker is running:")
    print("  celery -A backend worker --loglevel=info --pool=solo")
    print("\nCheck task status:")
    print(f"  Task 1: {result1.id}")
    print(f"  Task 2: {result2.id}")
    print(f"  Task 3: {result3.id}")
    print("=" * 60)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n[CANCELLED] Task execution cancelled by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] Failed to run tasks: {e}")
        sys.exit(1)
