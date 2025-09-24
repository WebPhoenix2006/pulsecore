import uuid
from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator


class Rider(models.Model):
    VEHICLE_TYPE_CHOICES = [
        ('motorcycle', 'Motorcycle'),
        ('bicycle', 'Bicycle'),
        ('car', 'Car'),
        ('van', 'Van'),
        ('truck', 'Truck'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('suspended', 'Suspended'),
    ]

    rider_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant_id = models.UUIDField(db_index=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=50)
    license_number = models.CharField(max_length=50, blank=True, null=True)
    vehicle_type = models.CharField(max_length=20, choices=VEHICLE_TYPE_CHOICES)
    vehicle_plate = models.CharField(max_length=20, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    location = models.JSONField(default=dict, blank=True)  # {latitude, longitude}
    rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        default=0.00
    )
    metadata = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "riders"
        indexes = [
            models.Index(fields=["tenant_id"]),
            models.Index(fields=["tenant_id", "status"]),
            models.Index(fields=["tenant_id", "vehicle_type"]),
        ]
        unique_together = ("tenant_id", "email")

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.rider_id})"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"


class DispatchOrder(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('assigned', 'Assigned'),
        ('in_progress', 'In Progress'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]

    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]

    dispatch_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant_id = models.UUIDField(db_index=True)
    rider = models.ForeignKey(
        Rider,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="dispatch_orders"
    )
    order_id = models.UUIDField()  # Reference to main order
    customer_name = models.CharField(max_length=255)
    customer_phone = models.CharField(max_length=50)
    pickup_address = models.TextField()
    delivery_address = models.TextField()
    pickup_location = models.JSONField(default=dict, blank=True)  # {latitude, longitude}
    delivery_location = models.JSONField(default=dict, blank=True)  # {latitude, longitude}
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    estimated_duration = models.PositiveIntegerField(help_text="Estimated duration in minutes", blank=True, null=True)
    actual_duration = models.PositiveIntegerField(help_text="Actual duration in minutes", blank=True, null=True)
    distance = models.DecimalField(max_digits=10, decimal_places=2, help_text="Distance in kilometers", blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True)

    # Timestamps
    assigned_at = models.DateTimeField(blank=True, null=True)
    picked_up_at = models.DateTimeField(blank=True, null=True)
    delivered_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "dispatch_orders"
        indexes = [
            models.Index(fields=["tenant_id"]),
            models.Index(fields=["tenant_id", "status"]),
            models.Index(fields=["tenant_id", "rider", "status"]),
            models.Index(fields=["tenant_id", "priority"]),
            models.Index(fields=["order_id"]),
        ]

    def __str__(self):
        return f"Dispatch {self.dispatch_id} - Order {self.order_id}"

    def assign_to_rider(self, rider):
        """Assign this dispatch order to a rider"""
        if self.status != 'pending':
            raise ValueError("Can only assign pending dispatch orders")

        if rider.status != 'active':
            raise ValueError("Can only assign to active riders")

        if rider.tenant_id != self.tenant_id:
            raise ValueError("Rider must belong to the same tenant")

        self.rider = rider
        self.status = 'assigned'
        self.assigned_at = timezone.now()
        self.save()

    def mark_in_progress(self):
        """Mark dispatch order as in progress (picked up)"""
        if self.status != 'assigned':
            raise ValueError("Can only mark assigned orders as in progress")

        self.status = 'in_progress'
        self.picked_up_at = timezone.now()
        self.save()

    def mark_delivered(self):
        """Mark dispatch order as delivered"""
        if self.status != 'in_progress':
            raise ValueError("Can only mark in-progress orders as delivered")

        self.status = 'delivered'
        self.delivered_at = timezone.now()

        # Calculate actual duration if we have all timestamps
        if self.assigned_at and self.delivered_at:
            duration = self.delivered_at - self.assigned_at
            self.actual_duration = int(duration.total_seconds() / 60)  # Convert to minutes

        self.save()

    def cancel(self):
        """Cancel the dispatch order"""
        if self.status == 'delivered':
            raise ValueError("Cannot cancel delivered orders")

        self.status = 'cancelled'
        self.save()


class RiderLocationHistory(models.Model):
    """Track rider location history for analytics"""
    location_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    rider = models.ForeignKey(Rider, on_delete=models.CASCADE, related_name="location_history")
    latitude = models.DecimalField(max_digits=10, decimal_places=8)
    longitude = models.DecimalField(max_digits=11, decimal_places=8)
    timestamp = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "rider_location_history"
        indexes = [
            models.Index(fields=["rider", "timestamp"]),
        ]

    def __str__(self):
        return f"{self.rider.full_name} - {self.latitude}, {self.longitude} at {self.timestamp}"