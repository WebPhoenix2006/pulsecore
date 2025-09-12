from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from .models import SKU, Batch, StockAdjustment, Alert
from .serialiizers import (
    SKUSerializer,
    BatchSerializer,
    StockAdjustmentSerializer,
    StockAdjustmentCreateSerializer,
    AlertSerializer,
)
from main_services.catalog.views import TenantScopedMixin


# -----------------------
# SKU ViewSet
# -----------------------
class SKUViewSet(TenantScopedMixin, viewsets.ModelViewSet):
    serializer_class = SKUSerializer
    queryset = SKU.objects.all()
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["category", "stock_level", "supplier_id"]

    @action(detail=True, methods=["post"])
    def adjust_stock(self, request, pk=None):
        sku = self.get_object()
        serializer = StockAdjustmentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        batch = None
        batch_id = serializer.validated_data.get("batch_id")
        if batch_id:
            batch = get_object_or_404(sku.batches, pk=batch_id)

        adjusted_sku, adjustment = sku.adjust_stock(
            delta=serializer.validated_data["quantity"],
            reason=serializer.validated_data["reason"],
            batch=batch,
            reference=serializer.validated_data.get("reference"),
            note=serializer.validated_data.get("note"),
            user=request.user,
        )
        return Response(
            StockAdjustmentSerializer(adjustment).data, status=status.HTTP_201_CREATED
        )


# -----------------------
# Batch ViewSet
# -----------------------
class BatchViewSet(TenantScopedMixin, viewsets.ModelViewSet):
    serializer_class = BatchSerializer
    queryset = Batch.objects.all()
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["sku", "expiry_date"]

    def get_queryset(self):
        qs = super().get_queryset()
        sku_id = self.kwargs.get("sku_pk")   # comes from nested router
        if sku_id:
            qs = qs.filter(sku_id=sku_id)
        return qs

# -----------------------
# StockAdjustment ViewSet
# -----------------------
class StockAdjustmentViewSet(TenantScopedMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = StockAdjustmentSerializer
    queryset = StockAdjustment.objects.all()
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["sku", "created_at"]


# -----------------------
# Alert ViewSet
# -----------------------
class AlertViewSet(TenantScopedMixin, viewsets.ModelViewSet):
    serializer_class = AlertSerializer
    queryset = Alert.objects.all()
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["sku", "type", "acknowledged"]

    @action(detail=True, methods=["post"])
    def acknowledge(self, request, pk=None):
        alert = self.get_object()
        alert.acknowledge(request.user)
        return Response(self.get_serializer(alert).data)
