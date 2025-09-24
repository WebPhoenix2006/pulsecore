from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db import models

from .models import Rider, DispatchOrder, RiderLocationHistory
from .serializers import (
    RiderSerializer,
    DispatchOrderSerializer,
    AssignRiderSerializer,
    RiderLocationUpdateSerializer,
    RiderLocationHistorySerializer,
)


class RiderViewSet(viewsets.ModelViewSet):
    serializer_class = RiderSerializer
    lookup_field = "rider_id"
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["status", "vehicle_type"]
    search_fields = ["first_name", "last_name", "email", "phone"]
    ordering_fields = ["created_at", "updated_at", "first_name", "last_name", "rating"]
    ordering = ["-created_at"]

    def get_queryset(self):
        tenant_id = self.request.headers.get("X-Tenant-ID")
        if not tenant_id:
            raise PermissionDenied("Missing tenant ID")
        return Rider.objects.filter(tenant_id=tenant_id)

    def perform_create(self, serializer):
        tenant_id = self.request.headers.get("X-Tenant-ID")
        if not tenant_id:
            raise PermissionDenied("Missing tenant ID")
        serializer.save(tenant_id=tenant_id)

    @action(detail=True, methods=["post"], url_path="location")
    def update_location(self, request, rider_id=None):
        """Update rider's current location"""
        rider = self.get_object()
        serializer = RiderLocationUpdateSerializer(data=request.data)

        if serializer.is_valid():
            latitude = serializer.validated_data["latitude"]
            longitude = serializer.validated_data["longitude"]

            rider.location = {
                "latitude": float(latitude),
                "longitude": float(longitude),
            }
            rider.save()

            RiderLocationHistory.objects.create(
                rider=rider,
                latitude=latitude,
                longitude=longitude,
            )

            return Response(
                {"message": "Location updated successfully", "location": rider.location}
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["get"], url_path="location-history")
    def location_history(self, request, rider_id=None):
        """Get rider's location history"""
        rider = self.get_object()

        days = request.query_params.get("days", 7)
        try:
            days = int(days)
        except (ValueError, TypeError):
            days = 7

        since = timezone.now() - timezone.timedelta(days=days)
        history = RiderLocationHistory.objects.filter(
            rider=rider, timestamp__gte=since
        ).order_by("-timestamp")

        serializer = RiderLocationHistorySerializer(history, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="dispatch-orders")
    def dispatch_orders(self, request, rider_id=None):
        """Get all dispatch orders for this rider"""
        rider = self.get_object()
        status_filter = request.query_params.get("status")
        orders = rider.dispatch_orders.all()
        if status_filter:
            orders = orders.filter(status=status_filter)

        serializer = DispatchOrderSerializer(orders.order_by("-created_at"), many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="available")
    def available_riders(self, request):
        """Get all available riders (active status)"""
        tenant_id = request.headers.get("X-Tenant-ID")
        if not tenant_id:
            raise PermissionDenied("Missing tenant ID")

        riders = Rider.objects.filter(tenant_id=tenant_id, status="active").order_by(
            "first_name", "last_name"
        )

        vehicle_type = request.query_params.get("vehicle_type")
        if vehicle_type:
            riders = riders.filter(vehicle_type=vehicle_type)

        serializer = self.get_serializer(riders, many=True)
        return Response(serializer.data)


class DispatchOrderViewSet(viewsets.ModelViewSet):
    serializer_class = DispatchOrderSerializer
    lookup_field = "dispatch_id"
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["status", "priority", "rider__rider_id"]
    search_fields = [
        "customer_name",
        "customer_phone",
        "pickup_address",
        "delivery_address",
    ]
    ordering_fields = ["created_at", "updated_at", "priority", "assigned_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        tenant_id = self.request.headers.get("X-Tenant-ID")
        if not tenant_id:
            raise PermissionDenied("Missing tenant ID")
        return DispatchOrder.objects.filter(tenant_id=tenant_id).select_related("rider")

    def perform_create(self, serializer):
        tenant_id = self.request.headers.get("X-Tenant-ID")
        if not tenant_id:
            raise PermissionDenied("Missing tenant ID")
        serializer.save(tenant_id=tenant_id)

    def create(self, request, *args, **kwargs):
        """Override create to return full serializer response"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        instance = serializer.instance
        response_serializer = DispatchOrderSerializer(
            instance, context={"request": request}
        )
        headers = self.get_success_headers(response_serializer.data)
        return Response(
            response_serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )

    @action(detail=True, methods=["post"], url_path="assign")
    def assign_rider(self, request, dispatch_id=None):
        """Assign a rider to this dispatch order"""
        dispatch_order = self.get_object()
        serializer = AssignRiderSerializer(
            data=request.data, context={"request": request}
        )

        if serializer.is_valid():
            rider_id = serializer.validated_data["rider_id"]
            tenant_id = request.headers.get("X-Tenant-ID")

            try:
                rider = Rider.objects.get(rider_id=rider_id, tenant_id=tenant_id)
                dispatch_order.assign_to_rider(rider)

                return Response(
                    {
                        "message": "Rider assigned successfully",
                        "dispatch_order": DispatchOrderSerializer(dispatch_order).data,
                    }
                )
            except Rider.DoesNotExist:
                return Response(
                    {"error": "Rider not found"}, status=status.HTTP_404_NOT_FOUND
                )
            except ValueError as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"], url_path="unassign")
    def unassign_rider(self, request, dispatch_id=None):
        """Unassign rider from this dispatch order"""
        dispatch_order = self.get_object()

        if dispatch_order.status not in ["assigned", "pending"]:
            return Response(
                {
                    "error": "Cannot unassign rider from orders that are in progress or completed"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        dispatch_order.rider = None
        dispatch_order.status = "pending"
        dispatch_order.assigned_at = None
        dispatch_order.save()

        return Response(
            {
                "message": "Rider unassigned successfully",
                "dispatch_order": DispatchOrderSerializer(dispatch_order).data,
            }
        )

    @action(detail=True, methods=["post"], url_path="start")
    def start_delivery(self, request, dispatch_id=None):
        """Mark dispatch order as in progress (picked up)"""
        dispatch_order = self.get_object()
        try:
            dispatch_order.mark_in_progress()
            return Response(
                {
                    "message": "Delivery started successfully",
                    "dispatch_order": DispatchOrderSerializer(dispatch_order).data,
                }
            )
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"], url_path="complete")
    def complete_delivery(self, request, dispatch_id=None):
        """Mark dispatch order as delivered"""
        dispatch_order = self.get_object()
        try:
            dispatch_order.mark_delivered()
            return Response(
                {
                    "message": "Delivery completed successfully",
                    "dispatch_order": DispatchOrderSerializer(dispatch_order).data,
                }
            )
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel_order(self, request, dispatch_id=None):
        """Cancel the dispatch order"""
        dispatch_order = self.get_object()
        try:
            dispatch_order.cancel()
            return Response(
                {
                    "message": "Dispatch order cancelled successfully",
                    "dispatch_order": DispatchOrderSerializer(dispatch_order).data,
                }
            )
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["get"], url_path="pending")
    def pending_orders(self, request):
        """Get all pending dispatch orders"""
        tenant_id = request.headers.get("X-Tenant-ID")
        if not tenant_id:
            raise PermissionDenied("Missing tenant ID")

        orders = DispatchOrder.objects.filter(
            tenant_id=tenant_id, status="pending"
        ).order_by("priority", "created_at")

        priority = request.query_params.get("priority")
        if priority:
            orders = orders.filter(priority=priority)

        serializer = self.get_serializer(orders, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="assigned")
    def assigned_orders(self, request):
        """Get all assigned dispatch orders"""
        tenant_id = request.headers.get("X-Tenant-ID")
        if not tenant_id:
            raise PermissionDenied("Missing tenant ID")

        orders = (
            DispatchOrder.objects.filter(tenant_id=tenant_id, status="assigned")
            .select_related("rider")
            .order_by("assigned_at")
        )

        rider_id = request.query_params.get("rider_id")
        if rider_id:
            orders = orders.filter(rider__rider_id=rider_id)

        serializer = self.get_serializer(orders, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="analytics")
    def analytics(self, request):
        """Get dispatch analytics"""
        tenant_id = request.headers.get("X-Tenant-ID")
        if not tenant_id:
            raise PermissionDenied("Missing tenant ID")

        orders = DispatchOrder.objects.filter(tenant_id=tenant_id)

        status_counts = {
            key: orders.filter(status=key).count()
            for key, _ in DispatchOrder.STATUS_CHOICES
        }
        priority_counts = {
            key: orders.filter(priority=key).count()
            for key, _ in DispatchOrder.PRIORITY_CHOICES
        }

        completed_orders = orders.filter(
            status="delivered", actual_duration__isnull=False
        )
        avg_duration = completed_orders.aggregate(
            avg_duration=models.Avg("actual_duration")
        )["avg_duration"]

        return Response(
            {
                "total_orders": orders.count(),
                "status_breakdown": status_counts,
                "priority_breakdown": priority_counts,
                "average_delivery_time_minutes": (
                    round(avg_duration, 2) if avg_duration else None
                ),
            }
        )
