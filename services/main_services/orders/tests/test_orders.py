import pytest
from django.urls import reverse
from rest_framework import status
from unittest.mock import patch
from main_services.orders.models import Order, Return, PaystackTransaction


@pytest.mark.django_db
def test_create_order(auth_client, tenant_id, order_payload):
    url = reverse("order-list")
    resp = auth_client.post(
        url, order_payload, format="json", HTTP_X_TENANT_ID=tenant_id
    )

    assert resp.status_code == status.HTTP_201_CREATED
    assert resp.data["customer_name"] == order_payload["customer_name"]
    assert len(resp.data["items"]) == len(order_payload["items"])


@pytest.mark.django_db
def test_list_and_retrieve_order(auth_client, tenant_id, order_payload):
    create_resp = auth_client.post(
        reverse("order-list"), order_payload, format="json", HTTP_X_TENANT_ID=tenant_id
    )
    order_id = create_resp.data["order_id"]

    list_resp = auth_client.get(reverse("order-list"), HTTP_X_TENANT_ID=tenant_id)
    assert list_resp.status_code == status.HTTP_200_OK

    # handle pagination or plain list
    results = (
        list_resp.data["results"] if "results" in list_resp.data else list_resp.data
    )
    assert any(o["order_id"] == order_id for o in results)

    retrieve_resp = auth_client.get(
        reverse("order-detail", args=[order_id]), HTTP_X_TENANT_ID=tenant_id
    )
    assert retrieve_resp.status_code == status.HTTP_200_OK
    assert retrieve_resp.data["order_id"] == order_id


@pytest.mark.django_db
def test_update_order_status(auth_client, tenant_id, order_payload):
    create_resp = auth_client.post(
        reverse("order-list"), order_payload, format="json", HTTP_X_TENANT_ID=tenant_id
    )
    order_id = create_resp.data["order_id"]

    patch_resp = auth_client.patch(
        reverse("order-detail", args=[order_id]),
        {"status": "delivered"},
        format="json",
        HTTP_X_TENANT_ID=tenant_id,
    )
    assert patch_resp.status_code == status.HTTP_200_OK
    assert patch_resp.data["status"] == "delivered"


@pytest.mark.django_db
def test_create_return(auth_client, tenant_id, order_payload):
    order_resp = auth_client.post(
        reverse("order-list"), order_payload, format="json", HTTP_X_TENANT_ID=tenant_id
    )
    order_id = order_resp.data["order_id"]

    return_url = reverse("order-return", args=[order_id])
    ret_resp = auth_client.post(
        return_url,
        {"reason": "damaged item"},
        format="json",
        HTTP_X_TENANT_ID=tenant_id,
    )
    assert ret_resp.status_code == status.HTTP_201_CREATED
    assert ret_resp.data["reason"] == "damaged item"


@pytest.mark.django_db
@patch("main_services.orders.views.PaystackClient.initialize_transaction")
def test_initialize_paystack_payment(
    mock_initialize, auth_client, tenant_id, order_payload
):
    order_resp = auth_client.post(
        reverse("order-list"), order_payload, format="json", HTTP_X_TENANT_ID=tenant_id
    )
    order_id = order_resp.data["order_id"]

    mock_initialize.return_value = {
        "status": True,
        "data": {
            "authorization_url": "https://paystack.com/pay/mock",
            "reference": "mock_ref",
        },
    }

    init_url = reverse("paystack-init")
    resp = auth_client.post(
        init_url,
        {"order_id": order_id, "customer_email": "test@example.com"},
        format="json",
        HTTP_X_TENANT_ID=tenant_id,
    )

    assert resp.status_code == status.HTTP_201_CREATED
    assert resp.data["authorization_url"] == "https://paystack.com/pay/mock"
    assert resp.data["status"] == "initialized"


@pytest.mark.django_db
@patch("main_services.orders.views.PaystackClient.verify_transaction")
def test_verify_paystack_payment(mock_verify, auth_client, tenant_id, order_payload):
    order_resp = auth_client.post(
        reverse("order-list"), order_payload, format="json", HTTP_X_TENANT_ID=tenant_id
    )
    order_id = order_resp.data["order_id"]

    # create a mock transaction linked to order
    order = Order.objects.get(order_id=order_id)
    tx = PaystackTransaction.objects.create(
        tenant_id=tenant_id,
        order=order,
        reference="mock_ref",
        amount=order.total_amount,
        currency="NGN",
        authorization_url="https://paystack.com/pay/mock",
        status="initialized",
    )

    mock_verify.return_value = {
        "status": True,
        "data": {"status": "success", "paid_at": "2025-09-13T12:00:00Z"},
    }

    verify_url = reverse("paystack-verify", args=["mock_ref"])
    resp = auth_client.get(verify_url, HTTP_X_TENANT_ID=tenant_id)

    assert resp.status_code == status.HTTP_200_OK
    assert resp.data["status"] == "success"
    assert resp.data["order"] == str(order.order_id)
