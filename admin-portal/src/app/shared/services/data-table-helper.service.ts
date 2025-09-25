import { Injectable } from '@angular/core';
import { TableData } from '../../interfaces/table-config.interface';
import { PaginatedResponse } from '../../interfaces/product.interface';

@Injectable({
  providedIn: 'root'
})
export class DataTableHelperService {

  /**
   * Transforms a paginated API response to a format suitable for the data table
   */
  transformPaginatedResponse<T>(response: PaginatedResponse<T>): {
    data: T[],
    totalRecords: number,
    hasNext: boolean,
    hasPrevious: boolean
  } {
    return {
      data: response.results,
      totalRecords: response.count,
      hasNext: !!response.next,
      hasPrevious: !!response.previous
    };
  }

  /**
   * Formats dates for display in the table
   */
  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  }

  /**
   * Formats currency values for display
   */
  formatCurrency(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) return 'N/A';

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  /**
   * Enriches product data with category names
   */
  enrichProductData(products: any[], categories: any[]): any[] {
    return products.map(product => ({
      ...product,
      category_name: categories.find(cat => cat.id === product.category)?.name || '—',
      price_formatted: this.formatCurrency(product.price),
      expiry_date_formatted: this.formatDate(product.expiry_date),
      created_at_formatted: this.formatDate(product.created_at),
      updated_at_formatted: this.formatDate(product.updated_at)
    }));
  }

  /**
   * Enriches category data with formatted dates
   */
  enrichCategoryData(categories: any[]): any[] {
    return categories.map(category => ({
      ...category,
      created_at_formatted: this.formatDate(category.created_at),
      updated_at_formatted: this.formatDate(category.updated_at)
    }));
  }

  /**
   * Handles table form data transformation for API requests
   */
  transformFormDataForApi(formData: TableData, excludeFields: string[] = []): any {
    const apiData: any = {};

    Object.keys(formData).forEach(key => {
      if (!excludeFields.includes(key) && formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
        apiData[key] = formData[key];
      }
    });

    return apiData;
  }

  /**
   * Validates required fields in form data
   */
  validateRequiredFields(formData: TableData, requiredFields: string[]): { isValid: boolean, missingFields: string[] } {
    const missingFields = requiredFields.filter(field =>
      !formData[field] || formData[field] === '' || formData[field] === null || formData[field] === undefined
    );

    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  }

  /**
   * Creates a status badge configuration
   */
  createStatusBadge(value: string): { severity: string, value: string } {
    const statusConfig: { [key: string]: { severity: string, value: string } } = {
      'active': { severity: 'success', value: 'Active' },
      'inactive': { severity: 'secondary', value: 'Inactive' },
      'pending': { severity: 'warning', value: 'Pending' },
      'expired': { severity: 'danger', value: 'Expired' },
      'low_stock': { severity: 'warning', value: 'Low Stock' },
      'out_of_stock': { severity: 'danger', value: 'Out of Stock' },
      'in_stock': { severity: 'success', value: 'In Stock' }
    };

    return statusConfig[value?.toLowerCase()] || { severity: 'info', value: value || 'Unknown' };
  }
}