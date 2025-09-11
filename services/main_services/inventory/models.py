import uuid
from django.db import models, transaction
from django.utils import timezone
from django.conf import settings


def generate_uuid():
    return uuid.uuid4()


class SKU(models.Model):
    sku_id = models.UUIDField(primary_key=True, default=generate_uuid, editable=False)
    tenant_id = models.UUIDField(db_index=True)

    name = models.CharField(max_length=255)
    sku_code = models.CharField(max_length=64, blank=True, null=True, db_index=True)
    category = models.CharField(max_length=128, db_index=True)
    attributes = models.JSONField(default=dict, blank=True)
    barcode = models.CharField(max_length=128, blank=True, null=True, db_index=True)
    price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    stock_level = models.IntegerField(default=0)
    supplier_id = models.UUIDField(blank=True, null=True)
    track_batches = models.BooleanField(default=False)
    reorder_threshold = models.IntegerField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["tenant_id", "category"]),
            models.Index(fields=["tenant_id", "stock_level"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.sku_code or self.sku_id})"

    def adjust_stock(
        self,
        delta: int,
        *,
        reason: str,
        user=None,
        batch=None,
        reference=None,
        note=None,
    ):
        """
        Adjust SKU stock atomically and log adjustment
        """
        with transaction.atomic():
            if batch:
                if not self.track_batches:
                    raise ValueError("SKU not configured for batch tracking")
                batch.remaining_quantity = models.F("remaining_quantity") + delta
                batch.save(update_fields=["remaining_quantity"])

            self.stock_level = models.F("stock_level") + delta
            self.save(update_fields=["stock_level"])
            self.refresh_from_db(fields=["stock_level"])

            adj = StockAdjustment.objects.create(
                adjustment_id=uuid.uuid4(),
                tenant_id=self.tenant_id,
                sku=self,
                quantity=delta,
                reason=reason,
                batch=batch,
                reference=reference,
                note=note,
                created_by=user,
            )
            if (
                self.reorder_threshold is not None
                and self.stock_level <= self.reorder_threshold
            ):
                Alert.objects.get_or_create(
                    tenant_id=self.tenant_id,
                    sku=self,
                    type=Alert.Type.LOW_STOCK,
                    defaults={
                        "sku_name": self.name,
                        "current_stock": self.stock_level,
                        "threshold": self.reorder_threshold,
                    },
                )
            return self, adj


class Batch(models.Model):
    batch_id = models.UUIDField(primary_key=True, default=generate_uuid, editable=False)
    tenant_id = models.UUIDField(db_index=True)

    sku = models.ForeignKey(SKU, on_delete=models.CASCADE, related_name="batches")
    batch_number = models.CharField(max_length=255)
    quantity = models.IntegerField()
    remaining_quantity = models.IntegerField()
    received_at = models.DateField(blank=True, null=True)
    expiry_date = models.DateField(blank=True, null=True)
    cost_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["tenant_id", "expiry_date"]),
            models.Index(fields=["tenant_id", "sku", "batch_number"]),
        ]

    def save(self, *args, **kwargs):
        if self.pk is None:
            self.remaining_quantity = self.quantity
        super().save(*args, **kwargs)


class StockAdjustment(models.Model):
    class Reason(models.TextChoices):
        PURCHASE = "purchase", "Purchase"
        SALE = "sale", "Sale"
        RETURN = "return", "Return"
        CORRECTION = "correction", "Correction"
        TRANSFER = "transfer", "Transfer"

    adjustment_id = models.UUIDField(
        primary_key=True, default=generate_uuid, editable=False
    )
    tenant_id = models.UUIDField(db_index=True)

    sku = models.ForeignKey(SKU, on_delete=models.CASCADE, related_name="adjustments")
    quantity = models.IntegerField()
    reason = models.CharField(max_length=32, choices=Reason.choices)
    batch = models.ForeignKey(Batch, on_delete=models.SET_NULL, blank=True, null=True)
    reference = models.CharField(max_length=255, blank=True, null=True)
    note = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )

    class Meta:
        indexes = [models.Index(fields=["tenant_id", "sku", "created_at"])]


class Alert(models.Model):
    class Type(models.TextChoices):
        LOW_STOCK = "low_stock", "Low stock"
        BATCH_EXPIRY = "batch_expiry", "Batch expiry"

    alert_id = models.UUIDField(primary_key=True, default=generate_uuid, editable=False)
    tenant_id = models.UUIDField(db_index=True)

    sku = models.ForeignKey(SKU, on_delete=models.CASCADE)
    sku_name = models.CharField(max_length=255)
    current_stock = models.IntegerField()
    threshold = models.IntegerField(blank=True, null=True)
    type = models.CharField(max_length=32, choices=Type.choices, db_index=True)

    created_at = models.DateTimeField(auto_now_add=True)
    acknowledged = models.BooleanField(default=False)
    acknowledged_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    acknowledged_at = models.DateTimeField(null=True, blank=True)

    def acknowledge(self, user):
        self.acknowledged = True
        self.acknowledged_by = user
        self.acknowledged_at = timezone.now()
        self.save(update_fields=["acknowledged", "acknowledged_by", "acknowledged_at"])
