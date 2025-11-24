# Celery Quick Start Guide

## 🚀 Quick Commands

### Start Celery Worker
```bash
cd services
celery -A backend worker --loglevel=info --pool=solo
```

### Run Tasks Manually
```bash
python run_tasks.py
```

### Check Task Status
```bash
# Check all tasks and analytics data
python check_task_status.py

# Check specific task by ID
python check_task_status.py <task_id>
```

### Check Redis Connection
```bash
python check_redis.py
```

---

## 📊 What The Scripts Do

### 1. `run_tasks.py`
Triggers all 3 analytics tasks:
- Daily sales aggregation
- Daily stock levels
- Top SKUs calculation

**Output:** Task IDs for tracking

### 2. `check_task_status.py`
Shows:
- Recent task statuses (SUCCESS/FAILED/PENDING)
- Analytics data summary
- Stockout incidents
- Can check specific task by ID

### 3. `check_redis.py`
Verifies:
- Redis connection
- Server info
- Queue status
- Celery keys in Redis

---

## ✅ Verification Steps

### 1. Check if tasks ran successfully
```bash
python check_task_status.py
```

Look for:
- ✅ Tasks with `Status: SUCCESS`
- ✅ Analytics records for today
- ✅ Non-zero counts in database

### 2. Check worker logs
Look for lines like:
```
[2025-11-24 11:59:09] Task analytics.generate_daily_sales[...] succeeded
```

### 3. Query database directly
```bash
python manage.py shell
```

```python
from main_services.analytics.models import *
from datetime import date

# Check if data exists
print(f"Sales: {AnalyticsDailySales.objects.filter(date=date.today()).count()}")
print(f"Stock: {AnalyticsDailyStock.objects.filter(date=date.today()).count()}")
print(f"Top SKUs: {AnalyticsDailyTopSKU.objects.filter(date=date.today()).count()}")
```

---

## 🔍 Troubleshooting

### Tasks show PENDING but never run
**Problem:** Worker not running or not connected to Redis

**Solutions:**
1. Check worker is running:
   ```bash
   celery -A backend inspect active
   ```

2. Check Redis connection:
   ```bash
   python check_redis.py
   ```

3. Restart worker:
   ```bash
   celery -A backend worker --loglevel=info --pool=solo
   ```

### Tasks fail with errors
**Problem:** Missing data or database issues

**Solutions:**
1. Check worker logs for error details
2. Verify database has orders/inventory data
3. Check tenant_id fields are populated

### No analytics data generated
**Possible reasons:**
- No orders exist in database (sales will be $0)
- No SKUs exist in database (stock will be 0)
- Tasks haven't run yet (check worker logs)

**This is normal if:**
- You just set up the system
- Haven't created any orders yet
- Haven't added inventory items

---

## 📝 Common Workflows

### Daily Analytics Run
```bash
# 1. Start worker (if not running)
celery -A backend worker --loglevel=info --pool=solo

# 2. In another terminal, run tasks
python run_tasks.py

# 3. Check results
python check_task_status.py
```

### Debug Failed Task
```bash
# 1. Get task ID from run_tasks.py output
python run_tasks.py
# Note the Task ID

# 2. Check specific task status
python check_task_status.py <task_id>

# 3. Check worker logs for detailed error
# Look at worker terminal output
```

### Manual Task Execution (one at a time)
```bash
python manage.py shell
```

```python
from main_services.analytics.tasks import *

# Run synchronously (blocking)
generate_daily_sales()

# Run asynchronously (non-blocking)
result = generate_daily_sales.delay()
print(f"Task ID: {result.id}")
```

---

## 📈 Understanding the Output

### Task Status
- **SUCCESS** ✅ - Task completed successfully
- **PENDING** ⏳ - Task waiting to execute
- **STARTED** 🏃 - Task currently running
- **FAILURE** ❌ - Task failed with error
- **RETRY** 🔄 - Task being retried

### Analytics Data

**Daily Sales:**
- `total_orders`: Number of paid orders
- `total_revenue`: Sum of order amounts
- `total_items`: Total items sold
- `top_skus`: Best-selling products

**Daily Stock:**
- `total_stock`: Total inventory across all SKUs
- `low_stock_count`: Items below reorder threshold
- `stockout_count`: Items with zero stock

**Stockout Incidents:**
- Tracks when items run out of stock
- Helps identify inventory issues

---

## 🎯 Expected Results

After running `python run_tasks.py` successfully:

1. **3 tasks queued** with unique IDs
2. **Worker processes tasks** (check logs)
3. **Database records created** (one per tenant)
4. **check_task_status.py shows:**
   - Tasks with SUCCESS status
   - Analytics records for today
   - Summary of data

---

## 💡 Tips

1. **Keep worker running** - Tasks won't execute without it
2. **Check logs first** - Worker terminal shows detailed errors
3. **Use check_task_status.py** - Easiest way to verify everything
4. **Tasks are idempotent** - Safe to run multiple times
5. **Redis stores results** - Task history available for inspection

---

## 📚 More Information

For detailed documentation, see: [CELERY_DOCUMENTATION.md](CELERY_DOCUMENTATION.md)

For Celery worker logs, check your terminal where worker is running.

---

**Last Updated:** 2025-11-24
