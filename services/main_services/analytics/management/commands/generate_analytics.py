from django.core.management.base import BaseCommand
from django.utils import timezone
from main_services.analytics.tasks import (
    generate_daily_sales,
    generate_daily_stock,
    generate_top_skus,
)


class Command(BaseCommand):
    help = 'Generate analytics data for a specific date'

    def add_arguments(self, parser):
        parser.add_argument(
            '--date',
            type=str,
            help='Date in YYYY-MM-DD format (default: today)',
        )

    def handle(self, *args, **options):
        date_str = options.get('date')
        if date_str:
            try:
                date = timezone.datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                self.stdout.write(
                    self.style.ERROR('Invalid date format. Use YYYY-MM-DD')
                )
                return
        else:
            date = timezone.localdate()

        self.stdout.write(f'Generating analytics for {date}...')

        try:
            # Run tasks synchronously
            self.stdout.write('  > Generating daily sales...')
            generate_daily_sales(date=date)

            self.stdout.write('  > Generating daily stock...')
            generate_daily_stock(date=date)

            self.stdout.write('  > Generating top SKUs...')
            generate_top_skus(date=date)

            self.stdout.write(
                self.style.SUCCESS(f'[SUCCESS] Analytics generated successfully for {date}')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'[ERROR] Error generating analytics: {str(e)}')
            )
            raise
