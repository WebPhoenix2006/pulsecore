from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta
from .models import SKU, Batch, Alert


def create_alert_if_not_exists(tenant_id, sku, alert_type, defaults=None):
    """Helper to create alert if it doesn't already exist for this tenant + SKU + type"""
    Alert.objects.get_or_create(
        tenant_id=tenant_id, sku=sku, type=alert_type, defaults=defaults or {}
    )


# -----------------------
# Batch Expiry Alert
# -----------------------
@receiver(post_save, sender=Batch)
def batch_expiry_alert(sender, instance, **kwargs):
    if (
        instance.expiry_date
        and instance.expiry_date <= timezone.now().date() + timedelta(days=30)
    ):
        create_alert_if_not_exists(
            tenant_id=instance.tenant_id,
            sku=instance.sku,
            alert_type=Alert.Type.BATCH_EXPIRY,
            defaults={
                "sku_name": instance.sku.name,
                "current_stock": instance.remaining_quantity,
            },
        )


# -----------------------
# Low Stock Alert
# -----------------------
@receiver(post_save, sender=SKU)
def low_stock_alert(sender, instance, **kwargs):
    if (
        instance.reorder_threshold is not None
        and instance.stock_level <= instance.reorder_threshold
    ):
        create_alert_if_not_exists(
            tenant_id=instance.tenant_id,
            sku=instance,
            alert_type=Alert.Type.LOW_STOCK,
            defaults={
                "sku_name": instance.name,
                "current_stock": instance.stock_level,
                "threshold": instance.reorder_threshold,
            },
        )
