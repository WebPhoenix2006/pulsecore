import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  PaginatedResponse,
} from '../../interfaces/product.interface';
import { Environments } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private baseUrl = `${Environments.catalog.products}`;

  constructor(private http: HttpClient) {}

  getProducts(): Observable<PaginatedResponse<Product>> {
    return this.http.get<PaginatedResponse<Product>>(this.baseUrl);
  }

  createProduct(data: CreateProductRequest): Observable<Product> {
    return this.http.post<Product>(this.baseUrl, data);
  }

  updateProduct(id: string, data: UpdateProductRequest): Observable<Product> {
    return this.http.patch<Product>(`${this.baseUrl}${id}/`, data);
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}${id}/`);
  }
}
