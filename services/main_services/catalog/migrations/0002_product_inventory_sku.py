# Generated manually

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0006_remove_sku_price_alter_sku_sku_code'),
        ('catalog', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='inventory_sku',
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='catalog_product',
                to='inventory.sku',
                help_text='Select the inventory SKU that tracks stock for this product'
            ),
        ),
    ]
