# Celery Setup Documentation for PulseCore

## Overview

PulseCore uses Celery as an asynchronous task queue for handling background jobs, particularly for analytics data aggregation. The system uses Redis as both the message broker and result backend.

## Architecture

```
┌─────────────────┐
│  Django App     │
│  (Main Process) │
└────────┬────────┘
         │
         │ Tasks queued
         ▼
┌─────────────────┐
│  Redis Broker   │  ← Message queue
└────────┬────────┘
         │
         │ Tasks consumed
         ▼
┌─────────────────┐
│ Celery Worker   │  ← Executes tasks
└────────┬────────┘
         │
         │ Results stored
         ▼
┌─────────────────┐
│ Redis Backend   │  ← Task results
└─────────────────┘
```

## File Structure

```
services/
├── backend/
│   ├── __init__.py          # Celery app initialization (commented out)
│   ├── celery.py            # Celery application configuration
│   └── settings.py          # Django settings with Celery config
├── main_services/
│   └── analytics/
│       └── tasks.py         # Analytics-related Celery tasks
└── run_tasks.py             # Script to manually trigger tasks
```

## Configuration

### 1. Celery Application ([backend/celery.py](backend/celery.py))

```python
import os
from celery import Celery

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Create Celery app
app = Celery('backend')

# Load configuration from Django settings with CELERY_ prefix
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks from all registered Django apps
app.autodiscover_tasks()
```

**Key Features:**
- Automatically discovers tasks in all installed Django apps
- Uses `CELERY_` prefix for configuration keys
- Includes a debug task for testing

### 2. Django Settings ([backend/settings.py](backend/settings.py))

```python
# Celery Configuration
CELERY_BROKER_URL = config("CELERY_BROKER_URL", default="redis://localhost:6379/0")
CELERY_RESULT_BACKEND = config("CELERY_RESULT_BACKEND", default="redis://localhost:6379/0")
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = TIME_ZONE
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 30 * 60  # 30 minutes
```

**Configuration Options:**

| Setting | Value | Description |
|---------|-------|-------------|
| `CELERY_BROKER_URL` | `redis://localhost:6379/0` | Redis connection for message broker |
| `CELERY_RESULT_BACKEND` | `redis://localhost:6379/0` | Redis connection for storing results |
| `CELERY_ACCEPT_CONTENT` | `["json"]` | Accepted content types |
| `CELERY_TASK_SERIALIZER` | `json` | Serialization format for tasks |
| `CELERY_RESULT_SERIALIZER` | `json` | Serialization format for results |
| `CELERY_TIMEZONE` | Inherited from `TIME_ZONE` | Task scheduling timezone |
| `CELERY_TASK_TRACK_STARTED` | `True` | Track when tasks start executing |
| `CELERY_TASK_TIME_LIMIT` | `1800` seconds (30 min) | Maximum task execution time |

### 3. Celery App Initialization

**Note:** The Celery app initialization in [backend/__init__.py](backend/__init__.py) is currently commented out:

```python
# from .celery import app as celery_app
# __all__ = ('celery_app',)
```

**To enable auto-discovery of tasks on Django startup, uncomment these lines:**

```python
from .celery import app as celery_app
__all__ = ('celery_app',)
```

## Available Tasks

### Analytics Tasks ([main_services/analytics/tasks.py](main_services/analytics/tasks.py))

#### 1. Generate Daily Sales (`analytics.generate_daily_sales`)

```python
@shared_task(name="analytics.generate_daily_sales")
def generate_daily_sales(date=None):
```

**Purpose:** Aggregates daily sales data from orders into `AnalyticsDailySales` model.

**Functionality:**
- Aggregates sales by tenant
- Filters orders with status: `completed`, `paid`, `delivered`, `processing`
- Filters orders with `payment_status="paid"`
- Calculates:
  - Total orders count
  - Total items sold
  - Total revenue
  - Top 5 SKUs by revenue
- Stores/updates data in `AnalyticsDailySales` table

**Parameters:**
- `date` (optional): Target date for analytics (defaults to today)

**Usage:**
```python
# Synchronous execution
generate_daily_sales()

# Asynchronous execution
generate_daily_sales.delay()

# With specific date
from datetime import date
generate_daily_sales.delay(date=date(2024, 1, 15))
```

#### 2. Generate Daily Stock (`analytics.generate_daily_stock`)

```python
@shared_task(name="analytics.generate_daily_stock")
def generate_daily_stock(date=None):
```

**Purpose:** Aggregates daily stock levels from SKUs into `AnalyticsDailyStock` model.

**Functionality:**
- Aggregates stock by tenant
- Calculates:
  - Total stock level
  - Low stock count (SKUs at or below reorder threshold)
  - Stockout count (SKUs with 0 stock)
- Logs stockout incidents in `StockoutIncident` table
- Stores/updates data in `AnalyticsDailyStock` table

**Parameters:**
- `date` (optional): Target date for analytics (defaults to today)

**Usage:**
```python
# Asynchronous execution
generate_daily_stock.delay()
```

#### 3. Generate Top SKUs (`analytics.generate_top_skus`)

```python
@shared_task(name="analytics.generate_top_skus")
def generate_top_skus(date=None):
```

**Purpose:** Computes global top SKUs by revenue across all daily sales records.

**Functionality:**
- Retrieves top 10 daily sales records by revenue
- Aggregates top SKUs from those records
- Stores top 10 SKUs overall in `AnalyticsDailyTopSKU` table

**Parameters:**
- `date` (optional): Target date for analytics (defaults to today)

**Usage:**
```python
# Asynchronous execution
generate_top_skus.delay()
```

## Installation & Setup

### Prerequisites

1. **Redis Server**

   **Option A: Windows (Memurai - Redis-compatible)**
   - Download Memurai: https://www.memurai.com/get-memurai
   - Or use Redis for Windows: https://github.com/tporadowski/redis/releases

   **Option B: Docker (Recommended)**
   ```bash
   docker run -d --name redis -p 6379:6379 redis:latest
   ```

   **Option C: Cloud Redis**
   - Redis Cloud: https://redis.com/try-free/
   - AWS ElastiCache, Azure Cache for Redis, etc.

2. **Python Packages**
   - Celery 5.4.0
   - Redis 5.2.1
   - Already in `requirements.txt`

### Setup Steps

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure Environment Variables** (`.env` file)
   ```env
   CELERY_BROKER_URL=redis://localhost:6379/0
   CELERY_RESULT_BACKEND=redis://localhost:6379/0
   ```

3. **Enable Celery App** (optional but recommended)

   Uncomment in `backend/__init__.py`:
   ```python
   from .celery import app as celery_app
   __all__ = ('celery_app',)
   ```

4. **Verify Redis is Running**

   **Method 1: Using Python**
   ```bash
   python manage.py shell
   ```
   ```python
   import redis
   r = redis.Redis(host='localhost', port=6379, db=0)
   print(r.ping())  # Should return: True
   ```

   **Method 2: Using redis-cli (if installed)**
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

   **Method 3: Using Docker (if using Docker)**
   ```bash
   docker ps | grep redis  # Check if container is running
   docker exec -it redis redis-cli ping  # Should return: PONG
   ```

   **Method 4: Using Telnet**
   ```bash
   telnet localhost 6379
   # Type: PING
   # Should return: +PONG
   ```

## Running Celery

### Development

#### Start Celery Worker

**Windows:**
```bash
# Navigate to services directory
cd services

# Start worker with eventlet (recommended for Windows)
celery -A backend worker --loglevel=info --pool=solo
```

**Linux/Mac:**
```bash
cd services
celery -A backend worker --loglevel=info
```

**With specific concurrency:**
```bash
celery -A backend worker --loglevel=info --concurrency=4
```

#### Start Celery Beat (for scheduled tasks)

**Note:** Currently no periodic tasks are configured. To add them, see [Adding Periodic Tasks](#adding-periodic-tasks) below.

```bash
celery -A backend beat --loglevel=info
```

#### Combined Worker + Beat
```bash
celery -A backend worker --beat --loglevel=info
```

### Production

Use a process manager like **Supervisor** or **systemd**.

#### Example Supervisor Configuration

Create `/etc/supervisor/conf.d/celery.conf`:

```ini
[program:celery_worker]
command=/path/to/venv/bin/celery -A backend worker --loglevel=info
directory=/path/to/services
user=www-data
numprocs=1
stdout_logfile=/var/log/celery/worker.log
stderr_logfile=/var/log/celery/worker.log
autostart=true
autorestart=true
startsecs=10
stopwaitsecs=600

[program:celery_beat]
command=/path/to/venv/bin/celery -A backend beat --loglevel=info
directory=/path/to/services
user=www-data
numprocs=1
stdout_logfile=/var/log/celery/beat.log
stderr_logfile=/var/log/celery/beat.log
autostart=true
autorestart=true
startsecs=10
```

Start services:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start celery_worker
sudo supervisorctl start celery_beat
```

## Task Execution

### Manual Task Execution

#### Using Django Shell
```bash
python manage.py shell
```

```python
from main_services.analytics.tasks import generate_daily_sales, generate_daily_stock, generate_top_skus

# Execute asynchronously
result = generate_daily_sales.delay()
print(f"Task ID: {result.id}")

# Check task status
from celery.result import AsyncResult
task_result = AsyncResult(result.id)
print(f"Status: {task_result.status}")
print(f"Result: {task_result.result}")
```

#### Using run_tasks.py Script
```bash
cd services
python run_tasks.py
```

This script triggers all three analytics tasks asynchronously:
- `generate_daily_sales`
- `generate_daily_stock`
- `generate_top_skus`

**Example Output:**
```
============================================================
Running Celery Analytics Tasks
============================================================

[1/3] Triggering generate_daily_sales task...
   Task ID: e2953e0a-37c5-44ea-8ecb-0382be220432
   Status: Queued

[2/3] Triggering generate_daily_stock task...
   Task ID: 844bf0e2-3f84-4b46-b79b-55e86c32a5dd
   Status: Queued

[3/3] Triggering generate_top_skus task...
   Task ID: 49bbb944-d93d-46d3-a392-1bf480bd97fb
   Status: Queued
```

#### Checking Task Status

**Method 1: Check all tasks and analytics data**
```bash
cd services
python check_task_status.py
```

This shows:
- Recent tasks from Redis with their status
- Analytics data summary for today
- Stockout incidents

**Method 2: Check specific task by ID**
```bash
python check_task_status.py <task_id>
```

Example:
```bash
python check_task_status.py e2953e0a-37c5-44ea-8ecb-0382be220432
```

**Method 3: Query database directly**
```bash
python manage.py shell
```

```python
from main_services.analytics.models import AnalyticsDailySales, AnalyticsDailyStock
from datetime import date

# Check today's sales analytics
sales = AnalyticsDailySales.objects.filter(date=date.today())
for s in sales:
    print(f"Tenant: {s.tenant_id}")
    print(f"Orders: {s.total_orders}, Revenue: ${s.total_revenue}")

# Check today's stock analytics
stock = AnalyticsDailyStock.objects.filter(date=date.today())
for st in stock:
    print(f"Tenant: {st.tenant_id}")
    print(f"Stock: {st.total_stock}, Low Stock: {st.low_stock_count}")
```

### Programmatic Task Execution

```python
from main_services.analytics.tasks import generate_daily_sales

# Execute immediately (blocking)
generate_daily_sales()

# Execute asynchronously (non-blocking)
task = generate_daily_sales.delay()

# Execute at specific time
from datetime import datetime, timedelta
eta = datetime.now() + timedelta(hours=1)
generate_daily_sales.apply_async(eta=eta)

# Execute with countdown
generate_daily_sales.apply_async(countdown=60)  # Execute in 60 seconds
```

## Adding Periodic Tasks

To run tasks on a schedule, add Celery Beat configuration to `settings.py`:

```python
from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    'generate-daily-sales': {
        'task': 'analytics.generate_daily_sales',
        'schedule': crontab(hour=0, minute=5),  # Run daily at 00:05
    },
    'generate-daily-stock': {
        'task': 'analytics.generate_daily_stock',
        'schedule': crontab(hour=0, minute=10),  # Run daily at 00:10
    },
    'generate-top-skus': {
        'task': 'analytics.generate_top_skus',
        'schedule': crontab(hour=1, minute=0),  # Run daily at 01:00
    },
}
```

**Common Schedule Patterns:**

```python
from celery.schedules import crontab

# Run every 30 minutes
'schedule': crontab(minute='*/30')

# Run every hour
'schedule': crontab(minute=0)

# Run every day at midnight
'schedule': crontab(hour=0, minute=0)

# Run every Monday at 8am
'schedule': crontab(day_of_week=1, hour=8, minute=0)

# Run on the first day of every month
'schedule': crontab(day_of_month=1, hour=0, minute=0)
```

## Monitoring & Debugging

### Check Task Status

```python
from celery.result import AsyncResult

task_id = 'your-task-id-here'
result = AsyncResult(task_id)

print(f"Status: {result.status}")
print(f"Result: {result.result}")
print(f"Traceback: {result.traceback}")
```

### Monitor with Flower

Install Flower for real-time monitoring:

```bash
pip install flower
celery -A backend flower
```

Access at: http://localhost:5555

### Check Redis Queue

**Using Python:**
```python
python manage.py shell
```
```python
import redis
r = redis.Redis(host='localhost', port=6379, db=0)

# Check queue length
print(f"Queue length: {r.llen('celery')}")

# View all tasks in queue
tasks = r.lrange('celery', 0, -1)
for task in tasks:
    print(task)

# Check all keys
print(f"All keys: {r.keys('*')}")
```

**Using redis-cli (if installed):**
```bash
redis-cli
> LLEN celery  # Check queue length
> LRANGE celery 0 -1  # View all tasks in queue
> KEYS *  # View all keys
```

### View Worker Logs

Increase verbosity:
```bash
celery -A backend worker --loglevel=debug
```

### Inspect Active Workers

```bash
celery -A backend inspect active
celery -A backend inspect stats
celery -A backend inspect registered
```

## Common Issues & Troubleshooting

### 1. "No module named 'backend'" Error

**Solution:** Ensure you're in the correct directory:
```bash
cd services
celery -A backend worker --loglevel=info
```

### 2. Redis Connection Error

**Check Redis is running (Python method):**
```python
python manage.py shell
```
```python
import redis
r = redis.Redis(host='localhost', port=6379, db=0)
try:
    r.ping()
    print("✅ Redis is running")
except redis.ConnectionError:
    print("❌ Cannot connect to Redis")
```

**Check Redis with Docker (if using Docker):**
```bash
docker ps | grep redis
docker logs redis  # Check Redis logs
```

**Check connection URL:**
```bash
# Windows PowerShell
echo $env:CELERY_BROKER_URL

# Windows CMD
echo %CELERY_BROKER_URL%

# Linux/Mac
echo $CELERY_BROKER_URL
```

### 3. Tasks Not Executing

**Verify worker is running:**
```bash
celery -A backend inspect active
```

**Check task is registered:**
```bash
celery -A backend inspect registered
```

### 4. Tasks Stuck in "PENDING" State

- Check if worker is running
- Verify task name matches registered task
- Check Redis connectivity
- Review worker logs for errors

### 5. Windows-Specific Issues

Use `--pool=solo` for Windows:
```bash
celery -A backend worker --pool=solo --loglevel=info
```

Or install eventlet:
```bash
pip install eventlet
celery -A backend worker --pool=eventlet --loglevel=info
```

## Best Practices

### 1. Task Design
- Keep tasks **idempotent** (safe to run multiple times)
- Handle errors gracefully
- Use timeouts to prevent hanging tasks
- Log important events

### 2. Error Handling

```python
from celery import shared_task
from celery.utils.log import get_task_logger

logger = get_task_logger(__name__)

@shared_task(bind=True, max_retries=3)
def my_task(self, arg):
    try:
        # Task logic
        pass
    except Exception as exc:
        logger.error(f"Task failed: {exc}")
        raise self.retry(exc=exc, countdown=60)
```

### 3. Resource Management
- Limit concurrent tasks to avoid overloading database
- Use connection pooling for databases
- Close connections after tasks complete

### 4. Production Deployment
- Use process managers (Supervisor, systemd)
- Set up monitoring (Flower, Sentry)
- Configure log rotation
- Use environment variables for sensitive data
- Set appropriate worker concurrency based on server resources

## Security Considerations

1. **Protect Redis:**
   - Use authentication: `redis://user:password@localhost:6379/0`
   - Use TLS for production: `rediss://localhost:6379/0`
   - Bind to localhost or private network

2. **Environment Variables:**
   - Store sensitive configs in `.env`
   - Never commit credentials to version control

3. **Task Permissions:**
   - Run workers with limited user permissions
   - Validate all task inputs
   - Sanitize data before database operations

## Additional Resources

- [Celery Documentation](https://docs.celeryq.dev/)
- [Django Celery Integration](https://docs.celeryq.dev/en/stable/django/first-steps-with-django.html)
- [Redis Documentation](https://redis.io/documentation)
- [Flower Monitoring Tool](https://flower.readthedocs.io/)

## Summary

Your Celery setup is configured for:
- ✅ Asynchronous task execution
- ✅ Redis as broker and result backend
- ✅ JSON serialization
- ✅ 30-minute task timeout
- ✅ Task tracking
- ✅ Auto-discovery of tasks from Django apps

**Next Steps:**
1. Uncomment Celery initialization in `backend/__init__.py`
2. Add periodic task schedules in `settings.py` (optional)
3. Set up Flower for monitoring (optional)
4. Configure process manager for production deployment

---

**Last Updated:** 2025-01-24
**Version:** 1.0
