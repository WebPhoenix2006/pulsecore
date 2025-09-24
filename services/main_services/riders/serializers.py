from rest_framework import serializers
from .models import Rider, DispatchOrder, RiderLocationHistory


class RiderSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = Rider
        fields = [
            "rider_id",
            "tenant_id",
            "first_name",
            "last_name",
            "full_name",
            "email",
            "phone",
            "license_number",
            "vehicle_type",
            "vehicle_plate",
            "status",
            "location",
            "rating",
            "metadata",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "rider_id",
            "tenant_id",
            "created_at",
            "updated_at",
            "rating",
        ]

    def validate_email(self, value):
        """Validate email uniqueness within tenant"""
        tenant_id = self.context["request"].headers.get("X-Tenant-ID")
        queryset = Rider.objects.filter(tenant_id=tenant_id, email=value)
        if self.instance:
            queryset = queryset.exclude(rider_id=self.instance.rider_id)
        if queryset.exists():
            raise serializers.ValidationError("A rider with this email already exists.")
        return value

    def validate_location(self, value):
        """Validate location format"""
        if not value:
            return value
        if not isinstance(value, dict):
            raise serializers.ValidationError("Location must be a dictionary.")
        latitude, longitude = value.get("latitude"), value.get("longitude")
        if latitude is not None and (
            not isinstance(latitude, (int, float)) or not (-90 <= latitude <= 90)
        ):
            raise serializers.ValidationError("Latitude must be between -90 and 90.")
        if longitude is not None and (
            not isinstance(longitude, (int, float)) or not (-180 <= longitude <= 180)
        ):
            raise serializers.ValidationError("Longitude must be between -180 and 180.")
        return value


class RiderLocationHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = RiderLocationHistory
        fields = ["location_id", "latitude", "longitude", "timestamp"]
        read_only_fields = ["location_id", "timestamp"]


class DispatchOrderSerializer(serializers.ModelSerializer):
    rider = serializers.StringRelatedField(read_only=True)
    rider_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = DispatchOrder
        fields = [
            "order_id",
            "dispatch_id",
            "customer_name",
            "customer_phone",
            "pickup_address",
            "delivery_address",
            "pickup_location",
            "delivery_location",
            "priority",
            "estimated_duration",
            "distance",
            "notes",
            "metadata",
            "status",
            "rider",
            "rider_id",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["status", "created_at", "updated_at"]

    def validate_rider_id(self, value):
        if not value:
            return value
        tenant_id = self.context["request"].headers.get("X-Tenant-ID")
        try:
            rider = Rider.objects.get(rider_id=value, tenant_id=tenant_id)
        except Rider.DoesNotExist:
            raise serializers.ValidationError(
                "Rider not found or doesn't belong to your tenant."
            )
        if rider.status != "active":
            raise serializers.ValidationError("Can only assign to active riders.")
        return value

    def update(self, instance, validated_data):
        rider_id = validated_data.pop("rider_id", None)
        instance = super().update(instance, validated_data)

        if rider_id is not None:
            tenant_id = self.context["request"].headers.get("X-Tenant-ID")
            rider = Rider.objects.get(rider_id=rider_id, tenant_id=tenant_id)
            instance.assign_to_rider(rider)

        return instance


class AssignRiderSerializer(serializers.Serializer):
    """Serializer for assigning a rider to a dispatch order"""

    rider_id = serializers.UUIDField()

    def validate_rider_id(self, value):
        tenant_id = self.context["request"].headers.get("X-Tenant-ID")
        try:
            rider = Rider.objects.get(rider_id=value, tenant_id=tenant_id)
            if rider.status != "active":
                raise serializers.ValidationError("Can only assign to active riders.")
            return value
        except Rider.DoesNotExist:
            return value  # let the view handle 404


class RiderLocationUpdateSerializer(serializers.Serializer):
    """Serializer for updating rider location"""

    latitude = serializers.DecimalField(
        max_digits=10, decimal_places=8, min_value=-90, max_value=90
    )
    longitude = serializers.DecimalField(
        max_digits=11, decimal_places=8, min_value=-180, max_value=180
    )
