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
    private toastService: ToastService
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
        const enriched: Product[] = response.results.map((prod) => ({
          ...prod,
          category_name: this.categories.find((c) => c.id === prod.category)?.name || '—',
        }));
        this.products.set(enriched);
        this.loading.set(false);
      },
      error: () => {
        this.toastService.showError('Failed to load products');
        this.loading.set(false);
      },
    });
  }

  onCreateProduct(data: TableData) {
    this.loading.set(true);
    const payload: CreateProductRequest = {
      name: data['name'],
      category: data['category'] || undefined,
      price: data['price'],
      barcode: data['barcode'] || undefined,
      batch_number: data['batch_number'] || undefined,
      expiry_date: data['expiry_date'] || undefined,
    };

    this.productService.createProduct(payload).subscribe({
      next: (created: Product) => {
        this.products.update((p) => [...p, created]);
        this.dataTable.onOperationSuccess();
        this.toastService.showSuccess('Product created successfully!');
        this.loading.set(false);
      },
      error: () => {
        this.toastService.showError('Failed to create product');
        this.dataTable.onOperationError();
        this.loading.set(false);
      },
    });
  }

  onEditProduct(event: { id: string; data: TableData }) {
    this.loading.set(true);
    const updateData: UpdateProductRequest = {
      name: event.data['name'],
      category: event.data['category'] || undefined,
      price: event.data['price'],
      barcode: event.data['barcode'] || undefined,
      batch_number: event.data['batch_number'] || undefined,
      expiry_date: event.data['expiry_date'] || undefined,
    };

    this.productService.updateProduct(event.id, updateData).subscribe({
      next: (updated: Product) => {
        this.products.update((p) => p.map((prod) => (prod.sku_id === event.id ? updated : prod)));
        this.dataTable.onOperationSuccess();
        this.toastService.showSuccess('Product updated successfully!');
        this.loading.set(false);
      },
      error: () => {
        this.toastService.showError('Failed to update product');
        this.dataTable.onOperationError();
        this.loading.set(false);
      },
    });
  }

  onDeleteProduct(id: string) {
    this.loading.set(true);
    this.productService.deleteProduct(id).subscribe({
      next: () => {
        this.products.update((p) => p.filter((prod) => prod.sku_id !== id));
        this.toastService.showSuccess('Product deleted successfully!');
        this.loading.set(false);
      },
      error: () => {
        this.toastService.showError('Failed to delete product');
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
