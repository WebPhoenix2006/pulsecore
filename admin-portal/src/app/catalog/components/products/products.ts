// catalog/pages/products/products.component.ts
import { Component, signal, OnInit, ViewChild } from '@angular/core';
import { TableConfig, TableData } from '../../../interfaces/table-config.interface';
import { productTableConfig } from '../../config/product-table.config';
import { ReusableDataTable } from '../../../shared/components/reusable-data-table/reusable-data-table';
import {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  PaginatedResponse,
} from '../../../interfaces/product.interface';
import { ToastService } from '../../../shared/services/toast.service';
import { CategoryService } from '../../services/category';
import { Category } from '../../../interfaces/category.interface';
import { ProductService } from '../../services/product';
import { DataTableHelperService } from '../../../shared/services/data-table-helper.service';

@Component({
  selector: 'app-products',
  standalone: false,
  templateUrl: './products.html',
  styleUrl: './products.scss',
})
export class Products implements OnInit {
  @ViewChild(ReusableDataTable) dataTable!: ReusableDataTable;

  tableConfig: TableConfig = productTableConfig;
  products = signal<Product[]>([]);
  categories: Category[] = [];
  loading = signal(false);

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private toastService: ToastService,
    private dataTableHelper: DataTableHelperService
  ) {}

  ngOnInit() {
    this.loadCategories();
    this.loadProducts();
  }

  private loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (response: PaginatedResponse<Category>) => {
        this.categories = response.results;
        const categoryField = this.tableConfig.formFields.find((f) => f.field === 'category');
        if (categoryField) {
          categoryField.options = this.categories.map((c) => ({
            value: c.id,
            label: c.name,
          }));
        }
      },
      error: () => this.toastService.showError('Failed to load categories'),
    });
  }

  private loadProducts() {
    this.loading.set(true);
    this.productService.getProducts().subscribe({
      next: (response: PaginatedResponse<Product>) => {
        // Transform the paginated response
        const transformedResponse = this.dataTableHelper.transformPaginatedResponse(response);

        // Enrich product data with category names and formatted values
        const enrichedProducts = this.dataTableHelper.enrichProductData(
          transformedResponse.data,
          this.categories
        );

        this.products.set(enrichedProducts);
        this.loading.set(false);

        // Log the response structure for debugging
        console.log('Products API Response:', {
          totalRecords: transformedResponse.totalRecords,
          hasNext: transformedResponse.hasNext,
          hasPrevious: transformedResponse.hasPrevious,
          sampleData: enrichedProducts.slice(0, 2) // First 2 items for inspection
        });
      },
      error: (error) => {
        console.error('Failed to load products:', error);
        this.toastService.showError('Failed to load products');
        this.loading.set(false);
      },
    });
  }

  onCreateProduct(data: TableData) {
    this.loading.set(true);

    // Validate required fields
    const validation = this.dataTableHelper.validateRequiredFields(data, ['name', 'price']);
    if (!validation.isValid) {
      this.toastService.showError(`Missing required fields: ${validation.missingFields.join(', ')}`);
      this.dataTable.onOperationError();
      this.loading.set(false);
      return;
    }

    // Transform form data for API
    const payload: CreateProductRequest = this.dataTableHelper.transformFormDataForApi(data, [
      'category_name', 'created_at', 'updated_at', 'sku_id' // Exclude computed/readonly fields
    ]);

    console.log('Creating product with payload:', payload);

    this.productService.createProduct(payload).subscribe({
      next: (created: Product) => {
        // Enrich the created product with category name
        const enrichedCreated = {
          ...created,
          category_name: this.categories.find(c => c.id === created.category)?.name || '—'
        };

        this.products.update((p) => [...p, enrichedCreated]);
        this.dataTable.onOperationSuccess();
        this.toastService.showSuccess('Product created successfully!');
        this.loading.set(false);
        console.log('Product created:', enrichedCreated);
      },
      error: (error) => {
        console.error('Failed to create product:', error);
        this.toastService.showError(`Failed to create product: ${error.error?.message || error.message}`);
        this.dataTable.onOperationError();
        this.loading.set(false);
      },
    });
  }

  onEditProduct(event: { id: string; data: TableData }) {
    this.loading.set(true);

    // Transform form data for API, excluding computed/readonly fields
    const updateData: UpdateProductRequest = this.dataTableHelper.transformFormDataForApi(event.data, [
      'category_name', 'created_at', 'updated_at', 'sku_id' // Exclude computed/readonly fields
    ]);

    console.log('Updating product with ID:', event.id, 'Data:', updateData);

    this.productService.updateProduct(event.id, updateData).subscribe({
      next: (updated: Product) => {
        // Enrich the updated product with category name
        const enrichedUpdated = {
          ...updated,
          category_name: this.categories.find(c => c.id === updated.category)?.name || '—'
        };

        this.products.update((p) => p.map((prod) => (prod.sku_id === event.id ? enrichedUpdated : prod)));
        this.dataTable.onOperationSuccess();
        this.toastService.showSuccess('Product updated successfully!');
        this.loading.set(false);
        console.log('Product updated:', enrichedUpdated);
      },
      error: (error) => {
        console.error('Failed to update product:', error);
        this.toastService.showError(`Failed to update product: ${error.error?.message || error.message}`);
        this.dataTable.onOperationError();
        this.loading.set(false);
      },
    });
  }

  onDeleteProduct(id: string) {
    this.loading.set(true);
    console.log('Deleting product with ID:', id);

    this.productService.deleteProduct(id).subscribe({
      next: () => {
        this.products.update((p) => p.filter((prod) => prod.sku_id !== id));
        this.toastService.showSuccess('Product deleted successfully!');
        this.loading.set(false);
        console.log('Product deleted successfully:', id);
      },
      error: (error) => {
        console.error('Failed to delete product:', error);
        this.toastService.showError(`Failed to delete product: ${error.error?.message || error.message}`);
        this.loading.set(false);
      },
    });
  }

  onViewProduct(product: TableData) {
    this.toastService.showInfo(`Viewing details for ${product['name']}`);
  }

  onCustomAction(event: { action: string; item: TableData }) {
    this.toastService.showInfo(`Custom action: ${event.action}`);
  }
}
