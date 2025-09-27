import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  SKU,
  CreateSKURequest,
  UpdateSKURequest,
  StockAdjustmentRequest,
  Batch,
  CreateBatchRequest,
} from '../../interfaces/sku.interface';
import { PaginatedResponse } from '../../interfaces/product.interface';
import { Environments } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SKUService {
  private baseUrl = Environments.inventory.skus;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'X-Tenant-ID': this.getTenantId(),
      'Content-Type': 'application/json',
    });
  }

  private getTenantId(): string {
    // TODO: Get tenant ID from auth service or local storage
    return 'tenant-uuid-placeholder';
  }

  getSKUs(): Observable<PaginatedResponse<SKU>> {
    return this.http.get<PaginatedResponse<SKU>>(this.baseUrl, { headers: this.getHeaders() });
  }

  getSKU(skuId: string): Observable<SKU> {
    return this.http.get<SKU>(`${this.baseUrl}${skuId}/`, { headers: this.getHeaders() });
  }

  createSKU(data: CreateSKURequest): Observable<SKU> {
    return this.http.post<SKU>(this.baseUrl, data, { headers: this.getHeaders() });
  }

  updateSKU(skuId: string, data: UpdateSKURequest): Observable<SKU> {
    return this.http.put<SKU>(`${this.baseUrl}${skuId}/`, data, { headers: this.getHeaders() });
  }

  deleteSKU(skuId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}${skuId}/`, { headers: this.getHeaders() });
  }

  adjustStock(skuId: string, adjustment: StockAdjustmentRequest): Observable<SKU> {
    return this.http.post<SKU>(
      `${this.baseUrl}${skuId}/stock-adjustments/`,
      adjustment,
      { headers: this.getHeaders() }
    );
  }

  getBatches(skuId: string): Observable<Batch[]> {
    return this.http.get<Batch[]>(
      `${this.baseUrl}${skuId}/batches/`,
      { headers: this.getHeaders() }
    );
  }

  createBatch(skuId: string, batch: CreateBatchRequest): Observable<Batch> {
    return this.http.post<Batch>(
      `${this.baseUrl}${skuId}/batches/`,
      batch,
      { headers: this.getHeaders() }
    );
  }
}