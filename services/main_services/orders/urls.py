from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrderViewSet, PaystackInitializeView, PaystackVerifyView

router = DefaultRouter()
router.register(r"", OrderViewSet, basename="order")

urlpatterns = [
    path("", include(router.urls)),
    path(
        "payments/paystack/initialize/",
        PaystackInitializeView.as_view(),
        name="paystack-init",
    ),
    path(
        "payments/paystack/verify/<str:reference>/",
        PaystackVerifyView.as_view(),
        name="paystack-verify",
    ),
]
