import { Component, OnInit, OnDestroy } from '@angular/core';
import { AnalyticsService } from '../../services/analytics.service';
import { SalesData, DateRangeFilter } from '../../interfaces/analytics.interface';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-sales',
  templateUrl: './sales.html',
  styleUrls: ['./sales.scss'],
  standalone: false,
})
export class Sales implements OnInit, OnDestroy {
  salesData: SalesData[] = [];
  loading = true;
  error: string | null = null;
  dateRange: DateRangeFilter = {};

  private destroy$ = new Subject<void>();

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit(): void {
    // Set default date range to last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    this.dateRange = {
      start_date: this.formatDate(thirtyDaysAgo),
      end_date: this.formatDate(today)
    };

    this.loadSales();
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSales(): void {
    this.loading = true;
    this.error = null;

    this.analyticsService
      .getSales(this.dateRange)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.salesData = response.results || (response as any);
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load sales data';
          this.loading = false;
          console.error('Sales error:', err);
        },
      });
  }

  onDateRangeChange(): void {
    this.loadSales();
  }

  exportData(): void {
    this.analyticsService
      .exportData({
        metric: 'sales',
        ...this.dateRange,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `sales_analytics_${new Date().toISOString().split('T')[0]}.csv`;
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: (err) => {
          console.error('Export error:', err);
          alert('Failed to export data');
        },
      });
  }
}
