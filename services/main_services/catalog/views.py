from rest_framework import viewsets, permissions
from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer


class TenantScopedMixin:
    """Ensures queries are tenant-scoped via X-Tenant-ID header."""

    def get_queryset(self):
        tenant_id = self.request.headers.get("X-Tenant-ID")
        return super().get_queryset().filter(tenant_id=tenant_id)

    def perform_create(self, serializer):
        tenant_id = self.request.headers.get("X-Tenant-ID")
        serializer.save(tenant_id=tenant_id)


class CategoryViewSet(TenantScopedMixin, viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]


class ProductViewSet(TenantScopedMixin, viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]
