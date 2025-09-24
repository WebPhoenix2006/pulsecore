import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category, CreateCategoryRequest, UpdateCategoryRequest, PaginatedResponse } from '../../interfaces/category.interface';
import { Environments } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  constructor(private http: HttpClient) {}

  // Headers are now handled by the interceptor

  // Get all categories with pagination
  getCategories(page: number = 1, pageSize: number = 10, search?: string): Observable<PaginatedResponse<Category>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString());

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<PaginatedResponse<Category>>(Environments.catalog.categories, {
      params
    });
  }

  // Get single category by ID
  getCategory(id: number): Observable<Category> {
    return this.http.get<Category>(`${Environments.catalog.categories}${id}/`);
  }

  // Create new category
  createCategory(categoryData: CreateCategoryRequest): Observable<Category> {
    return this.http.post<Category>(Environments.catalog.categories, categoryData);
  }

  // Update category
  updateCategory(id: number, categoryData: UpdateCategoryRequest): Observable<Category> {
    return this.http.patch<Category>(`${Environments.catalog.categories}${id}/`, categoryData);
  }

  // Delete category
  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${Environments.catalog.categories}${id}/`);
  }
}
