from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.http import HttpResponse

from .models import Supplier, PurchaseOrder
from .serializers import SupplierSerializer, PurchaseOrderSerializer


class SupplierViewSet(viewsets.ModelViewSet):
    serializer_class = SupplierSerializer
    lookup_field = "supplier_id"

    def get_queryset(self):
        tenant_id = self.request.headers.get("X-Tenant-ID")
        if not tenant_id:
            raise PermissionDenied("Missing tenant ID")
        return Supplier.objects.filter(tenant_id=tenant_id)

    def perform_create(self, serializer):
        tenant_id = self.request.headers.get("X-Tenant-ID")
        if not tenant_id:
            raise PermissionDenied("Missing tenant ID")
        serializer.save(tenant_id=tenant_id)


class PurchaseOrderViewSet(viewsets.ModelViewSet):
    serializer_class = PurchaseOrderSerializer
    lookup_field = "po_id"

    def get_queryset(self):
        tenant_id = self.request.headers.get("X-Tenant-ID")
        if not tenant_id:
            raise PermissionDenied("Missing tenant ID")
        return (
            PurchaseOrder.objects.filter(tenant_id=tenant_id)
            .select_related("supplier")
            .prefetch_related("items")
        )

    def perform_create(self, serializer):
        tenant_id = self.request.headers.get("X-Tenant-ID")
        if not tenant_id:
            raise PermissionDenied("Missing tenant ID")
        serializer.save(tenant_id=tenant_id)

    @action(detail=True, methods=["get"], url_path="pdf")
    def export_pdf(self, request, po_id=None):
        """
        Export purchase order as PDF.
        Only dummy response for now, real implementation later
        """
        po = self.get_object()
        response = HttpResponse(content_type="application/pdf")
        response["Content-Disposition"] = f"attachment; filename='PO_{po.po_id}.pdf'"
        response.write(b"%PDF-1.4\n% Dummy PDF content for PO export\n")
        return response
