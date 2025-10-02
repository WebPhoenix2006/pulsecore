import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Environments } from '../../../environments/environment';
import { Product } from '../../interfaces/product.interface';

// Re-export Product for convenience
export type { Product } from '../../interfaces/product.interface';

export interface Category {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

// Backend product structure
export interface ProductResponse {
  sku_id: string;
  tenant_id: string;
  name: string;
  description?: string;
  attributes?: any;
  barcode?: string;
  sku?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  constructor(private http: HttpClient) {}

  // Helper to transform backend product to frontend product
  private transformProduct(product: ProductResponse): Product {
    return {
      id: product.sku_id, // Use sku_id as the primary id
      sku_id: product.sku_id,
      tenant_id: product.tenant_id,
      name: product.name,
      description: product.description,
      price: product.attributes?.price || 0,
      stock_quantity: product.attributes?.stock_quantity ?? 999, // Default to 999 if not provided
      sku: product.sku,
      barcode: product.barcode,
      attributes: product.attributes,
      created_at: product.created_at,
      updated_at: product.updated_at
    };
  }

  // Categories
  getCategories(): Observable<PaginatedResponse<Category>> {
    return this.http.get<PaginatedResponse<Category>>(Environments.catalog.categories);
  }

  getCategory(id: string): Observable<Category> {
    return this.http.get<Category>(`${Environments.catalog.categories}${id}/`);
  }

  // Products
  getProducts(): Observable<PaginatedResponse<Product>> {
    return this.http.get<PaginatedResponse<ProductResponse>>(Environments.catalog.products)
      .pipe(
        map(response => ({
          ...response,
          results: response.results.map(p => this.transformProduct(p))
        }))
      );
  }

  getProduct(id: string): Observable<Product> {
    return this.http.get<ProductResponse>(`${Environments.catalog.products}${id}/`)
      .pipe(
        map(p => this.transformProduct(p))
      );
  }

  getProductsByCategory(categoryId: string): Observable<PaginatedResponse<Product>> {
    return this.http.get<PaginatedResponse<ProductResponse>>(
      `${Environments.catalog.products}?category=${categoryId}`
    ).pipe(
      map(response => ({
        ...response,
        results: response.results.map(p => this.transformProduct(p))
      }))
    );
  }

  searchProducts(query: string): Observable<PaginatedResponse<Product>> {
    return this.http.get<PaginatedResponse<ProductResponse>>(
      `${Environments.catalog.products}?search=${query}`
    ).pipe(
      map(response => ({
        ...response,
        results: response.results.map(p => this.transformProduct(p))
      }))
    );
  }
}