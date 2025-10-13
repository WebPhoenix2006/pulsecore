import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Environments } from '../../../environments/environment';
import {
  DashboardData,
  SalesData,
  StockData,
  StockoutIncident,
  PaginatedResponse,
  DateRangeFilter,
  ExportParams,
} from '../interfaces/analytics.interface';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  constructor(private http: HttpClient) {}

  getDashboard(filters?: DateRangeFilter): Observable<DashboardData> {
    let params = new HttpParams();
    if (filters?.start_date) {
      params = params.set('start_date', filters.start_date);
    }
    if (filters?.end_date) {
      params = params.set('end_date', filters.end_date);
    }
    return this.http.get<DashboardData>(Environments.analytics.dashboard, { params });
  }

  getSales(filters?: DateRangeFilter): Observable<PaginatedResponse<SalesData>> {
    let params = new HttpParams();
    if (filters?.start_date) {
      params = params.set('start_date', filters.start_date);
    }
    if (filters?.end_date) {
      params = params.set('end_date', filters.end_date);
    }
    return this.http.get<PaginatedResponse<SalesData>>(Environments.analytics.sales, { params });
  }

  getStock(filters?: DateRangeFilter): Observable<PaginatedResponse<StockData>> {
    let params = new HttpParams();
    if (filters?.start_date) {
      params = params.set('start_date', filters.start_date);
    }
    if (filters?.end_date) {
      params = params.set('end_date', filters.end_date);
    }
    return this.http.get<PaginatedResponse<StockData>>(Environments.analytics.stock, { params });
  }

  getStockouts(filters?: DateRangeFilter): Observable<PaginatedResponse<StockoutIncident>> {
    let params = new HttpParams();
    if (filters?.start_date) {
      params = params.set('start_date', filters.start_date);
    }
    if (filters?.end_date) {
      params = params.set('end_date', filters.end_date);
    }
    return this.http.get<PaginatedResponse<StockoutIncident>>(Environments.analytics.stockouts, {
      params,
    });
  }

  exportData(exportParams: ExportParams): Observable<Blob> {
    let params = new HttpParams().set('metric', exportParams.metric);
    if (exportParams.start_date) {
      params = params.set('start_date', exportParams.start_date);
    }
    if (exportParams.end_date) {
      params = params.set('end_date', exportParams.end_date);
    }
    return this.http.get(Environments.analytics.export, {
      params,
      responseType: 'blob',
    });
  }
}
