# Generated manually - adds inventory_sku field to Product model

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('catalog', '0001_initial'),
        ('inventory', '0006_remove_sku_price_alter_sku_sku_code'),
    ]

    operations = [
        # No changes to inventory.SKU model - this adds field to catalog.Product instead
    ]
