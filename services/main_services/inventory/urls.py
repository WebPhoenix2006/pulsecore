# urls.py
from rest_framework.routers import DefaultRouter
from .views import SKUViewSet, BatchViewSet, StockAdjustmentViewSet, AlertViewSet

router = DefaultRouter()
router.register(r"skus", SKUViewSet, basename="sku")
router.register(r"batches", BatchViewSet, basename="batch")
router.register(
    r"stock-adjustments", StockAdjustmentViewSet, basename="stockadjustment"
)
router.register(r"alerts", AlertViewSet, basename="alert")

urlpatterns = router.urls
