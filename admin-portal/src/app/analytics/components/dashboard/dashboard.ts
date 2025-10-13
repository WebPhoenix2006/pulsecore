import { Component, OnInit, OnDestroy } from '@angular/core';
import { AnalyticsService } from '../../services/analytics.service';
import { DashboardData, DateRangeFilter } from '../../interfaces/analytics.interface';
import { Subject, takeUntil } from 'rxjs';
import { ChartConfiguration } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
  standalone: false,
})
export class Dashboard implements OnInit, OnDestroy {
  dashboardData?: DashboardData;
  loading = true;
  error: string | null = null;
  dateRange: DateRangeFilter = {};

  // Chart configurations
  revenueChartData?: ChartConfiguration<'line'>['data'];
  revenueChartOptions?: ChartConfiguration<'line'>['options'];

  stockChartData?: ChartConfiguration<'line'>['data'];
  stockChartOptions?: ChartConfiguration<'line'>['options'];

  topSKUsChartData?: ChartConfiguration<'bar'>['data'];
  topSKUsChartOptions?: ChartConfiguration<'bar'>['options'];

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

    this.loadDashboard();
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboard(): void {
    this.loading = true;
    this.error = null;

    this.analyticsService
      .getDashboard(this.dateRange)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.dashboardData = data;
          this.initializeCharts();
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load dashboard data';
          this.loading = false;
          console.error('Dashboard error:', err);
        },
      });
  }

  onDateRangeChange(): void {
    this.loadDashboard();
  }

  initializeCharts(): void {
    if (!this.dashboardData) return;

    // Revenue Trend Chart
    const revenueDates = this.dashboardData.revenue_trend.map((t) =>
      new Date(t.date).toLocaleDateString()
    );
    const revenueValues = this.dashboardData.revenue_trend.map((t) =>
      typeof t.value === 'string' ? parseFloat(t.value) : t.value
    );

    this.revenueChartData = {
      labels: revenueDates,
      datasets: [
        {
          label: 'Revenue',
          data: revenueValues,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#6366f1',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };

    this.revenueChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: '#6366f1',
          borderWidth: 1,
          displayColors: false,
          callbacks: {
            // label: (context) => `Revenue: $${context.parsed.y.toFixed(2)}`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
          },
          ticks: {
            callback: (value) => `$${value}`,
          },
        },
        x: {
          grid: {
            display: false,
          },
        },
      },
    };

    // Stock Trend Chart
    const stockDates = this.dashboardData.stock_trend.map((t) =>
      new Date(t.date).toLocaleDateString()
    );
    const stockValues = this.dashboardData.stock_trend.map((t) =>
      typeof t.value === 'string' ? parseFloat(t.value) : t.value
    );

    this.stockChartData = {
      labels: stockDates,
      datasets: [
        {
          label: 'Stock Level',
          data: stockValues,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };

    this.stockChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: '#10b981',
          borderWidth: 1,
          displayColors: false,
          callbacks: {
            label: (context) => `Stock: ${context.parsed.y} units`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
          },
        },
        x: {
          grid: {
            display: false,
          },
        },
      },
    };

    // Top SKUs Chart
    const topSKUs = this.dashboardData.top_skus.slice(0, 5); // Top 5
    this.topSKUsChartData = {
      labels: topSKUs.map((sku) => sku.sku_name),
      datasets: [
        {
          label: 'Units Sold',
          data: topSKUs.map((sku) => sku.total_sold),
          backgroundColor: ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'],
          borderRadius: 8,
        },
      ],
    };

    this.topSKUsChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: '#6366f1',
          borderWidth: 1,
          displayColors: false,
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
          },
        },
        y: {
          grid: {
            display: false,
          },
        },
      },
    };
  }

  exportData(metric: 'sales' | 'stock' | 'stockouts'): void {
    this.analyticsService
      .exportData({
        metric,
        ...this.dateRange,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `analytics_${metric}_${new Date().toISOString().split('T')[0]}.csv`;
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
