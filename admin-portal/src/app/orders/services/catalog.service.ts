import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Environments } from '../../../environments/environment';

export interface Category {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category_id: string;
  category?: Category;
  sku: string;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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

  // Categories
  getCategories(): Observable<PaginatedResponse<Category>> {
    return this.http.get<PaginatedResponse<Category>>(Environments.catalog.categories);
  }

  getCategory(id: string): Observable<Category> {
    return this.http.get<Category>(`${Environments.catalog.categories}${id}/`);
  }

  // Products
  getProducts(): Observable<PaginatedResponse<Product>> {
    return this.http.get<PaginatedResponse<Product>>(Environments.catalog.products);
  }

  getProduct(id: string): Observable<Product> {
    return this.http.get<Product>(`${Environments.catalog.products}${id}/`);
  }

  getProductsByCategory(categoryId: string): Observable<PaginatedResponse<Product>> {
    return this.http.get<PaginatedResponse<Product>>(
      `${Environments.catalog.products}?category=${categoryId}`
    );
  }

  searchProducts(query: string): Observable<PaginatedResponse<Product>> {
    return this.http.get<PaginatedResponse<Product>>(
      `${Environments.catalog.products}?search=${query}`
    );
  }
}