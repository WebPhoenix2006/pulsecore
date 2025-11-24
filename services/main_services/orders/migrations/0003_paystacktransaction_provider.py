# Generated manually
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0002_alter_order_options'),
    ]

    operations = [
        migrations.AddField(
            model_name='paystacktransaction',
            name='provider',
            field=models.CharField(default='paystack', max_length=50),
        ),
    ]
