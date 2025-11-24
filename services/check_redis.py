#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Quick script to check Redis connectivity for Celery.
Run this to verify your Redis server is accessible.
"""
import sys
import os
import redis
from decouple import config

# Fix Windows console encoding issues
if sys.platform == 'win32':
    os.system('chcp 65001 >nul 2>&1')  # Set console to UTF-8


def check_redis_connection():
    """Check if Redis is accessible."""

    # Get Redis URL from environment or use default
    redis_url = config('CELERY_BROKER_URL', default='redis://localhost:6379/0')

    print("=" * 60)
    print("Redis Connectivity Check for Celery")
    print("=" * 60)
    print(f"\n[*] Testing connection to: {redis_url}\n")

    try:
        # Parse Redis URL
        r = redis.from_url(redis_url)

        # Test connection with PING
        response = r.ping()

        if response:
            print("[SUCCESS] Redis is running and accessible!")
            print(f"   Response: {response}")

            # Get Redis info
            info = r.info('server')
            print(f"\n[INFO] Redis Server Info:")
            print(f"   Version: {info.get('redis_version', 'Unknown')}")
            print(f"   OS: {info.get('os', 'Unknown')}")
            print(f"   Port: {info.get('tcp_port', 'Unknown')}")

            # Check memory
            memory_info = r.info('memory')
            used_memory_human = memory_info.get('used_memory_human', 'Unknown')
            print(f"   Memory Used: {used_memory_human}")

            # Check if there are any Celery tasks in queue
            celery_queue_length = r.llen('celery')
            print(f"\n[QUEUE] Celery Queue Status:")
            print(f"   Tasks in queue: {celery_queue_length}")

            # Check for any celery keys
            celery_keys = [key.decode() for key in r.keys('celery*')]
            if celery_keys:
                print(f"   Celery-related keys: {len(celery_keys)}")
                for key in celery_keys[:5]:  # Show first 5
                    print(f"      - {key}")
                if len(celery_keys) > 5:
                    print(f"      ... and {len(celery_keys) - 5} more")
            else:
                print(f"   No Celery keys found (queue is clean)")

            print("\n" + "=" * 60)
            print("[READY] Your Redis setup is ready for Celery!")
            print("=" * 60)
            return True

    except redis.ConnectionError as e:
        print("[FAILED] Cannot connect to Redis")
        print(f"   Error: {e}")
        print("\n[TROUBLESHOOT] Steps to fix:")
        print("   1. Make sure Redis server is running")
        print("   2. Check if Redis is listening on the correct port")
        print("   3. Verify firewall settings")
        print("   4. Check CELERY_BROKER_URL in your .env file")
        print("\n[QUICKFIX] Options:")
        print("   - Docker: docker run -d --name redis -p 6379:6379 redis:latest")
        print("   - Windows: Download from https://github.com/tporadowski/redis/releases")
        print("=" * 60)
        return False

    except Exception as e:
        print(f"[ERROR] {type(e).__name__}")
        print(f"   Error: {e}")
        print("=" * 60)
        return False


if __name__ == "__main__":
    success = check_redis_connection()
    sys.exit(0 if success else 1)
