from rest_framework.routers import DefaultRouter
from .views import RiderViewSet, DispatchOrderViewSet

router = DefaultRouter()
router.register(r"riders", RiderViewSet, basename="rider")
router.register(r"dispatch", DispatchOrderViewSet, basename="dispatch")

urlpatterns = router.urls