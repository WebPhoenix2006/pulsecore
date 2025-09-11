from rest_framework import serializers
from .models import SKU, Batch, StockAdjustment, Alert


class SKUSerializer(serializers.ModelSerializer):
    class Meta:
        model = SKU
        fields = (
            "sku_id",
            "name",
            "sku_code",
            "category",
            "attributes",
            "barcode",
            "price",
            "stock_level",
            "supplier_id",
            "track_batches",
            "reorder_threshold",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("sku_id", "stock_level", "created_at", "updated_at")


class BatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Batch
        fields = (
            "batch_id",
            "sku",
            "batch_number",
            "quantity",
            "remaining_quantity",
            "received_at",
            "expiry_date",
            "cost_price",
            "created_at",
        )
        read_only_fields = ("batch_id", "remaining_quantity", "created_at")


class StockAdjustmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockAdjustment
        fields = (
            "adjustment_id",
            "sku",
            "quantity",
            "reason",
            "batch",
            "reference",
            "note",
            "created_at",
            "created_by",
        )
        read_only_fields = ("adjustment_id", "created_at", "created_by")


class StockAdjustmentCreateSerializer(serializers.Serializer):
    """
    Used for POST stock adjusments endpoint.
    Validates request body before SKU.adjust_stock().
    """

    quantity = serializers.IntegerField()
    reason = serializers.ChoiceField(
        choices=[c[0] for c in StockAdjustment.Reason.choices]
    )
    batch_id = serializers.UUIDField(required=False, allow_null=True)
    reference = serializers.CharField(required=False, allow_blank=True)
    note = serializers.CharField(required=False, allow_blank=True)


class AlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alert
        fields = (
            "aler_id",
            "sku",
            "sku_name",
            "current_stock",
            "threshold",
            "type",
            "created_at",
            "acknowledged",
            "acknowledged_by",
            "acknowledged_at",
        )
        read_only_fields = ("alert_id", "sku_name", "created_at")
