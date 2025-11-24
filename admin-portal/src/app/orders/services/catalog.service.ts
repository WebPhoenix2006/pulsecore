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

// Backend product structure from /catalog/products/
export interface ProductResponse {
  sku_id: string;
  tenant_id: string;
  inventory_sku?: string; // ID of linked inventory SKU
  name: string;
  category?: string;
  attributes?: any;
  barcode?: string;
  price: string | number; // Catalog has price as direct field
  stock_quantity?: number; // From linked inventory_sku
  sku_code?: string; // From linked inventory_sku
  supplier_id?: string;
  batch_number?: string;
  expiry_date?: string;
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
      category: product.category,
      price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
      stock_quantity: product.stock_quantity ?? 0, // From linked inventory_sku
      sku: product.sku_code, // From linked inventory_sku
      barcode: product.barcode,
      inventory_sku: product.inventory_sku, // Link to inventory SKU
      supplier_id: product.supplier_id,
      batch_number: product.batch_number,
      expiry_date: product.expiry_date,
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

  // Products - Fetch from catalog products endpoint and enrich with inventory data
  getProducts(): Observable<PaginatedResponse<Product>> {
    return this.http.get<PaginatedResponse<ProductResponse>>(Environments.catalog.products)
      .pipe(
        map(response => ({
          ...response,
          results: response.results.map(p => this.transformProduct(p))
        }))
      );
  }

  // Get products with inventory stock levels
  getProductsWithStock(): Observable<PaginatedResponse<Product>> {
    return this.http.get<PaginatedResponse<any>>(Environments.inventory.skus)
      .pipe(
        map(response => ({
          ...response,
          results: response.results.map((sku: any) => ({
            id: sku.sku_id,
            sku_id: sku.sku_id,
            tenant_id: sku.tenant_id,
            name: sku.name,
            category: sku.category,
            price: sku.attributes?.price || 0,
            stock_quantity: sku.stock_level ?? 0,
            barcode: sku.barcode,
            supplier_id: sku.supplier_id,
            attributes: sku.attributes,
            created_at: sku.created_at,
            updated_at: sku.updated_at
          }))
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