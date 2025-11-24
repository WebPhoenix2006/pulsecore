from django.core.management.base import BaseCommand, CommandError
from django.db import connection, transaction
from django.apps import apps
from django.db.models import Sum, F, ExpressionWrapper, DecimalField, IntegerField, Q
from datetime import date, timedelta
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Backfill daily analytics for a date range (default last 365 days)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--days",
            type=int,
            default=365,
            help="Number of days to backfill (default: 365).",
        )
        parser.add_argument(
            "--start-date",
            type=str,
            help="Start date (YYYY-MM-DD). If provided, --days is ignored and command backfills from start-date to today.",
        )

    def handle(self, *args, **options):
        days = options["days"]
        start_date_opt = options.get("start_date")

        # --- CONFIG: adjust these names if your models/fields differ ---
        ORDERS_APP = "orders"
        INVENTORY_APP = "inventory"   # correct app label (was main_services.inventory)
        ORDER_MODEL = "Order"
        ORDER_ITEM_MODEL = "OrderItem"
        # Order.created_at (try common alternatives if your project uses another name)
        ORDER_DATE_FIELD = "created_at"
        # OrderItem: fields used for revenue calculation
        ORDERITEM_PRICE_FIELD = "price"
        ORDERITEM_QTY_FIELD = "quantity"
        # Inventory snapshot model (not present in your codebase) - leave as-is if you have one
        INVENTORY_SNAPSHOT_MODEL = "InventorySnapshot"
        # Fallback: use SKU model from inventory app
        INVENTORY_MODEL = "SKU"
        INVENTORY_QTY_FIELD = "stock_level"        # SKU.stock_level
        INVENTORY_REORDER_FIELD = "reorder_threshold"
        # -----------------------------------------------------------------

        # Resolve date range
        today = date.today()
        if start_date_opt:
            try:
                start = date.fromisoformat(start_date_opt)
            except Exception:
                raise CommandError("start-date must be YYYY-MM-DD")
            end = today
        else:
            start = today - timedelta(days=days - 1)
            end = today

        # Resolve models via apps
        try:
            Order = apps.get_model(ORDERS_APP, ORDER_MODEL)
        except LookupError:
            raise CommandError(
                f"Could not find model {ORDER_MODEL} in app '{ORDERS_APP}'. Adjust ORDER_MODEL/ORDERS_APP in the command file."
            )

        try:
            OrderItem = apps.get_model(ORDERS_APP, ORDER_ITEM_MODEL)
        except LookupError:
            raise CommandError(
                f"Could not find model {ORDER_ITEM_MODEL} in app '{ORDERS_APP}'. Adjust ORDER_ITEM_MODEL/ORDERS_APP in the command file."
            )

        # Auto-detect inventory snapshot / inventory models across installed apps
        InventorySnapshot = None
        Inventory = None
        use_snapshot = False

        # Fast path: try configured app first
        try:
            InventorySnapshot = apps.get_model(INVENTORY_APP, INVENTORY_SNAPSHOT_MODEL)
            use_snapshot = True
        except LookupError:
            try:
                Inventory = apps.get_model(INVENTORY_APP, INVENTORY_MODEL)
            except LookupError:
                # Fallback: scan all installed apps for likely inventory models
                for m in apps.get_models():
                    mn = m.__name__.lower()
                    if "inventory" in mn and "snapshot" in mn:
                        InventorySnapshot = m
                        use_snapshot = True
                        break

                if not InventorySnapshot:
                    for m in apps.get_models():
                        mn = m.__name__.lower()
                        if mn.startswith("inventory") or mn == "inventory":
                            Inventory = m
                            break

        if not InventorySnapshot and not Inventory:
            # Build a helpful list of candidate models for debugging
            candidates = []
            for m in apps.get_models():
                if (
                    "inventory" in m.__name__.lower()
                    or "inventory" in m._meta.app_label
                ):
                    candidates.append(f"{m._meta.app_label}.{m.__name__}")

            raise CommandError(
                f"Could not find inventory models. Checked '{INVENTORY_SNAPSHOT_MODEL}' and fallback '{INVENTORY_MODEL}' in app '{INVENTORY_APP}'. "
                f"Auto-scan candidates: {', '.join(candidates) or 'none'}. Adjust config in the command file."
            )

        self.stdout.write(
            self.style.NOTICE(f"Backfilling analytics from {start} to {end}")
        )
        created = 0
        updated = 0

        # Ensure analytics table exists (simple schema). If you already have a table, this will be noop.
        with connection.cursor() as cur:
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS analytics_daily (
                    day TEXT PRIMARY KEY,
                    revenue_total REAL,
                    sales_count INTEGER,
                    stock_total REAL,
                    low_stock_count INTEGER,
                    stockout_count INTEGER,
                    created_at TEXT,
                    updated_at TEXT
                )
                """
            )

        cur_date = start
        while cur_date <= end:
            # compute revenue_total using OrderItem join to Order via foreign key named 'order'
            order_date_filter = {f"order__{ORDER_DATE_FIELD}__date": cur_date}
            # Sum(price * qty)
            try:
                expr = ExpressionWrapper(
                    F(ORDERITEM_PRICE_FIELD) * F(ORDERITEM_QTY_FIELD),
                    output_field=DecimalField(max_digits=20, decimal_places=2),
                )
                revenue_agg = OrderItem.objects.filter(**order_date_filter).aggregate(
                    total=Sum(expr)
                )
                revenue_total = float(revenue_agg["total"] or 0)
            except Exception as e:
                raise CommandError(
                    f"Failed computing revenue. Check ORDERITEM_PRICE_FIELD / ORDERITEM_QTY_FIELD. Error: {e}"
                )

            # sales_count: orders on that date
            try:
                sales_filter = {f"{ORDER_DATE_FIELD}__date": cur_date}
                sales_count = Order.objects.filter(**sales_filter).count()
            except Exception as e:
                raise CommandError(
                    f"Failed computing sales_count. Check ORDER_DATE_FIELD. Error: {e}"
                )

            # Inventory: use SKU model from inventory app (no snapshot present)
            try:
                SKUModel = apps.get_model(INVENTORY_APP, INVENTORY_MODEL)
            except LookupError:
                candidates = [f"{m._meta.app_label}.{m.__name__}" for m in apps.get_models() if 'inventory' in m.__name__.lower() or 'inventory' in m._meta.app_label]
                raise CommandError(f"Could not find SKU model {INVENTORY_MODEL} in app '{INVENTORY_APP}'. Auto-scan candidates: {', '.join(candidates) or 'none'}. Adjust config in the command file.")
            
            try:
                # stock_total: sum of stock_level
                stock_total = SKUModel.objects.aggregate(total=Sum(INVENTORY_QTY_FIELD))["total"] or 0

                # low_stock_count: items with reorder_threshold set and stock_level <= reorder_threshold
                low_stock_q = Q(**{f"{INVENTORY_QTY_FIELD}__lte": F(INVENTORY_REORDER_FIELD)}) & Q(**{f"{INVENTORY_REORDER_FIELD}__isnull": False})
                low_stock_count = SKUModel.objects.filter(low_stock_q).count()

                # stockout_count: items with stock_level == 0
                stockout_count = SKUModel.objects.filter(**{f"{INVENTORY_QTY_FIELD}": 0}).count()
            except Exception as e:
                raise CommandError(f"Failed computing inventory metrics from SKU model. Adjust INVENTORY_MODEL/field names. Error: {e}")

            # Insert or update analytics_daily table
            with transaction.atomic():
                try:
                    with connection.cursor() as cur:
                        # SQLite-compatible upsert
                        cur.execute(
                            """
                            INSERT INTO analytics_daily (
                                day,
                                revenue_total,
                                sales_count,
                                stock_total,
                                low_stock_count,
                                stockout_count,
                                created_at,
                                updated_at
                            ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                            ON CONFLICT(day) DO UPDATE SET
                                revenue_total = excluded.revenue_total,
                                sales_count = excluded.sales_count,
                                stock_total = excluded.stock_total,
                                low_stock_count = excluded.low_stock_count,
                                stockout_count = excluded.stockout_count,
                                updated_at = CURRENT_TIMESTAMP
                            """,
                            [
                                cur_date.isoformat(),
                                revenue_total,
                                sales_count,
                                stock_total,
                                low_stock_count,
                                stockout_count,
                            ],
                        )
                except Exception as e:
                    raise CommandError(f"Failed upserting analytics data: {e}")

            cur_date += timedelta(days=1)

        self.stdout.write(self.style.SUCCESS("Backfill complete."))
