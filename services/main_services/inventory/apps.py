from django.apps import AppConfig


class InventoryConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "main_services.inventory"


def ready(self):
    # Import signals
    import inventory.signals
