import pytest
import uuid
import json
from django.urls import reverse
from rest_framework import status

from main_services.riders.models import Rider, DispatchOrder, RiderLocationHistory


@pytest.mark.django_db
class TestRiderViewSet:
    def test_list_riders_success(self, api_client, auth_headers, test_rider):
        url = reverse('rider-list')
        response = api_client.get(url, **auth_headers)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['rider_id'] == str(test_rider.rider_id)
        assert response.data['results'][0]['full_name'] == test_rider.full_name

    def test_list_riders_no_tenant_id(self, api_client, test_user):
        # Auth without tenant ID header
        url = reverse('rider-list')
        api_client.force_authenticate(user=test_user)
        response = api_client.get(url)

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert 'Missing tenant ID' in str(response.data)

    def test_list_riders_tenant_isolation(self, api_client, auth_headers, test_rider, other_tenant_rider):
        url = reverse('rider-list')
        response = api_client.get(url, **auth_headers)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1  # Only sees own tenant's rider
        assert response.data['results'][0]['rider_id'] == str(test_rider.rider_id)

    def test_create_rider_success(self, api_client, auth_headers, tenant_id):
        url = reverse('rider-list')
        data = {
            'first_name': 'New',
            'last_name': 'Rider',
            'email': 'new.rider@example.com',
            'phone': '555-0999',
            'vehicle_type': 'bicycle',
            'vehicle_plate': 'XYZ-789',
            'location': {'latitude': 41.8781, 'longitude': -87.6298}
        }

        response = api_client.post(url, data, format='json', **auth_headers)

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['first_name'] == 'New'
        assert response.data['last_name'] == 'Rider'
        assert response.data['email'] == 'new.rider@example.com'
        assert response.data['tenant_id'] == str(tenant_id)
        assert response.data['full_name'] == 'New Rider'

        # Verify in database
        rider = Rider.objects.get(rider_id=response.data['rider_id'])
        assert rider.tenant_id == tenant_id

    def test_create_rider_duplicate_email(self, api_client, auth_headers, test_rider):
        url = reverse('rider-list')
        data = {
            'first_name': 'Another',
            'last_name': 'Rider',
            'email': test_rider.email,  # Duplicate email
            'phone': '555-0999',
            'vehicle_type': 'bicycle'
        }

        response = api_client.post(url, data, format='json', **auth_headers)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'already exists' in str(response.data['email'][0])

    def test_create_rider_invalid_vehicle_type(self, api_client, auth_headers):
        url = reverse('rider-list')
        data = {
            'first_name': 'Test',
            'last_name': 'Rider',
            'email': 'test@example.com',
            'phone': '555-0999',
            'vehicle_type': 'invalid_type'  # Invalid choice
        }

        response = api_client.post(url, data, format='json', **auth_headers)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'valid choice' in str(response.data['vehicle_type'][0])

    def test_create_rider_invalid_location(self, api_client, auth_headers):
        url = reverse('rider-list')
        data = {
            'first_name': 'Test',
            'last_name': 'Rider',
            'email': 'test@example.com',
            'phone': '555-0999',
            'vehicle_type': 'bicycle',
            'location': {'latitude': 100, 'longitude': -200}  # Invalid coordinates
        }

        response = api_client.post(url, data, format='json', **auth_headers)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_retrieve_rider_success(self, api_client, auth_headers, test_rider):
        url = reverse('rider-detail', kwargs={'rider_id': test_rider.rider_id})
        response = api_client.get(url, **auth_headers)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['rider_id'] == str(test_rider.rider_id)
        assert response.data['full_name'] == test_rider.full_name

    def test_retrieve_rider_not_found(self, api_client, auth_headers):
        nonexistent_id = uuid.uuid4()
        url = reverse('rider-detail', kwargs={'rider_id': nonexistent_id})
        response = api_client.get(url, **auth_headers)

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_retrieve_rider_different_tenant(self, api_client, auth_headers, other_tenant_rider):
        url = reverse('rider-detail', kwargs={'rider_id': other_tenant_rider.rider_id})
        response = api_client.get(url, **auth_headers)

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_update_rider_success(self, api_client, auth_headers, test_rider):
        url = reverse('rider-detail', kwargs={'rider_id': test_rider.rider_id})
        data = {
            'first_name': 'Updated',
            'last_name': 'Name',
            'phone': '555-UPDATED',
            'status': 'inactive'
        }

        response = api_client.patch(url, data, format='json', **auth_headers)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['first_name'] == 'Updated'
        assert response.data['last_name'] == 'Name'
        assert response.data['phone'] == '555-UPDATED'
        assert response.data['status'] == 'inactive'

    def test_delete_rider_success(self, api_client, auth_headers, test_rider):
        url = reverse('rider-detail', kwargs={'rider_id': test_rider.rider_id})
        response = api_client.delete(url, **auth_headers)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Rider.objects.filter(rider_id=test_rider.rider_id).exists()

    def test_update_location_success(self, api_client, auth_headers, test_rider):
        url = reverse('rider-update-location', kwargs={'rider_id': test_rider.rider_id})
        data = {
            'latitude': 41.8781,
            'longitude': -87.6298
        }

        response = api_client.post(url, data, format='json', **auth_headers)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['message'] == 'Location updated successfully'
        assert response.data['location']['latitude'] == 41.8781
        assert response.data['location']['longitude'] == -87.6298

        # Verify location history was created
        assert RiderLocationHistory.objects.filter(rider=test_rider).exists()

    def test_update_location_invalid_coordinates(self, api_client, auth_headers, test_rider):
        url = reverse('rider-update-location', kwargs={'rider_id': test_rider.rider_id})
        data = {
            'latitude': 100,  # Invalid latitude
            'longitude': -87.6298
        }

        response = api_client.post(url, data, format='json', **auth_headers)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_location_history(self, api_client, auth_headers, test_rider):
        # Create some location history
        RiderLocationHistory.objects.create(
            rider=test_rider,
            latitude=40.7128,
            longitude=-74.0060
        )
        RiderLocationHistory.objects.create(
            rider=test_rider,
            latitude=41.8781,
            longitude=-87.6298
        )

        url = reverse('rider-location-history', kwargs={'rider_id': test_rider.rider_id})
        response = api_client.get(url, **auth_headers)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2

    def test_rider_dispatch_orders(self, api_client, auth_headers, assigned_dispatch_order):
        rider = assigned_dispatch_order.rider
        url = reverse('rider-dispatch-orders', kwargs={'rider_id': rider.rider_id})
        response = api_client.get(url, **auth_headers)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['dispatch_id'] == str(assigned_dispatch_order.dispatch_id)

    def test_available_riders(self, api_client, auth_headers, test_rider, inactive_rider):
        url = reverse('rider-available-riders')
        response = api_client.get(url, **auth_headers)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1  # Only active rider
        assert response.data[0]['rider_id'] == str(test_rider.rider_id)

    def test_search_riders(self, api_client, auth_headers, test_rider):
        url = reverse('rider-list')
        response = api_client.get(url + '?search=John', **auth_headers)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['rider_id'] == str(test_rider.rider_id)

    def test_filter_riders_by_status(self, api_client, auth_headers, test_rider, inactive_rider):
        url = reverse('rider-list')
        response = api_client.get(url + '?status=active', **auth_headers)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['rider_id'] == str(test_rider.rider_id)

    def test_filter_riders_by_vehicle_type(self, api_client, auth_headers, test_rider):
        url = reverse('rider-list')
        response = api_client.get(url + '?vehicle_type=motorcycle', **auth_headers)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['rider_id'] == str(test_rider.rider_id)


@pytest.mark.django_db
class TestRiderViewSetNegativePaths:
    def test_create_rider_missing_required_fields(self, api_client, auth_headers):
        url = reverse('rider-list')
        data = {
            'first_name': 'Test'
            # Missing required fields
        }

        response = api_client.post(url, data, format='json', **auth_headers)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'required' in str(response.data)

    def test_unauthenticated_request(self, api_client, test_rider):
        url = reverse('rider-list')
        response = api_client.get(url)

        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]

    def test_update_rider_invalid_status(self, api_client, auth_headers, test_rider):
        url = reverse('rider-detail', kwargs={'rider_id': test_rider.rider_id})
        data = {'status': 'invalid_status'}

        response = api_client.patch(url, data, format='json', **auth_headers)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_update_location_missing_fields(self, api_client, auth_headers, test_rider):
        url = reverse('rider-update-location', kwargs={'rider_id': test_rider.rider_id})
        data = {'latitude': 40.7128}  # Missing longitude

        response = api_client.post(url, data, format='json', **auth_headers)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_location_history_invalid_days_parameter(self, api_client, auth_headers, test_rider):
        url = reverse('rider-location-history', kwargs={'rider_id': test_rider.rider_id})
        response = api_client.get(url + '?days=invalid', **auth_headers)

        # Should default to 7 days when invalid parameter is provided
        assert response.status_code == status.HTTP_200_OK