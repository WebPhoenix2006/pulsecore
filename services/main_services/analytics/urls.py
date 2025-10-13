from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import (
    DashboardAPIView,
    AnalyticsExportView,
    SalesAnalyticsViewSet,
    StockAnalyticsViewSet,
    StockoutIncidentViewSet,
)

router = DefaultRouter()
router.register(r"sales", SalesAnalyticsViewSet, basename="analytics-sales")
router.register(r"stock", StockAnalyticsViewSet, basename="analytics-stock")
router.register(r"stockouts", StockoutIncidentViewSet, basename="analytics-stockouts")

urlpatterns = [
    path("dashboard/", DashboardAPIView.as_view(), name="analytics-dashboard"),
    path("export/", AnalyticsExportView.as_view(), name="analytics-export"),
    path("", include(router.urls)),
]
