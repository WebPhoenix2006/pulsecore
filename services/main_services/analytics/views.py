import csv
import io
import datetime
from decimal import Decimal

from django.db.models import Sum, F
from django.http import StreamingHttpResponse
from django.utils import timezone
from rest_framework import generics, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError, PermissionDenied


from .models import (
    AnalyticsDailySales,
    AnalyticsDailyStock,
    AnalyticsDailyTopSKU,
    StockoutIncident,
)

from .serializers import (
    DashboardAnalyticsSerializer,
    AnalyticsDailySalesSerializer,
    AnalyticsDailyStockSerializer,
    AnalyticsDailyTopSKUSerializer,
    StockoutIncidentSerializer,
)


def get_tenant_id(request):
    """
    Extract and validate tenant_id from X-Tenant-ID header.
    Ensures the tenant_id matches the authenticated user's tenant.
    Raises ValidationError if missing.
    Raises PermissionDenied if tenant mismatch.
    """
    tenant = request.headers.get("X-Tenant_ID") or request.META.get("HTTP_X_TENANT_ID")
    if not tenant:
        raise ValidationError("Missing X-Tenant-ID header.")

    # Security: Validate that the tenant_id matches the authenticated user's tenant
    if hasattr(request.user, 'tenant_id'):
        user_tenant_id = str(request.user.tenant_id)
        if user_tenant_id != tenant:
            raise PermissionDenied(
                "You do not have permission to access this tenant's data."
            )

    return tenant


# /api/analytics/dashboard/


class DashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant_id = get_tenant_id(request)

        # Optional time range (default = last 30 days)
        end_date = request.query_params.get("end_date")
        start_date = request.query_params.get("start_date")

        today = timezone.localdate()
        if not end_date:
            end_date = today
        else:
            end_date = datetime.date.fromisoformat(end_date)

        if not start_date:
            start_date = end_date - datetime.timedelta(days=30)

        else:
            start_date = datetime.date.fromisoformat(start_date)

        # Pull last available rollups
        sales_qs = AnalyticsDailySales.objects.filter(
            tenant_id=tenant_id, date__range=[start_date, end_date]
        ).order_by("date")
        stock_qs = AnalyticsDailyStock.objects.filter(
            tenant_id=tenant_id, date__range=[start_date, end_date]
        ).order_by("date")

        # Aggregate KPIs
        total_stock = stock_qs.aggregate(total=Sum("total_stock"))["total"] or 0
        low_stock_count = stock_qs.aggregate(total=Sum("low_stock_count"))["total"] or 0
        stockout_count = stock_qs.aggregate(total=Sum("stockout_count"))["total"] or 0
        sales_count = sales_qs.aggregate(total=Sum("total_orders"))["total"] or 0
        revenue_total = sales_qs.aggregate(total=Sum("total_revenue"))[
            "total"
        ] or Decimal("0.00")

        # Get last known top SKUs
        latest_sales = sales_qs.last()
        top_skus = latest_sales.top_skus if latest_sales else []

        # Prepare trends
        revenue_trend = [{"date": r.date, "value": r.total_revenue} for r in sales_qs]
        stock_trend = [{"date": s.date, "value": s.total_stock} for s in stock_qs]

        data = {
            "stock_total": total_stock,
            "low_stock_count": low_stock_count,
            "stockout_count": stockout_count,
            "sales_count": sales_count,
            "revenue_total": revenue_total,
            "top_skus": top_skus,
            "revenue_trend": revenue_trend,
            "stock_trend": stock_trend,
        }

        serializer = DashboardAnalyticsSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# /api/analytics/sales/


class SalesAnalyticsListView(generics.ListAPIView):
    """
    Returns aggregated daily sales data for the tenant.
    Supports ?start_date, ?end_date
    """

    permission_classes = [IsAuthenticated]
    serializer_class = AnalyticsDailySalesSerializer

    def get_queryset(self):
        tenant_id = get_tenant_id(self.request)
        start_date = self.request.query_params.get("start_date")
        end_date = self.request.query_params.get("end_date")

        today = timezone.localdate()
        if not end_date:
            end_date = today
        else:
            end_date = datetime.date.fromisoformat(end_date)

        if not start_date:
            start_date = end_date - datetime.timedelta(days=30)
        else:
            start_date = datetime.date.fromisoformat(start_date)

        return AnalyticsDailySales.objects.filter(
            tenant_id=tenant_id, date__range=[start_date, end_date]
        ).order_by("date")


# /api/analytics/stock/


class StockAnalyticsListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = AnalyticsDailyStockSerializer

    def get_queryset(self):
        tenant_id = get_tenant_id(self.request)
        start_date = self.request.query_params.get("start_date")
        end_date = self.request.query_params.get("end_date")

        today = timezone.localdate()

        if not end_date:
            end_date = today
        else:
            end_date = datetime.date.fromisoformat(end_date)

        if not start_date:
            start_date = end_date - datetime.timedelta(days=30)
        else:
            start_date = datetime.date.fromisoformat(start_date)

        return AnalyticsDailyStock.objects.filter(
            tenant_id=tenant_id, date__range=[start_date, end_date]
        ).order_by("date")


# /api/analytics/stockouts/


class StockoutIncidentListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = StockoutIncidentSerializer

    def get_queryset(self):
        tenant_id = get_tenant_id(self.request)
        start_date = self.request.query_params.get("start_date")
        end_date = self.request.query_params.get("end_date")

        today = timezone.localdate()
        if not end_date:
            end_date = today

        else:
            end_date = datetime.date.fromisoformat(end_date)

        if not start_date:
            start_date = end_date - datetime.timedelta(days=30)
        else:
            start_date = datetime.date.fromisoformat(start_date)

        return StockoutIncident.objects.filter(
            tenant_id=tenant_id, incident_date__range=[start_date, end_date]
        ).order_by("-incident_date")


# /api/analytics/export/


class AnalyticsExportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant_id = get_tenant_id(request)
        metric = request.query_params.get("metric")
        if not metric:
            raise ValidationError("Missing required query param: metric")

        # date filters
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")
        today = timezone.localdate()
        if not end_date:
            end_date = today
        else:
            end_date = datetime.date.fromisoformat(end_date)

        if not start_date:
            start_date = end_date - datetime.timedelta(days=30)
        else:
            start_date = datetime.date.fromisoformat(start_date)

        # Determine queryset
        if metric == "sales":
            qs = AnalyticsDailySales.objects.filter(
                tenant_id=tenant_id, date__range=[start_date, end_date]
            ).order_by("date")
            fields = ["date", "total_orders", "total_items", "total_revenue"]
        elif metric == "stock":
            qs = AnalyticsDailyStock.objects.filter(
                tenant_id=tenant_id, date__range=[start_date, end_date]
            ).order_by("date")
            fields = ["date", "total_stock", "low_stock_count", "stockout_count"]
        elif metric == "stockouts":
            qs = StockoutIncident.objects.filter(
                tenant_id=tenant_id, incident_date__range=[start_date, end_date]
            ).order_by("incident_date")
            fields = ["incident_date", "sku_name", "note", "order_id"]
        else:
            raise ValidationError("Unsupported metric type")

        # generate csv in-memory
        csv_buffer = io.StringIO()
        writer = csv.writer(csv_buffer)
        writer.writerow(fields)
        for obj in qs:
            row = [getattr(obj, f) for f in fields]
            writer.writerow(row)

        csv_buffer.seek(0)
        response = StreamingHttpResponse(csv_buffer, content_type="text/csv")
        filename = f"analytics_{metric}_{start_date}_to{end_date}.csv"
        response["Content-Disposition"] = f"attachment; filename='{filename}'"
        return response


class SalesAnalyticsViewSet(SalesAnalyticsListView, viewsets.ReadOnlyModelViewSet):
    """Router-compatible wrapper for /api/analytics/sales/"""

    pass


class StockAnalyticsViewSet(StockAnalyticsListView, viewsets.ReadOnlyModelViewSet):
    """Router-compatible wrapper for /api/analytics/stock/"""

    pass


class StockoutIncidentViewSet(StockoutIncidentListView, viewsets.ReadOnlyModelViewSet):
    """Router-compatible wrapper for /api/analytics/stockouts/"""

    pass
