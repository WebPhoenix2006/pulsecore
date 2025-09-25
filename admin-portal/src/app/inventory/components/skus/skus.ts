import { Component, signal, OnInit, ViewChild } from '@angular/core';
import { TableConfig, TableData } from '../../../interfaces/table-config.interface';
import { ReusableDataTable } from '../../../shared/components/reusable-data-table/reusable-data-table';
import { ToastService } from '../../../shared/services/toast.service';
import { SKU, CreateSKURequest, UpdateSKURequest } from '../../../interfaces/sku.interface';
import { SKUService } from '../../services/sku.service';
import { skuTableConfig } from '../../config/sku-table.config';
import { PaginatedResponse } from '../../../interfaces/product.interface';
import { CategoryService } from '../../../catalog/services/category';
import { Category } from '../../../interfaces/category.interface';

@Component({
  selector: 'app-skus',
  standalone: false,
  templateUrl: './skus.html',
  styleUrl: './skus.scss',
})
export class Skus implements OnInit {
  @ViewChild(ReusableDataTable) dataTable!: ReusableDataTable;

  tableConfig: TableConfig = skuTableConfig;
  skus = signal<SKU[]>([]);
  categories: Category[] = [];
  loading = signal(false);

  constructor(
    private skuService: SKUService,
    private categoryService: CategoryService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadCategories();
    this.loadSKUs();
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

  private loadSKUs() {
    this.loading.set(true);
    this.skuService.getSKUs().subscribe({
      next: (response: PaginatedResponse<SKU>) => {
        const enriched: SKU[] = response.results.map((sku) => ({
          ...sku,
          category_name: this.categories.find((c) => c.id === sku.category)?.name || '—',
        }));
        this.skus.set(enriched);
        this.loading.set(false);
      },
      error: () => {
        this.toastService.showError('Failed to load SKUs');
        this.loading.set(false);
      },
    });
  }

  onCreateSku(data: TableData) {
    this.loading.set(true);
    const payload: CreateSKURequest = {
      name: data['name'],
      sku_code: data['sku_code'] || null,
      category: data['category'],
      barcode: data['barcode'] || null,
      price: Number(data['price']),
      stock_level: Number(data['stock_level']),
      supplier_id: data['supplier_id'] || null,
      reorder_threshold: data['reorder_threshold'] || null,
      track_batches: data['track_batches'] || false,
    };

    this.skuService.createSKU(payload).subscribe({
      next: (created: SKU) => {
        // Enrich the created SKU with category name
        const enrichedCreated = {
          ...created,
          category_name: this.categories.find((c) => c.id === created.category)?.name || '—',
        };

        this.skus.update((s) => [...s, enrichedCreated]);
        this.dataTable.onOperationSuccess();
        this.toastService.showSuccess('SKU created successfully!');
        this.loading.set(false);
      },
      error: () => {
        this.toastService.showError('Failed to create SKU');
        this.dataTable.onOperationError();
        this.loading.set(false);
      },
    });
  }

  onEditSku(event: { id: string; data: TableData }) {
    this.loading.set(true);

    // Debug logging to check the ID
    console.log('SKU Edit event:', event);
    console.log('SKU Event ID:', event.id);

    const updateData: UpdateSKURequest = {
      name: event.data['name'],
      sku_code: event.data['sku_code'] || null,
      category: event.data['category'],
      barcode: event.data['barcode'] || null,
      price: Number(event.data['price']),
      stock_level: Number(event.data['stock_level']),
      supplier_id: event.data['supplier_id'] || null,
      reorder_threshold: event.data['reorder_threshold']
        ? Number(event.data['reorder_threshold'])
        : null,
      track_batches: !!event.data['track_batches'],
    };

    // Use the correct ID from the event
    const skuId = event.id;
    if (!skuId) {
      this.toastService.showError('SKU ID is missing');
      this.loading.set(false);
      return;
    }

    this.skuService.updateSKU(skuId, updateData).subscribe({
      next: (updated: SKU) => {
        // Enrich the updated SKU with category name
        const enrichedUpdated = {
          ...updated,
          category_name: this.categories.find((c) => c.id === updated.category)?.name || '—',
        };

        this.skus.update((s) => s.map((sku) => (sku.sku_id === skuId ? enrichedUpdated : sku)));
        this.dataTable.onOperationSuccess();
        this.toastService.showSuccess('SKU updated successfully!');
        this.loading.set(false);
      },
      error: () => {
        this.toastService.showError('Failed to update SKU');
        this.dataTable.onOperationError();
        this.loading.set(false);
      },
    });
  }

  onDeleteSku(id: string) {
    this.loading.set(true);
    this.skuService.deleteSKU(id).subscribe({
      next: () => {
        this.skus.update((s) => s.filter((sku) => sku.sku_id !== id));
        this.toastService.showSuccess('SKU deleted successfully!');
        this.loading.set(false);
      },
      error: () => {
        this.toastService.showError('Failed to delete SKU');
        this.loading.set(false);
      },
    });
  }

  onViewSku(sku: TableData) {
    this.toastService.showInfo(`Viewing details for SKU: ${sku['sku_code']}`);
  }

  onCustomAction(event: { action: string; item: TableData }) {
    const sku = event.item as SKU;

    switch (event.action) {
      case 'adjust-stock':
        this.adjustStock(sku.sku_id);
        break;
      case 'view-batches':
        this.viewBatches(sku.sku_id);
        break;
      default:
        this.toastService.showInfo(`Custom action: ${event.action}`);
    }
  }

  private adjustStock(skuId: string) {
    // TODO: Implement stock adjustment dialog
    this.toastService.showInfo('Stock adjustment feature coming soon!');
  }

  private viewBatches(skuId: string) {
    // TODO: Implement batch viewing
    this.toastService.showInfo('Batch viewing feature coming soon!');
  }
}
