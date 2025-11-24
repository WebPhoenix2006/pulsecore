import { Component, OnInit, OnDestroy, NgZone, ChangeDetectorRef } from '@angular/core';
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

  // New: selected period for UI tabs
  selectedPeriod: 'month' | '6months' | 'year' | 'custom' = 'month';

  // Chart configurations
  revenueChartData?: ChartConfiguration<'line'>['data'];
  revenueChartOptions?: ChartConfiguration<'line'>['options'];

  stockChartData?: ChartConfiguration<'line'>['data'];
  stockChartOptions?: ChartConfiguration<'line'>['options'];

  topSKUsChartData?: ChartConfiguration<'bar'>['data'];
  topSKUsChartOptions?: ChartConfiguration<'bar'>['options'];

  private destroy$ = new Subject<void>();

  constructor(private analyticsService: AnalyticsService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Initialize charts with empty data immediately
    this.initializeEmptyCharts();

    // Set default date range to last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    this.dateRange = {
      start_date: this.formatDate(thirtyDaysAgo),
      end_date: this.formatDate(today),
    };

    this.loadDashboard();
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // New: select time period tabs and reload dashboard
  selectTimePeriod(period: 'month' | '6months' | 'year' | 'custom') {
    this.selectedPeriod = period;
    const today = new Date();
    let start = new Date();

    switch (period) {
      case 'month':
        start.setDate(today.getDate() - 30);
        break;
      case '6months':
        start.setMonth(today.getMonth() - 6);
        break;
      case 'year':
        start = new Date(today.getFullYear(), 0, 1);
        break;
      case 'custom':
        // keep current dateRange (user will pick)
        this.loadDashboard();
        return;
    }

    this.dateRange = {
      start_date: this.formatDate(start),
      end_date: this.formatDate(today),
    };

    this.loadDashboard();
  }

  // New: utility to format numbers with thousand separators
  formatNumber(value: number | string | null | undefined, decimals = 0): string {
    if (value === null || value === undefined || value === '') return '0';
    const num = Number(value);
    if (isNaN(num)) return String(value);
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
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
          this.cdr.detectChanges();
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
    // Generate default dates if no data available
    let revenueDates: string[];
    let revenueValues: number[];

    if (this.dashboardData.revenue_trend && this.dashboardData.revenue_trend.length > 0) {
      revenueDates = this.dashboardData.revenue_trend.map((t) =>
        new Date(t.date).toLocaleDateString()
      );
      revenueValues = this.dashboardData.revenue_trend.map((t) =>
        typeof t.value === 'string' ? parseFloat(t.value) : t.value
      );
    } else {
      // Generate placeholder data for empty state
      revenueDates = this.generateDefaultDates();
      revenueValues = new Array(revenueDates.length).fill(0);
    }

    this.revenueChartData = {
      labels: revenueDates,
      datasets: [
        {
          label: 'Revenue',
          data: revenueValues,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.2)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 3,
          pointBackgroundColor: '#6366f1',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
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
            callback: (value) => `₦${value}`,
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
    let stockDates: string[];
    let stockValues: number[];

    if (this.dashboardData.stock_trend && this.dashboardData.stock_trend.length > 0) {
      stockDates = this.dashboardData.stock_trend.map((t) => new Date(t.date).toLocaleDateString());
      stockValues = this.dashboardData.stock_trend.map((t) =>
        typeof t.value === 'string' ? parseFloat(t.value) : t.value
      );
    } else {
      // Generate placeholder data for empty state
      stockDates = this.generateDefaultDates();
      stockValues = new Array(stockDates.length).fill(0);
    }

    this.stockChartData = {
      labels: stockDates,
      datasets: [
        {
          label: 'Stock Level',
          data: stockValues,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 3,
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
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
    let topSKULabels: string[];
    let topSKUValues: number[];

    if (this.dashboardData.top_skus && this.dashboardData.top_skus.length > 0) {
      const topSKUs = this.dashboardData.top_skus.slice(0, 5); // Top 5
      topSKULabels = topSKUs.map((sku) => sku.sku_name);
      topSKUValues = topSKUs.map((sku) => sku.total_sold);
    } else {
      // Generate placeholder data for empty state
      topSKULabels = ['No Data', 'No Data', 'No Data', 'No Data', 'No Data'];
      topSKUValues = [0, 0, 0, 0, 0];
    }

    this.topSKUsChartData = {
      labels: topSKULabels,
      datasets: [
        {
          label: 'Units Sold',
          data: topSKUValues,
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

  private generateDefaultDates(count: number = 7): string[] {
    const dates: string[] = [];
    const today = new Date();

    for (let i = count - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dates.push(date.toLocaleDateString());
    }

    return dates;
  }

  private initializeEmptyCharts(): void {
    const defaultDates = this.generateDefaultDates();

    // Initialize Revenue Chart with empty data
    this.revenueChartData = {
      labels: defaultDates,
      datasets: [
        {
          label: 'Revenue',
          data: new Array(defaultDates.length).fill(0),
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 0,
          borderWidth: 2,
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
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
          },
          ticks: {
            callback: (value) => `₦${value}`,
          },
        },
        x: {
          grid: {
            display: false,
          },
        },
      },
    };

    // Initialize Stock Chart with empty data
    this.stockChartData = {
      labels: defaultDates,
      datasets: [
        {
          label: 'Stock Level',
          data: new Array(defaultDates.length).fill(0),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 0,
          borderWidth: 2,
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

    // Initialize Top SKUs Chart with empty data
    this.topSKUsChartData = {
      labels: ['No Data', 'No Data', 'No Data', 'No Data', 'No Data'],
      datasets: [
        {
          label: 'Units Sold',
          data: [0, 0, 0, 0, 0],
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
