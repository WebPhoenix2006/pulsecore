import { Component, OnInit, OnDestroy } from '@angular/core';
import { AnalyticsService } from '../../services/analytics.service';
import { StockData, DateRangeFilter } from '../../interfaces/analytics.interface';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-stock',
  templateUrl: './stock.html',
  styleUrls: ['./stock.scss'],
  standalone: false,
})
export class Stock implements OnInit, OnDestroy {
  stockData: StockData[] = [];
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

    this.loadStock();
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStock(): void {
    this.loading = true;
    this.error = null;

    this.analyticsService
      .getStock(this.dateRange)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.stockData = response.results || (response as any);
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load stock data';
          this.loading = false;
          console.error('Stock error:', err);
        },
      });
  }

  onDateRangeChange(): void {
    this.loadStock();
  }

  exportData(): void {
    this.analyticsService
      .exportData({
        metric: 'stock',
        ...this.dateRange,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `stock_analytics_${new Date().toISOString().split('T')[0]}.csv`;
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
