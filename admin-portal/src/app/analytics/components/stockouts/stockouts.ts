import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { AnalyticsService } from '../../services/analytics.service';
import { StockoutIncident, DateRangeFilter } from '../../interfaces/analytics.interface';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-stockouts',
  templateUrl: './stockouts.html',
  styleUrls: ['./stockouts.scss'],
  standalone: false,
})
export class Stockouts implements OnInit, OnDestroy {
  stockouts: StockoutIncident[] = [];
  loading = true;
  error: string | null = null;
  dateRange: DateRangeFilter = {};

  private destroy$ = new Subject<void>();

  constructor(private analyticsService: AnalyticsService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadStockouts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStockouts(): void {
    this.loading = true;
    this.error = null;

    this.analyticsService
      .getStockouts(this.dateRange)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.stockouts = response.results || (response as any);
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = 'Failed to load stockout incidents';
          this.loading = false;
          console.error('Stockouts error:', err);
        },
      });
  }

  onDateRangeChange(): void {
    this.loadStockouts();
  }

  exportData(): void {
    this.analyticsService
      .exportData({
        metric: 'stockouts',
        ...this.dateRange,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `stockouts_${new Date().toISOString().split('T')[0]}.csv`;
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
