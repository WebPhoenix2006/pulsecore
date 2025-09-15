from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from .models import Order, Return, PaystackTransaction
from .serializers import (
    OrderSerializer,
    OrderUpdateSerializer,
    ReturnSerializer,
    PaystackTransactionSerializer,
)
from .paystack import PaystackClient


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

    def get_queryset(self):
        tenant_id = self.request.headers.get("X-Tenant-ID")
        return Order.objects.filter(tenant_id=tenant_id)

    def create(self, request, *args, **kwargs):
        tenant_id = request.headers.get("X-Tenant-ID")
        serializer = OrderSerializer(data=request.data)
        if not serializer.is_valid():
            print("❌ Serializer errors:", serializer.errors)  # DEBUG
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        order = serializer.save(tenant_id=tenant_id)
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        order = self.get_object()
        serializer = OrderUpdateSerializer(order, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=["post"], url_path="return", url_name="return")
    def create_return(self, request, pk=None):
        order = self.get_object()  # <--- get the order from the URL
        serializer = ReturnSerializer(data=request.data)
        if serializer.is_valid():
            # attach order here
            ret = serializer.save(order=order)
            return Response(ReturnSerializer(ret).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PaystackInitializeView(APIView):
    def post(self, request):
        tenant_id = request.headers.get("X-Tenant-ID")
        data = request.data
        order_id = data.get("order_id")

        order = get_object_or_404(Order, order_id=order_id, tenant_id=tenant_id)
        client = PaystackClient()

        paystack_resp = client.initialize_transaction(
            email=data["customer_email"],
            amount=int(order.total_amount * 100),  # kobo
            reference=str(order.order_id),
        )

        transaction = PaystackTransaction.objects.create(
            tenant_id=tenant_id,
            order=order,
            reference=paystack_resp["data"]["reference"],
            amount=order.total_amount,
            currency="NGN",
            authorization_url=paystack_resp["data"]["authorization_url"],
            status="initialized",
        )
        return Response(PaystackTransactionSerializer(transaction).data, status=201)


class PaystackVerifyView(APIView):
    def get(self, request, reference):
        tenant_id = request.headers.get("X-Tenant-ID")
        client = PaystackClient()  # ✅ must instantiate
        verify_resp = client.verify_transaction(reference)

        tx = get_object_or_404(
            PaystackTransaction, reference=reference, tenant_id=tenant_id
        )

        if verify_resp["data"]["status"] == "success":
            tx.status = "success"
            tx.paid_at = verify_resp["data"]["paid_at"]
            tx.save()
            tx.order.payment_status = "paid"
            tx.order.save()
        else:
            tx.status = "failed"
            tx.save()

        return Response(PaystackTransactionSerializer(tx).data)
