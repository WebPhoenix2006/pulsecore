from services.main_services.analytics.tasks import generate_daily_sales

generate_daily_sales.delay()
