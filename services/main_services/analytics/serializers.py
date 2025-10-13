import uuid
from decimal import Decimal
from rest_framework import serializers
from django.utils import timezone

from .models import (
    AnalyticsDailySales,
    AnalyticsDailyStock,
    AnalyticsDailyTopSKU,
    StockoutIncident,
)


class TopSKUSerializer(serializers.Serializer):
    sku_id = serializers.UUIDField()
    revenue = serializers.DecimalField(max_digits=14, decimal_places=2)


class AnalyticsDailySalesSerializer(serializers.ModelSerializer):
    """
    Serializer for daily sales rollups (used in dashboard & sales endpoints)
    """

    top_skus = TopSKUSerializer(many=True, read_only=True)

    class Meta:
        model = AnalyticsDailySales
        fields = [
            "sales_rollup_id",
            "tenant_id",
            "date",
            "total_orders",
            "total_items",
            "total_revenue",
            "top_skus",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class AnalyticsDailyStockSerializer(serializers.ModelSerializer):
    """
    Serializer for daily stock rollups (for stock trend endpoints)
    """

    class Meta:
        model = AnalyticsDailyStock
        fields = [
            "stock_rollup_id",
            "tenant_id",
            "date",
            "total_stock",
            "low_stock_count",
            "stockout_count",
            "adjustments_summary",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class AnalyticsDailyTopSKUSerializer(serializers.ModelSerializer):
    """
    Serializer for per-SKU analytics (sales by SKU, top SKUs)
    """

    class Meta:
        model = AnalyticsDailyTopSKU
        fields = [
            "topsku_id",
            "tenant_id",
            "date",
            "sku_id",
            "sku_name",
            "sold_quantity",
            "revenue",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class StockoutIncidentSerializer(serializers.ModelSerializer):
    """
    Serializer for stockout incidents
    """

    class Meta:
        model = StockoutIncident
        fields = [
            "stockout_id",
            "tenant_id",
            "sku_id",
            "sku_name",
            "incident_date",
            "note",
            "order_id",
            "created_by",
            "created_at",
        ]
        read_only_fields = fields


# --------------------------------------------------------------------
# COMPOSITE SERIALIZERS — for dashboard and aggregated responses
# --------------------------------------------------------------------


class TimeSeriesPointSerializer(serializers.Serializer):
    date = serializers.DateField()
    value = serializers.DecimalField(max_digits=14, decimal_places=2)


class DashboardAnalyticsSerializer(serializers.Serializer):
    """
    Composite serializer for dashboard KPIs and mini datasets.
    Does not map directly to a model.
    """

    stock_total = serializers.IntegerField()
    low_stock_count = serializers.IntegerField()
    stockout_count = serializers.IntegerField()
    sales_count = serializers.IntegerField()
    revenue_total = serializers.DecimalField(max_digits=14, decimal_places=2)
    top_skus = TopSKUSerializer(many=True)
    revenue_trend = TimeSeriesPointSerializer(many=True)
    stock_trend = TimeSeriesPointSerializer(many=True)
