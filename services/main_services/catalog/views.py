from rest_framework import viewsets, permissions
from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer


class TenantScopedMixin:
    """Filter queryset by tenant_id from header and auto-set tenant_id on create."""

    def get_queryset(self):
        qs = super().get_queryset()
        tenant_id = self.request.headers.get("X-Tenant-ID")
        if tenant_id:
            qs = qs.filter(tenant_id=tenant_id)
        return qs

    def perform_create(self, serializer):
        tenant_id = self.request.headers.get("X-Tenant-ID")
        if tenant_id:
            serializer.save(tenant_id=tenant_id)
        else:
            raise ValueError("X-Tenant-ID header required")


class CategoryViewSet(TenantScopedMixin, viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]


class ProductViewSet(TenantScopedMixin, viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]
