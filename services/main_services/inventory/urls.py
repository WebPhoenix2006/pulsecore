from rest_framework_nested import routers
from .views import SKUViewSet, BatchViewSet, StockAdjustmentViewSet, AlertViewSet

router = routers.DefaultRouter()
router.register(r"skus", SKUViewSet, basename="sku")
router.register(r"batches", BatchViewSet, basename="batch")
router.register(
    r"stock-adjustments", StockAdjustmentViewSet, basename="stockadjustment"
)
router.register(r"alerts", AlertViewSet, basename="alert")

# nested router for batches under a SKU
sku_router = routers.NestedDefaultRouter(router, r"skus", lookup="sku")
sku_router.register(r"batches", BatchViewSet, basename="sku-batches")

urlpatterns = router.urls + sku_router.urls
