import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Alert,
  CreateAlertRequest,
  UpdateAlertRequest,
  AcknowledgeAlertRequest,
} from '../../interfaces/alert.interface';
import { PaginatedResponse } from '../../interfaces/product.interface';
import { Environments } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AlertService {
  private baseUrl = Environments.inventory.alerts;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'X-Tenant-ID': this.getTenantId(),
      'Content-Type': 'application/json',
    });
  }

  private getTenantId(): string {
    // TODO: Get tenant ID from auth service or local storage
    return '550e8400-e29b-41d4-a716-446655440000';
  }

  getAlerts(): Observable<Alert[]> {
    return this.http.get<Alert[]>(this.baseUrl, { headers: this.getHeaders() });
  }

  getAlert(alertId: string): Observable<Alert> {
    return this.http.get<Alert>(`${this.baseUrl}${alertId}/`, { headers: this.getHeaders() });
  }

  createAlert(data: CreateAlertRequest): Observable<Alert> {
    return this.http.post<Alert>(this.baseUrl, data, { headers: this.getHeaders() });
  }

  updateAlert(alertId: string, data: UpdateAlertRequest): Observable<Alert> {
    return this.http.put<Alert>(`${this.baseUrl}${alertId}/`, data, { headers: this.getHeaders() });
  }

  deleteAlert(alertId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}${alertId}/`, { headers: this.getHeaders() });
  }

  acknowledgeAlert(alertId: string, data: AcknowledgeAlertRequest): Observable<Alert> {
    return this.http.patch<Alert>(
      `${this.baseUrl}${alertId}/acknowledge/`,
      data,
      { headers: this.getHeaders() }
    );
  }

  dismissAlert(alertId: string): Observable<void> {
    return this.http.patch<void>(
      `${this.baseUrl}${alertId}/dismiss/`,
      {},
      { headers: this.getHeaders() }
    );
  }

  // Get alerts by type
  getAlertsByType(type: 'low_stock' | 'batch_expiry'): Observable<Alert[]> {
    return this.http.get<Alert[]>(`${this.baseUrl}?type=${type}`, { headers: this.getHeaders() });
  }

  // Get unacknowledged alerts
  getUnacknowledgedAlerts(): Observable<Alert[]> {
    return this.http.get<Alert[]>(`${this.baseUrl}?acknowledged=false`, { headers: this.getHeaders() });
  }
}