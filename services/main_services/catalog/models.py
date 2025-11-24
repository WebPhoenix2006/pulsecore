from django.db import models
import uuid


class Category(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant_id = models.UUIDField()  # required for row-level tenancy
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("tenant_id", "name")
        ordering = ["name"]

    def __str__(self):
        return self.name


class Product(models.Model):
    sku_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant_id = models.UUIDField()

    # Link to inventory SKU - select which SKU this product's inventory is tracked with
    inventory_sku = models.OneToOneField(
        'inventory.SKU',
        on_delete=models.SET_NULL,
        related_name='catalog_product',
        null=True,
        blank=True,
        help_text='Select the inventory SKU that tracks stock for this product'
    )

    name = models.CharField(max_length=255)
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, related_name="pruducts"
    )
    attributes = models.JSONField(default=dict, blank=True)
    barcode = models.CharField(max_length=255, blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    supplier_id = models.UUIDField(blank=True, null=True)
    batch_number = models.CharField(max_length=255, blank=True, null=True)
    expiry_date = models.DateField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name
