# Analytics Module Test Suite

This directory contains comprehensive unit and end-to-end tests for the analytics module.

## Test Structure

```
tests/
├── __init__.py
├── conftest.py              # Test fixtures and utilities
├── test_models.py           # Unit tests for models
├── test_tasks.py            # Unit tests for Celery tasks
├── test_views.py            # End-to-end tests for API views
├── test_serializers.py      # Unit tests for serializers
└── README.md               # This file
```

## Test Files Overview

### `conftest.py`
Contains pytest fixtures used across all test files:
- `tenant_id`: Generate unique tenant IDs
- `auth_client`: Authenticated API client
- `test_skus`: Sample SKU data for testing
- `low_stock_skus`: SKUs with low stock levels
- `stockout_skus`: SKUs with zero stock
- `test_orders`: Sample orders with items
- `analytics_date`: Consistent date for testing
- `date_range`: Date range for filtering tests
- `sample_top_skus_data`: Sample top SKU data structure

### `test_models.py`
Unit tests for analytics models (60+ test cases):

#### AnalyticsDailySales
- Model creation and validation
- Unique constraints (tenant_id + date)
- `update_or_create_for_date()` class method
- Default values
- Transaction handling

#### AnalyticsDailyStock
- Model creation and validation
- Unique constraints
- `update_or_create_for_date()` class method
- Stock level tracking

#### AnalyticsDailyTopSKU
- Model creation and validation
- Unique constraints (tenant_id + date + sku_id)
- `increment()` class method
- Atomic increments
- Concurrent update handling

#### StockoutIncident
- Model creation and validation
- `record()` class method
- Multiple incidents per SKU
- Order reference tracking

### `test_tasks.py`
Unit tests for Celery tasks (30+ test cases):

#### generate_daily_sales
- Sales aggregation from completed/paid orders
- Status filtering (completed, paid only)
- Date range filtering
- Top SKU calculation
- Multi-tenant support
- Idempotent updates
- Default date handling

#### generate_daily_stock
- Stock level aggregation
- Low stock identification
- Stockout detection
- Automatic stockout incident creation
- No duplicate incidents
- Multi-tenant support

#### generate_top_skus
- Top SKU aggregation from sales data
- Multi-day aggregation
- Top 10 limitation
- Multi-tenant support
- Empty data handling

### `test_views.py`
End-to-end tests for API views (40+ test cases):

#### DashboardAPIView
- Authentication requirements
- Tenant header validation
- Data aggregation
- Date range filtering
- Custom date ranges
- Tenant isolation
- Empty data handling

#### SalesAnalyticsListView
- Authentication requirements
- Data retrieval
- Date range filtering
- Chronological ordering
- Tenant isolation

#### StockAnalyticsListView
- Authentication requirements
- Data retrieval
- Date range filtering
- Tenant isolation

#### StockoutIncidentListView
- Authentication requirements
- Data retrieval
- Date range filtering
- Descending date order
- Tenant isolation

#### AnalyticsExportView
- Authentication requirements
- CSV export for sales data
- CSV export for stock data
- CSV export for stockout incidents
- Metric parameter validation
- Date range filtering
- Tenant isolation

### `test_serializers.py`
Unit tests for serializers (30+ test cases):

#### AnalyticsDailySalesSerializer
- Model instance serialization
- Top SKUs serialization
- Read-only field enforcement

#### AnalyticsDailyStockSerializer
- Model instance serialization
- Adjustments summary serialization
- Read-only field enforcement

#### AnalyticsDailyTopSKUSerializer
- Model instance serialization
- Multiple instances serialization
- Read-only field enforcement

#### StockoutIncidentSerializer
- Model instance serialization
- Order reference serialization
- User reference serialization
- Read-only field enforcement

#### TopSKUSerializer
- Data structure validation
- Multiple SKU serialization

#### TimeSeriesPointSerializer
- Time series data point serialization
- List serialization

#### DashboardAnalyticsSerializer
- Complete dashboard data serialization
- Empty trend data handling
- Nested data validation

## Running the Tests

### Run all analytics tests:
```bash
cd services
pytest main_services/analytics/tests/ -v
```

### Run specific test file:
```bash
pytest main_services/analytics/tests/test_models.py -v
pytest main_services/analytics/tests/test_tasks.py -v
pytest main_services/analytics/tests/test_views.py -v
pytest main_services/analytics/tests/test_serializers.py -v
```

### Run specific test class:
```bash
pytest main_services/analytics/tests/test_models.py::TestAnalyticsDailySales -v
```

### Run specific test:
```bash
pytest main_services/analytics/tests/test_models.py::TestAnalyticsDailySales::test_create_daily_sales -v
```

### Run with coverage:
```bash
pytest main_services/analytics/tests/ --cov=main_services.analytics --cov-report=html
```

### Run with parallel execution:
```bash
pytest main_services/analytics/tests/ -n auto
```

## Test Coverage

The test suite provides comprehensive coverage for:

- **Models**: CRUD operations, constraints, class methods, transactions
- **Tasks**: Business logic, data aggregation, edge cases, multi-tenancy
- **Views**: API endpoints, authentication, authorization, filtering, exports
- **Serializers**: Data serialization, validation, nested structures

## Key Testing Patterns

### Multi-Tenancy
All tests verify tenant isolation to ensure data segregation:
```python
def test_tenant_isolation(self, auth_client):
    tenant_1 = uuid.uuid4()
    tenant_2 = uuid.uuid4()
    # Create data for both tenants
    # Verify each tenant only sees their own data
```

### Date Range Filtering
Tests verify correct date-based filtering:
```python
def test_date_range_filtering(self, auth_client, tenant_id):
    # Create data for multiple dates
    # Query with specific date range
    # Verify only data in range is returned
```

### Authentication & Authorization
All view tests verify authentication requirements:
```python
def test_requires_authentication(self, client, tenant_id):
    response = client.get(url)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
```

### Idempotency
Task tests verify idempotent behavior:
```python
def test_idempotent_updates(self, tenant_id, test_skus):
    # Run task multiple times
    # Verify data is updated, not duplicated
    assert record_count == 1
```

## Dependencies

The test suite uses:
- `pytest`: Test framework
- `pytest-django`: Django integration
- `rest_framework.test.APIClient`: API testing
- Django's database transaction support for test isolation

## Notes

- All tests use `@pytest.mark.django_db` for database access
- Tests are isolated and can run in any order
- Fixtures handle setup and teardown automatically
- Tests follow AAA pattern (Arrange, Act, Assert)
- Mock objects are used where appropriate to isolate units

## Continuous Integration

These tests should be run:
- On every pull request
- Before merging to main branch
- In CI/CD pipeline
- Before deployment to staging/production

## Troubleshooting

### Database Errors
Ensure your test database is properly configured in settings.

### Import Errors
Verify all dependencies are installed:
```bash
pip install -r requirements.txt
```

### Fixture Errors
Check that related models (Order, SKU, Product, Category) exist and migrations are run.

### Celery Task Errors
Tasks are tested synchronously (CELERY_TASK_ALWAYS_EAGER=True in test settings).
