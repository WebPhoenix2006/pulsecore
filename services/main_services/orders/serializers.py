from rest_framework import serializers
from .models import Order, OrderItem, Return, PaystackTransaction


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ["item_id", "sku_id", "quantity"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = [
            "order_id",
            "customer_name",
            "items",
            "total_amount",
            "status",
            "payment_status",
            "tenant_id",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["total_amount", "tenant_id"]

    def create(self, validated_data):
        items_data = validated_data.pop("items")
        # create order WITHOUT saving yet
        order = Order(**validated_data)

        total = 0
        for item in items_data:
            total += item["quantity"] * 500  # replace with SKU price lookup

        order.total_amount = total
        order.save()  # ✅ now save with total included

        for item in items_data:
            OrderItem.objects.create(order=order, **item)

        return order


class OrderUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ["status", "payment_status"]  # ✅ no extra invalid fields


class ReturnSerializer(serializers.ModelSerializer):
    class Meta:
        model = Return
        fields = ["return_id", "order", "reason", "created_at"]
        read_only_fields = ["id", "order", "created_at"]


class PaystackTransactionSerializer(serializers.ModelSerializer):
    order = serializers.CharField(source="order.order_id", read_only=True)

    class Meta:
        model = PaystackTransaction
        fields = [
            "transaction_id",
            "order",
            "reference",
            "amount",
            "currency",
            "authorization_url",
            "status",
            "paid_at",
            "created_at",
        ]
