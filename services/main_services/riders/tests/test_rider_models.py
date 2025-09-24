import pytest
import uuid
from decimal import Decimal
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.utils import timezone

from main_services.riders.models import Rider, DispatchOrder, RiderLocationHistory


@pytest.mark.django_db
class TestRiderModel:
    def test_create_rider_success(self, tenant_id):
        rider = Rider.objects.create(
            tenant_id=tenant_id,
            first_name="John",
            last_name="Doe",
            email="john@example.com",
            phone="123-456-7890",
            vehicle_type="motorcycle",
            vehicle_plate="ABC-123"
        )

        assert rider.rider_id is not None
        assert rider.tenant_id == tenant_id
        assert rider.full_name == "John Doe"
        assert rider.status == "active"  # default
        assert rider.rating == Decimal('0.00')  # default
        assert rider.location == {}  # default empty dict
        assert rider.metadata == {}  # default empty dict

    def test_rider_unique_email_per_tenant(self, tenant_id):
        # Create first rider
        Rider.objects.create(
            tenant_id=tenant_id,
            first_name="John",
            last_name="Doe",
            email="john@example.com",
            phone="123-456-7890",
            vehicle_type="motorcycle"
        )

        # Try to create another rider with same email and tenant
        with pytest.raises(IntegrityError):
            Rider.objects.create(
                tenant_id=tenant_id,
                first_name="Jane",
                last_name="Smith",
                email="john@example.com",  # Same email
                phone="098-765-4321",
                vehicle_type="bicycle"
            )

    def test_rider_same_email_different_tenant(self, tenant_id, other_tenant_id):
        # Create rider in first tenant
        rider1 = Rider.objects.create(
            tenant_id=tenant_id,
            first_name="John",
            last_name="Doe",
            email="john@example.com",
            phone="123-456-7890",
            vehicle_type="motorcycle"
        )

        # Create rider with same email in different tenant - should work
        rider2 = Rider.objects.create(
            tenant_id=other_tenant_id,
            first_name="John",
            last_name="Smith",
            email="john@example.com",  # Same email, different tenant
            phone="098-765-4321",
            vehicle_type="bicycle"
        )

        assert rider1.email == rider2.email
        assert rider1.tenant_id != rider2.tenant_id

    def test_rider_vehicle_type_choices(self, tenant_id):
        # Valid vehicle type
        rider = Rider.objects.create(
            tenant_id=tenant_id,
            first_name="John",
            last_name="Doe",
            email="john@example.com",
            phone="123-456-7890",
            vehicle_type="motorcycle"
        )
        assert rider.vehicle_type == "motorcycle"

    def test_rider_status_choices(self, tenant_id):
        rider = Rider.objects.create(
            tenant_id=tenant_id,
            first_name="John",
            last_name="Doe",
            email="john@example.com",
            phone="123-456-7890",
            vehicle_type="motorcycle",
            status="suspended"
        )
        assert rider.status == "suspended"

    def test_rider_rating_validation(self, tenant_id):
        rider = Rider.objects.create(
            tenant_id=tenant_id,
            first_name="John",
            last_name="Doe",
            email="john@example.com",
            phone="123-456-7890",
            vehicle_type="motorcycle",
            rating=Decimal('4.50')
        )
        assert rider.rating == Decimal('4.50')

    def test_rider_location_json_field(self, tenant_id):
        location_data = {"latitude": 40.7128, "longitude": -74.0060}
        rider = Rider.objects.create(
            tenant_id=tenant_id,
            first_name="John",
            last_name="Doe",
            email="john@example.com",
            phone="123-456-7890",
            vehicle_type="motorcycle",
            location=location_data
        )

        assert rider.location == location_data
        assert rider.location["latitude"] == 40.7128
        assert rider.location["longitude"] == -74.0060

    def test_rider_metadata_json_field(self, tenant_id):
        metadata = {"emergency_contact": "Jane Doe", "license_expiry": "2025-12-31"}
        rider = Rider.objects.create(
            tenant_id=tenant_id,
            first_name="John",
            last_name="Doe",
            email="john@example.com",
            phone="123-456-7890",
            vehicle_type="motorcycle",
            metadata=metadata
        )

        assert rider.metadata == metadata
        assert rider.metadata["emergency_contact"] == "Jane Doe"


@pytest.mark.django_db
class TestDispatchOrderModel:
    def test_create_dispatch_order_success(self, tenant_id):
        order_id = uuid.uuid4()
        dispatch = DispatchOrder.objects.create(
            tenant_id=tenant_id,
            order_id=order_id,
            customer_name="John Customer",
            customer_phone="555-0123",
            pickup_address="123 Pickup St",
            delivery_address="456 Delivery Ave"
        )

        assert dispatch.dispatch_id is not None
        assert dispatch.tenant_id == tenant_id
        assert dispatch.order_id == order_id
        assert dispatch.status == "pending"  # default
        assert dispatch.priority == "medium"  # default
        assert dispatch.rider is None  # not assigned yet

    def test_assign_to_rider_success(self, tenant_id, test_rider):
        dispatch = DispatchOrder.objects.create(
            tenant_id=tenant_id,
            order_id=uuid.uuid4(),
            customer_name="John Customer",
            customer_phone="555-0123",
            pickup_address="123 Pickup St",
            delivery_address="456 Delivery Ave"
        )

        dispatch.assign_to_rider(test_rider)

        assert dispatch.rider == test_rider
        assert dispatch.status == "assigned"
        assert dispatch.assigned_at is not None

    def test_assign_to_rider_invalid_status(self, tenant_id, test_rider):
        dispatch = DispatchOrder.objects.create(
            tenant_id=tenant_id,
            order_id=uuid.uuid4(),
            customer_name="John Customer",
            customer_phone="555-0123",
            pickup_address="123 Pickup St",
            delivery_address="456 Delivery Ave",
            status="delivered"  # Not pending
        )

        with pytest.raises(ValueError, match="Can only assign pending dispatch orders"):
            dispatch.assign_to_rider(test_rider)

    def test_assign_to_inactive_rider(self, tenant_id, inactive_rider):
        dispatch = DispatchOrder.objects.create(
            tenant_id=tenant_id,
            order_id=uuid.uuid4(),
            customer_name="John Customer",
            customer_phone="555-0123",
            pickup_address="123 Pickup St",
            delivery_address="456 Delivery Ave"
        )

        with pytest.raises(ValueError, match="Can only assign to active riders"):
            dispatch.assign_to_rider(inactive_rider)

    def test_assign_to_rider_different_tenant(self, tenant_id, other_tenant_rider):
        dispatch = DispatchOrder.objects.create(
            tenant_id=tenant_id,
            order_id=uuid.uuid4(),
            customer_name="John Customer",
            customer_phone="555-0123",
            pickup_address="123 Pickup St",
            delivery_address="456 Delivery Ave"
        )

        with pytest.raises(ValueError, match="Rider must belong to the same tenant"):
            dispatch.assign_to_rider(other_tenant_rider)

    def test_mark_in_progress_success(self, assigned_dispatch_order):
        assigned_dispatch_order.mark_in_progress()

        assert assigned_dispatch_order.status == "in_progress"
        assert assigned_dispatch_order.picked_up_at is not None

    def test_mark_in_progress_invalid_status(self, test_dispatch_order):
        with pytest.raises(ValueError, match="Can only mark assigned orders as in progress"):
            test_dispatch_order.mark_in_progress()

    def test_mark_delivered_success(self, assigned_dispatch_order):
        # First mark as in progress
        assigned_dispatch_order.mark_in_progress()

        # Then mark as delivered
        assigned_dispatch_order.mark_delivered()

        assert assigned_dispatch_order.status == "delivered"
        assert assigned_dispatch_order.delivered_at is not None
        assert assigned_dispatch_order.actual_duration is not None

    def test_mark_delivered_invalid_status(self, assigned_dispatch_order):
        # Try to mark delivered without being in progress
        with pytest.raises(ValueError, match="Can only mark in-progress orders as delivered"):
            assigned_dispatch_order.mark_delivered()

    def test_cancel_success(self, test_dispatch_order):
        test_dispatch_order.cancel()
        assert test_dispatch_order.status == "cancelled"

    def test_cancel_delivered_order(self, assigned_dispatch_order):
        # Complete the delivery first
        assigned_dispatch_order.mark_in_progress()
        assigned_dispatch_order.mark_delivered()

        # Try to cancel delivered order
        with pytest.raises(ValueError, match="Cannot cancel delivered orders"):
            assigned_dispatch_order.cancel()

    def test_dispatch_order_location_fields(self, tenant_id):
        pickup_location = {"latitude": 40.7128, "longitude": -74.0060}
        delivery_location = {"latitude": 40.7614, "longitude": -73.9776}

        dispatch = DispatchOrder.objects.create(
            tenant_id=tenant_id,
            order_id=uuid.uuid4(),
            customer_name="John Customer",
            customer_phone="555-0123",
            pickup_address="123 Pickup St",
            delivery_address="456 Delivery Ave",
            pickup_location=pickup_location,
            delivery_location=delivery_location
        )

        assert dispatch.pickup_location == pickup_location
        assert dispatch.delivery_location == delivery_location


@pytest.mark.django_db
class TestRiderLocationHistory:
    def test_create_location_history(self, test_rider):
        location = RiderLocationHistory.objects.create(
            rider=test_rider,
            latitude=Decimal('40.7128'),
            longitude=Decimal('-74.0060')
        )

        assert location.rider == test_rider
        assert location.latitude == Decimal('40.7128')
        assert location.longitude == Decimal('-74.0060')
        assert location.timestamp is not None

    def test_location_history_relationship(self, test_rider):
        # Create multiple location entries
        RiderLocationHistory.objects.create(
            rider=test_rider,
            latitude=Decimal('40.7128'),
            longitude=Decimal('-74.0060')
        )
        RiderLocationHistory.objects.create(
            rider=test_rider,
            latitude=Decimal('40.7614'),
            longitude=Decimal('-73.9776')
        )

        assert test_rider.location_history.count() == 2