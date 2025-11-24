from decimal import Decimal
from django.db import transaction
from rest_framework import serializers
from .models import Order, OrderItem, Return, PaystackTransaction
from main_services.inventory.models import SKU
from main_services.catalog.models import Product


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

        # Use atomic transaction to ensure all or nothing
        with transaction.atomic():
            # Create order WITHOUT saving yet
            order = Order(**validated_data)

            total = Decimal("0.00")

            # Calculate total and validate SKUs exist with sufficient stock
            for item in items_data:
                try:
                    sku = SKU.objects.select_for_update().get(
                        sku_id=item["sku_id"],
                        tenant_id=validated_data["tenant_id"]
                    )
                except SKU.DoesNotExist:
                    raise serializers.ValidationError(
                        f"SKU {item['sku_id']} not found for this tenant"
                    )

                # Check stock availability
                if sku.stock_level < item["quantity"]:
                    raise serializers.ValidationError(
                        f"Insufficient stock for {sku.name}. Available: {sku.stock_level}, Requested: {item['quantity']}"
                    )

                # Get price from the Product catalog (not from SKU)
                try:
                    product = Product.objects.get(
                        inventory_sku=sku,
                        tenant_id=validated_data["tenant_id"]
                    )
                    price = product.price
                except Product.DoesNotExist:
                    raise serializers.ValidationError(
                        f"Product not found for SKU {sku.name}"
                    )

                # Calculate item total: quantity * price
                item_total = Decimal(str(item["quantity"])) * price
                total += item_total

            order.total_amount = total
            order.save()  # Save order with calculated total

            # Create order items and reduce stock
            for item in items_data:
                # Create order item
                OrderItem.objects.create(order=order, **item)

                # Reduce stock using the SKU's adjust_stock method
                sku = SKU.objects.get(
                    sku_id=item["sku_id"],
                    tenant_id=validated_data["tenant_id"]
                )
                sku.adjust_stock(
                    delta=-item["quantity"],  # Negative for reduction
                    reason="sale",
                    reference=str(order.order_id),
                    note=f"Order created for {order.customer_name}"
                )

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
            "provider",
            "status",
            "paid_at",
            "created_at",
        ]
