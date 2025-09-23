import uuid
from django.db import models
from django.utils import timezone


class Supplier(models.Model):
    supplier_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant_id = models.UUIDField(db_index=True)
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(default=timezone.now)
    # why use timezone.now instead of the normal auto_now_add=True
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "suppliers"
        indexes = [models.Index(fields=["tenant_id"])]
        unique_together = ("tenant_id", "name")

    def __str__(self):
        return f"{self.name} ({self.supplier_id})"


class PurchaseOrder(models.Model):
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("pending", "Pending"),
        ("placed", "Placed"),
        ("received", "Received"),
        ("cancelled", "Cancelled"),
    ]

    po_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant_id = models.UUIDField(db_index=True)
    supplier = models.ForeignKey(
        Supplier, on_delete=models.CASCADE, related_name="purchase_order"
    )
    reference = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    expected_delivery_date = models.DateField(blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "purchase_orders"
        indexes = [models.Index(fields=["tenant_id", "status"])]

    def __str__(self):
        return f"PO {self.po_id} - {self.supplier.name}"

    @property
    def total_cost(self):
        return sum(item.quantity * item.unit_cost for item in self.items.all())


class PurchaseOrderItem(models.Model):
    item_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    purchase_order = models.ForeignKey(
        PurchaseOrder, on_delete=models.CASCADE, related_name="items"
    )
    sku_id = models.UUIDField()
    name = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField()
    unit_cost = models.DecimalField(max_digits=20, decimal_places=2)

    class Meta:
        db_table = "purchase_order_items"

    def __str__(self):
        return f"{self.name} x {self.quantity} @ {self.unit_cost}"
