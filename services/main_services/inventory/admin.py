from django.contrib import admin
from .models import SKU, Batch, StockAdjustment, Alert


@admin.register(SKU)
class SKUAdmin(admin.ModelAdmin):
    list_display = ["sku_code", "name", "stock_level", "reorder_threshold", "tenant_id"]
    list_filter = ["tenant_id", "category", "track_batches"]
    search_fields = ["name", "sku_code", "barcode", "product__name"]
    readonly_fields = ["sku_id", "sku_code", "created_at", "updated_at"]

    fieldsets = (
        (
            "Product Link",
            {
                "fields": ("product",),
                "description": "Select the catalog product this SKU tracks inventory for",
            },
        ),
        (
            "Basic Information",
            {
                "fields": (
                    "sku_id",
                    "sku_code",
                    "name",
                    "tenant_id",
                    "category",
                    "barcode",
                )
            },
        ),
        (
            "Inventory",
            {"fields": ("stock_level", "reorder_threshold", "track_batches")},
        ),
        (
            "Supplier",
            {
                "fields": ("supplier_id",),
            },
        ),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )


@admin.register(Batch)
class BatchAdmin(admin.ModelAdmin):
    list_display = [
        "batch_number",
        "sku",
        "quantity",
        "remaining_quantity",
        "expiry_date",
        "tenant_id",
    ]
    list_filter = ["tenant_id", "received_at", "expiry_date"]
    search_fields = ["batch_number", "sku__name"]
    readonly_fields = ["batch_id", "created_at"]


@admin.register(StockAdjustment)
class StockAdjustmentAdmin(admin.ModelAdmin):
    list_display = [
        "adjustment_id",
        "sku",
        "quantity",
        "reason",
        "created_at",
        "created_by",
    ]
    list_filter = ["tenant_id", "reason", "created_at"]
    search_fields = ["sku__name", "reference", "note"]
    readonly_fields = ["adjustment_id", "created_at"]


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = [
        "sku_name",
        "type",
        "current_stock",
        "threshold",
        "acknowledged",
        "created_at",
    ]
    list_filter = ["tenant_id", "type", "acknowledged"]
    search_fields = ["sku_name", "sku__name"]
    readonly_fields = ["alert_id", "created_at"]
    actions = ["mark_acknowledged"]

    def mark_acknowledged(self, request, queryset):
        for alert in queryset:
            alert.acknowledge(request.user)

    mark_acknowledged.short_description = "Mark selected alerts as acknowledged"
