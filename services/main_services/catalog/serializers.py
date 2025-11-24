from rest_framework import serializers
from .models import Category, Product


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at", "tenant_id")


class ProductSerializer(serializers.ModelSerializer):
    stock_quantity = serializers.SerializerMethodField()
    sku_code = serializers.CharField(source='inventory_sku.sku_code', read_only=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Set the queryset for inventory_sku based on tenant context
        from main_services.inventory.models import SKU
        request = self.context.get('request')
        if request and hasattr(request, 'headers'):
            tenant_id = request.headers.get('X-Tenant-ID')
            if tenant_id:
                self.fields['inventory_sku'].queryset = SKU.objects.filter(tenant_id=tenant_id)
            else:
                self.fields['inventory_sku'].queryset = SKU.objects.none()
        else:
            # During initialization (e.g., URL checks), use empty queryset
            self.fields['inventory_sku'].queryset = SKU.objects.none()

    class Meta:
        model = Product
        fields = "__all__"
        read_only_fields = ("sku_id", "created_at", "updated_at", "tenant_id", "sku_code")
        extra_kwargs = {
            'inventory_sku': {
                'required': False,
                'allow_null': True
            }
        }

    def get_stock_quantity(self, obj):
        """Get stock level from related inventory SKU if it exists"""
        if obj.inventory_sku:
            return obj.inventory_sku.stock_level
        return 0
