import uuid
from decimal import Decimal
from django.db import models, transaction
from django.utils import timezone
from django.conf import settings


def generate_uuid():
    return uuid.uuid4()


class AnalyticsDailySales(models.Model):
    """
    Daily sales rollup per tenant.
    Use update_or_create_for_date() from aggregator tasks to safely write
    """

    sales_rollup_id = models.UUIDField(
        primary_key=True, default=generate_uuid, editable=False
    )
    tenant_id = models.UUIDField(db_index=True)

    date = models.DateField(db_index=True)
    total_orders = models.PositiveIntegerField(default=0)
    total_items = models.PositiveIntegerField(default=0)
    total_revenue = models.DecimalField(
        max_digits=14, decimal_places=2, default=Decimal("0.00")
    )

    top_skus = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "analytics_daily_sales"
        unique_together = ("tenant_id", "date")
        indexes = [
            models.Index(fields=["tenant_id", "date"]),
            models.Index(fields=["tenant_id", "total_revenue"]),
        ]

    def __str__(self):
        return f"SalesRollup {self.tenant_id} @ {self.date}"

    @classmethod
    def update_or_create_for_date(
        cls,
        tenant_id,
        date,
        *,
        total_orders=0,
        total_items=0,
        total_revenue=Decimal("0.00"),
        top_skus=None,
    ):
        """
        Idempotent upsert used by aggregator tasks.
        Use transaction.atomic to avoid race conditions for concurrent writters.
        """
        if top_skus is None:
            top_skus = []
        with transaction.atomic():
            obj, created = cls.objects.select_for_update().get_or_create(
                tenant_id=tenant_id,
                date=date,
                defaults={
                    "total_orders": total_orders,
                    "total_items": total_items,
                    "total_revenue": total_revenue,
                    "top_skus": top_skus,
                },
            )
            if not created:
                # Using explicit assignment to keep clarity; small contention expected since we lock the row.
                obj.total_orders = total_orders
                obj.total_items = total_items
                obj.total_revenue = total_revenue
                obj.top_skus = top_skus
                obj.save(
                    update_fields=[
                        "total_orders",
                        "total_items",
                        "total_revenue",
                        "top_skus",
                        "updated_at",
                    ]
                )
            return obj


class AnalyticsDailyStock(models.Model):
    """
    Daily stock summary per tenant for trend charts and top-level KPIs.
    """

    stock_rollup_id = models.UUIDField(
        primary_key=True, default=generate_uuid, editable=False
    )
    tenant_id = models.UUIDField(db_index=True)

    date = models.DateField(db_index=True)
    total_stock = models.IntegerField(default=0)
    low_stock_count = models.PositiveIntegerField(default=0)
    stockout_count = models.PositiveBigIntegerField(default=0)

    # Optionally hold small summaries of adjustments for UI hints.
    adjustments_summary = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "analytics_daily_stock"
        unique_together = ("tenant_id", "date")
        indexes = [
            models.Index(fields=["tenant_id", "date"]),
        ]

    def __str__(self):
        return f"StockRollup {self.tenant_id} @ {self.date}"

    @classmethod
    def update_or_create_for_date(
        cls,
        tenant_id,
        date,
        *,
        total_stock=0,
        low_stock_count=0,
        stockout_count=0,
        adjustments_summary=None,
    ):
        if adjustments_summary is None:
            adjustments_summary = []
        with transaction.atomic():
            obj, created = cls.objects.select_for_update().get_or_create(
                tenant_id=tenant_id,
                date=date,
                defaults={
                    "total_stock": total_stock,
                    "low_stock_count": low_stock_count,
                    "stockout_count": stockout_count,
                    "adjustments_summary": adjustments_summary,
                },
            )
            if not created:
                obj.total_stock = total_stock
                obj.low_stock_count = low_stock_count
                obj.stockout_count = stockout_count
                obj.adjustments_summary = adjustments_summary
                obj.save(
                    update_fields=[
                        "total_stock",
                        "low_stock_count",
                        "stockout_count",
                        "adjustments_summary",
                        "updated_at",
                    ]
                )
            return obj


class AnalyticsDailyTopSKU(models.Model):
    """
    Per-tenant, per-day per-SKU metrics. Supports incremental updates from aggregator
    """

    topsku_id = models.UUIDField(
        primary_key=True, default=generate_uuid, editable=False
    )
    tenant_id = models.UUIDField(db_index=True)

    date = models.DateField(db_index=True)
    sku_id = models.UUIDField(db_index=True, null=True, blank=True)
    sku_name = models.CharField(max_length=255, blank=True)

    sold_quantity = models.PositiveIntegerField(default=0)
    revenue = models.DecimalField(
        max_digits=14, decimal_places=2, default=Decimal("0.00")
    )

    # For aggregated top SKU data (used by generate_top_skus task)
    sku_data = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "analytics_daily_topsku"
        # Note: unique_together with nullable fields handled by application logic
        indexes = [
            models.Index(fields=["tenant_id", "date"]),
            models.Index(fields=["tenant_id", "sku_id"]),
            models.Index(fields=["tenant_id", "date", "sold_quantity"]),
        ]

    def __str__(self):
        return f"TokSKU {self.sku_name} ({self.sku_id}) @ {self.date}"

    @classmethod
    def increment(
        cls, tenant_id, date, sku_id, sku_name, quantity=0, revenue=Decimal("0.00")
    ):
        """
        Atomically increment per sku metrics for a date. Useful when streaming order items into rollups.
        Returns the refreshed object.
        """
        revenue = Decimal(revenue)
        quantity = int(quantity or 0)

        with transaction.atomic():
            obj, created = cls.objects.select_for_update().get_or_create(
                tenant_id=tenant_id,
                date=date,
                sku_id=sku_id,
                defaults={
                    "sku_name": sku_name,
                    "sold_quantity": quantity,
                    "revenue": revenue,
                },
            )
            if not created:
                # Atomic increment using F expressions to avoid lost updates in concurrent increments.
                obj.sold_quantity = models.F("sold_quantity") + quantity
                obj.revenue = models.F("revenue") + revenue
                obj.save(update_fields=["sold_quantity", "revenue", "updated_at"])
                # refresh concrete values
                obj.refresh_from_db(fields=["sold_quantity", "revenue"])
            return obj


class StockoutIncident(models.Model):
    """
    Log of stockout incidents for listing and export.
    Keep order_id as UUID (no FK) to avoid tight coupling.
    """

    stockout_id = models.UUIDField(
        primary_key=True, default=generate_uuid, editable=False
    )
    tenant_id = models.UUIDField(db_index=True)

    sku_id = models.UUIDField(db_index=True)
    sku_name = models.CharField(max_length=255)
    incident_date = models.DateField(db_index=True)
    note = models.TextField(blank=True, null=True)

    # Optional linkback to order (UUID only)
    order_id = models.UUIDField(blank=True, null=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "analytics_stockout_incident"
        indexes = [
            models.Index(fields=["tenant_id", "incident_date"]),
            models.Index(fields=["tenant_id", "sku_id"]),
        ]

    def __str__(self):
        return f"Stockout {self.sku_name} on {self.incident_date}"

    @classmethod
    def record(
        cls,
        tenant_id,
        sku_id,
        sku_name,
        incident_date=None,
        *,
        note=None,
        order_id=None,
        created_by=None,
    ):
        """
        Create a stockout incident record. incident_date defaults to today.
        """
        if incident_date is None:
            incident_date = timezone.localdate()
        return cls.objects.create(
            tenant_id=tenant_id,
            sku_id=sku_id,
            sku_name=sku_name,
            incident_date=incident_date,
            note=note,
            order_id=order_id,
            created_by=created_by,
        )
