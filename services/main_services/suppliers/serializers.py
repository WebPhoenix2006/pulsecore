from rest_framework import serializers
from .models import Supplier, PurchaseOrder, PurchaseOrderItem


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = [
            "supplier_id",
            "tenant_id",
            "name",
            "email",
            "phone",
            "address",
            "metadata",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["supplier_id", "tenant_id", "created_at", "updated_at"]


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseOrderItem
        fields = ["item_id", "sku_id", "name", "quantity", "unit_cost"]
        read_only_fields = ["item_id"]


class PurchaseOrderSerializer(serializers.ModelSerializer):
    items = PurchaseOrderItemSerializer(many=True)
    total_cost = serializers.SerializerMethodField()

    class Meta:
        model = PurchaseOrder
        fields = [
            "po_id",
            "tenant_id",
            "supplier",
            "reference",
            "status",
            "expected_delivery_date",
            "metadata",
            "items",
            "total_cost",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "po_id",
            "tenant_id",
            "total_cost",
            "created_at",
            "updated_at",
        ]

    def get_total_cost(self, obj):
        return obj.total_cost

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        purchase_order = PurchaseOrder.objects.create(**validated_data)
        for item in items_data:
            PurchaseOrderItem.objects.create(purchase_order=purchase_order, **item)
        return purchase_order

    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if items_data is not None:
            # clear existing and replace
            instance.items.all().delete()
            for item in items_data:
                PurchaseOrderItem.objects.create(purchase_order=instance, **item)
        return instance
