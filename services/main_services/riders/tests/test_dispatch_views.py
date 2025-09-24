import pytest
import uuid
from django.urls import reverse
from rest_framework import status

from main_services.riders.models import DispatchOrder


@pytest.mark.django_db
class TestDispatchOrderViewSet:
    def test_list_dispatch_orders_success(self, api_client, auth_headers, test_dispatch_order):
        url = reverse('dispatch-list')
        response = api_client.get(url, **auth_headers)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['dispatch_id'] == str(test_dispatch_order.dispatch_id)

    def test_list_dispatch_orders_no_tenant_id(self, api_client, test_user):
        url = reverse('dispatch-list')
        api_client.force_authenticate(user=test_user)
        response = api_client.get(url)

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert 'Missing tenant ID' in str(response.data)

    def test_create_dispatch_order_success(self, api_client, auth_headers, tenant_id):
        url = reverse('dispatch-list')
        order_id = uuid.uuid4()
        data = {
            'order_id': str(order_id),
            'customer_name': 'Test Customer',
            'customer_phone': '555-0123',
            'pickup_address': '123 Test St',
            'delivery_address': '456 Test Ave',
            'pickup_location': {'latitude': 40.7128, 'longitude': -74.0060},
            'delivery_location': {'latitude': 40.7614, 'longitude': -73.9776},
            'priority': 'high',
            'estimated_duration': 45,
            'distance': 8.5,
            'notes': 'Handle with care'
        }

        response = api_client.post(url, data, format='json', **auth_headers)

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['order_id'] == str(order_id)
        assert response.data['customer_name'] == 'Test Customer'
        assert response.data['tenant_id'] == str(tenant_id)
        assert response.data['status'] == 'pending'
        assert response.data['priority'] == 'high'

    def test_create_dispatch_order_missing_required_fields(self, api_client, auth_headers):
        url = reverse('dispatch-list')
        data = {
            'customer_name': 'Test Customer'
            # Missing required fields
        }

        response = api_client.post(url, data, format='json', **auth_headers)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'required' in str(response.data)

    def test_create_dispatch_order_invalid_location(self, api_client, auth_headers):
        url = reverse('dispatch-list')
        data = {
            'order_id': str(uuid.uuid4()),
            'customer_name': 'Test Customer',
            'customer_phone': '555-0123',
            'pickup_address': '123 Test St',
            'delivery_address': '456 Test Ave',
            'pickup_location': {'latitude': 100, 'longitude': -200}  # Invalid coordinates
        }

        response = api_client.post(url, data, format='json', **auth_headers)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_retrieve_dispatch_order_success(self, api_client, auth_headers, test_dispatch_order):
        url = reverse('dispatch-detail', kwargs={'dispatch_id': test_dispatch_order.dispatch_id})
        response = api_client.get(url, **auth_headers)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['dispatch_id'] == str(test_dispatch_order.dispatch_id)

    def test_retrieve_dispatch_order_not_found(self, api_client, auth_headers):
        nonexistent_id = uuid.uuid4()
        url = reverse('dispatch-detail', kwargs={'dispatch_id': nonexistent_id})
        response = api_client.get(url, **auth_headers)

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_update_dispatch_order_success(self, api_client, auth_headers, test_dispatch_order):
        url = reverse('dispatch-detail', kwargs={'dispatch_id': test_dispatch_order.dispatch_id})
        data = {
            'customer_name': 'Updated Customer',
            'priority': 'urgent',
            'notes': 'Updated notes'
        }

        response = api_client.patch(url, data, format='json', **auth_headers)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['customer_name'] == 'Updated Customer'
        assert response.data['priority'] == 'urgent'
        assert response.data['notes'] == 'Updated notes'

    def test_delete_dispatch_order_success(self, api_client, auth_headers, test_dispatch_order):
        url = reverse('dispatch-detail', kwargs={'dispatch_id': test_dispatch_order.dispatch_id})
        response = api_client.delete(url, **auth_headers)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not DispatchOrder.objects.filter(dispatch_id=test_dispatch_order.dispatch_id).exists()

    def test_assign_rider_success(self, api_client, auth_headers, test_dispatch_order, test_rider):
        url = reverse('dispatch-assign-rider', kwargs={'dispatch_id': test_dispatch_order.dispatch_id})
        data = {'rider_id': str(test_rider.rider_id)}

        response = api_client.post(url, data, format='json', **auth_headers)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['message'] == 'Rider assigned successfully'
        assert response.data['dispatch_order']['rider']['rider_id'] == str(test_rider.rider_id)
        assert response.data['dispatch_order']['status'] == 'assigned'

        # Verify in database
        test_dispatch_order.refresh_from_db()
        assert test_dispatch_order.rider == test_rider
        assert test_dispatch_order.status == 'assigned'

    def test_assign_rider_to_non_pending_order(self, api_client, auth_headers, assigned_dispatch_order, test_rider):
        url = reverse('dispatch-assign-rider', kwargs={'dispatch_id': assigned_dispatch_order.dispatch_id})
        data = {'rider_id': str(test_rider.rider_id)}

        response = api_client.post(url, data, format='json', **auth_headers)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'pending' in str(response.data['error'])

    def test_assign_inactive_rider(self, api_client, auth_headers, test_dispatch_order, inactive_rider):
        url = reverse('dispatch-assign-rider', kwargs={'dispatch_id': test_dispatch_order.dispatch_id})
        data = {'rider_id': str(inactive_rider.rider_id)}

        response = api_client.post(url, data, format='json', **auth_headers)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'active' in str(response.data)

    def test_assign_nonexistent_rider(self, api_client, auth_headers, test_dispatch_order):
        url = reverse('dispatch-assign-rider', kwargs={'dispatch_id': test_dispatch_order.dispatch_id})
        data = {'rider_id': str(uuid.uuid4())}

        response = api_client.post(url, data, format='json', **auth_headers)

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_unassign_rider_success(self, api_client, auth_headers, assigned_dispatch_order):
        url = reverse('dispatch-unassign-rider', kwargs={'dispatch_id': assigned_dispatch_order.dispatch_id})
        response = api_client.post(url, **auth_headers)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['message'] == 'Rider unassigned successfully'
        assert response.data['dispatch_order']['rider'] is None
        assert response.data['dispatch_order']['status'] == 'pending'

    def test_start_delivery_success(self, api_client, auth_headers, assigned_dispatch_order):
        url = reverse('dispatch-start-delivery', kwargs={'dispatch_id': assigned_dispatch_order.dispatch_id})
        response = api_client.post(url, **auth_headers)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['message'] == 'Delivery started successfully'
        assert response.data['dispatch_order']['status'] == 'in_progress'

        # Verify in database
        assigned_dispatch_order.refresh_from_db()
        assert assigned_dispatch_order.status == 'in_progress'
        assert assigned_dispatch_order.picked_up_at is not None

    def test_start_delivery_invalid_status(self, api_client, auth_headers, test_dispatch_order):
        url = reverse('dispatch-start-delivery', kwargs={'dispatch_id': test_dispatch_order.dispatch_id})
        response = api_client.post(url, **auth_headers)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'assigned' in str(response.data['error'])

    def test_complete_delivery_success(self, api_client, auth_headers, assigned_dispatch_order):
        # First start the delivery
        assigned_dispatch_order.mark_in_progress()

        url = reverse('dispatch-complete-delivery', kwargs={'dispatch_id': assigned_dispatch_order.dispatch_id})
        response = api_client.post(url, **auth_headers)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['message'] == 'Delivery completed successfully'
        assert response.data['dispatch_order']['status'] == 'delivered'

        # Verify in database
        assigned_dispatch_order.refresh_from_db()
        assert assigned_dispatch_order.status == 'delivered'
        assert assigned_dispatch_order.delivered_at is not None

    def test_complete_delivery_invalid_status(self, api_client, auth_headers, assigned_dispatch_order):
        # Don't start delivery first
        url = reverse('dispatch-complete-delivery', kwargs={'dispatch_id': assigned_dispatch_order.dispatch_id})
        response = api_client.post(url, **auth_headers)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'in-progress' in str(response.data['error'])

    def test_cancel_order_success(self, api_client, auth_headers, test_dispatch_order):
        url = reverse('dispatch-cancel-order', kwargs={'dispatch_id': test_dispatch_order.dispatch_id})
        response = api_client.post(url, **auth_headers)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['message'] == 'Dispatch order cancelled successfully'
        assert response.data['dispatch_order']['status'] == 'cancelled'

    def test_cancel_delivered_order(self, api_client, auth_headers, assigned_dispatch_order):
        # Complete the delivery first
        assigned_dispatch_order.mark_in_progress()
        assigned_dispatch_order.mark_delivered()

        url = reverse('dispatch-cancel-order', kwargs={'dispatch_id': assigned_dispatch_order.dispatch_id})
        response = api_client.post(url, **auth_headers)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'delivered' in str(response.data['error'])

    def test_pending_orders_endpoint(self, api_client, auth_headers, test_dispatch_order, assigned_dispatch_order):
        url = reverse('dispatch-pending-orders')
        response = api_client.get(url, **auth_headers)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1  # Only pending order
        assert response.data[0]['dispatch_id'] == str(test_dispatch_order.dispatch_id)

    def test_assigned_orders_endpoint(self, api_client, auth_headers, test_dispatch_order, assigned_dispatch_order):
        url = reverse('dispatch-assigned-orders')
        response = api_client.get(url, **auth_headers)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1  # Only assigned order
        assert response.data[0]['dispatch_id'] == str(assigned_dispatch_order.dispatch_id)

    def test_analytics_endpoint(self, api_client, auth_headers, test_dispatch_order, assigned_dispatch_order):
        url = reverse('dispatch-analytics')
        response = api_client.get(url, **auth_headers)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['total_orders'] == 2
        assert 'status_breakdown' in response.data
        assert 'priority_breakdown' in response.data
        assert response.data['status_breakdown']['pending'] == 1
        assert response.data['status_breakdown']['assigned'] == 1

    def test_search_dispatch_orders(self, api_client, auth_headers, test_dispatch_order):
        url = reverse('dispatch-list')
        response = api_client.get(url + '?search=Customer', **auth_headers)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['dispatch_id'] == str(test_dispatch_order.dispatch_id)

    def test_filter_dispatch_orders_by_status(self, api_client, auth_headers, test_dispatch_order, assigned_dispatch_order):
        url = reverse('dispatch-list')
        response = api_client.get(url + '?status=pending', **auth_headers)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['dispatch_id'] == str(test_dispatch_order.dispatch_id)

    def test_filter_dispatch_orders_by_priority(self, api_client, auth_headers, test_dispatch_order):
        # Update priority for test
        test_dispatch_order.priority = 'urgent'
        test_dispatch_order.save()

        url = reverse('dispatch-list')
        response = api_client.get(url + '?priority=urgent', **auth_headers)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['dispatch_id'] == str(test_dispatch_order.dispatch_id)

    def test_filter_dispatch_orders_by_rider(self, api_client, auth_headers, assigned_dispatch_order):
        url = reverse('dispatch-list')
        response = api_client.get(url + f'?rider__rider_id={assigned_dispatch_order.rider.rider_id}', **auth_headers)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['dispatch_id'] == str(assigned_dispatch_order.dispatch_id)


@pytest.mark.django_db
class TestDispatchOrderViewSetNegativePaths:
    def test_unauthenticated_request(self, api_client, test_dispatch_order):
        url = reverse('dispatch-list')
        response = api_client.get(url)

        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]

    def test_assign_rider_missing_rider_id(self, api_client, auth_headers, test_dispatch_order):
        url = reverse('dispatch-assign-rider', kwargs={'dispatch_id': test_dispatch_order.dispatch_id})
        data = {}  # Missing rider_id

        response = api_client.post(url, data, format='json', **auth_headers)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'required' in str(response.data)

    def test_assign_rider_invalid_uuid(self, api_client, auth_headers, test_dispatch_order):
        url = reverse('dispatch-assign-rider', kwargs={'dispatch_id': test_dispatch_order.dispatch_id})
        data = {'rider_id': 'invalid-uuid'}

        response = api_client.post(url, data, format='json', **auth_headers)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_update_dispatch_order_invalid_status_transition(self, api_client, auth_headers, test_dispatch_order):
        url = reverse('dispatch-detail', kwargs={'dispatch_id': test_dispatch_order.dispatch_id})
        data = {'status': 'delivered'}  # Invalid transition from pending to delivered

        response = api_client.patch(url, data, format='json', **auth_headers)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'transition' in str(response.data)

    def test_unassign_rider_invalid_status(self, api_client, auth_headers, assigned_dispatch_order):
        # Mark as in progress first
        assigned_dispatch_order.mark_in_progress()

        url = reverse('dispatch-unassign-rider', kwargs={'dispatch_id': assigned_dispatch_order.dispatch_id})
        response = api_client.post(url, **auth_headers)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'Cannot unassign' in str(response.data['error'])

    def test_tenant_isolation_dispatch_orders(self, api_client, auth_headers, test_dispatch_order, other_tenant_id):
        # Create dispatch order for different tenant
        other_order = DispatchOrder.objects.create(
            tenant_id=other_tenant_id,
            order_id=uuid.uuid4(),
            customer_name="Other Customer",
            customer_phone="555-9999",
            pickup_address="Other Address",
            delivery_address="Other Delivery"
        )

        # Try to access other tenant's order
        url = reverse('dispatch-detail', kwargs={'dispatch_id': other_order.dispatch_id})
        response = api_client.get(url, **auth_headers)

        assert response.status_code == status.HTTP_404_NOT_FOUND