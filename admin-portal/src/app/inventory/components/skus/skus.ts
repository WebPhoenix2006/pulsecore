import { Component, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { TableColumn, TableAction } from '../../../shared/components/prime-data-table/prime-data-table';
import { ToastService } from '../../../shared/services/toast.service';
import { SKU, CreateSKURequest, UpdateSKURequest } from '../../../interfaces/sku.interface';
import { SKUService } from '../../services/sku.service';
import { PaginatedResponse } from '../../../interfaces/product.interface';
import { CategoryService } from '../../../catalog/services/category';
import { Category } from '../../../interfaces/category.interface';
import { FormFieldOption } from '../../../interfaces/form-field-options';

@Component({
  selector: 'app-skus',
  standalone: false,
  templateUrl: './skus.html',
  styleUrl: './skus.scss',
})
export class Skus implements OnInit {
  skus = signal<SKU[]>([]);
  categories: Category[] = [];
  loading = signal(false);
  selectedSkus: SKU[] = [];

  // Form properties
  modalVisible = false;
  viewModalVisible = false;
  adjustStockModalVisible = false;
  viewBatchesModalVisible = false;
  isEditMode = false;
  skuForm!: FormGroup;
  adjustStockForm!: FormGroup;
  currentSkuId: string | null = null;
  categoryOptions: FormFieldOption[] = [];
  selectedSku: SKU | null = null;
  batches: any[] = [];
  batchesLoading = false;

  adjustmentTypeOptions: FormFieldOption[] = [
    { label: 'Increase Stock', value: 'increase' },
    { label: 'Decrease Stock', value: 'decrease' },
    { label: 'Set Absolute Value', value: 'set' }
  ];

  tableColumns: TableColumn[] = [
    {
      field: 'sku_code',
      header: 'SKU Code',
      sortable: true,
      filterable: true,
      type: 'text',
      width: '15%'
    },
    {
      field: 'name',
      header: 'Product Name',
      sortable: true,
      filterable: true,
      type: 'text',
      width: '25%'
    },
    {
      field: 'category_name',
      header: 'Category',
      sortable: true,
      type: 'text',
      width: '15%'
    },
    {
      field: 'stock_level',
      header: 'Stock Level',
      sortable: true,
      type: 'text',
      width: '12%'
    },
    {
      field: 'reorder_threshold',
      header: 'Reorder Level',
      sortable: true,
      type: 'text',
      width: '12%'
    },
    {
      field: 'price',
      header: 'Price',
      sortable: true,
      type: 'text',
      width: '10%'
    },
    {
      field: 'barcode',
      header: 'Barcode',
      type: 'text',
      width: '11%'
    },
    {
      field: 'actions',
      header: 'Actions',
      type: 'actions',
      width: '120px'
    }
  ];

  tableActions: TableAction[] = [
    {
      label: 'View Details',
      value: 'view',
      icon: 'eye',
      iconPosition: 'left',
      action: (rowData) => this.onViewSku(rowData)
    },
    {
      label: 'Edit',
      value: 'edit',
      icon: 'edit',
      iconPosition: 'left',
      action: (rowData) => this.onEditSku(rowData)
    },
    {
      label: 'Delete',
      value: 'delete',
      icon: 'trash',
      iconPosition: 'left',
      action: (rowData) => this.onDeleteSku(rowData.sku_id)
    },
    {
      label: 'Adjust Stock',
      value: 'adjust-stock',
      icon: 'plus-minus',
      iconPosition: 'left',
      action: (rowData) => this.adjustStock(rowData.sku_id)
    },
    {
      label: 'View Batches',
      value: 'view-batches',
      icon: 'list',
      iconPosition: 'left',
      action: (rowData) => this.viewBatches(rowData.sku_id)
    }
  ];

  constructor(
    private skuService: SKUService,
    private categoryService: CategoryService,
    private toastService: ToastService,
    private fb: FormBuilder
  ) {
    this.initializeForm();
  }

  ngOnInit() {
    this.loadCategories();
    this.loadSKUs();
  }

  private loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (response: PaginatedResponse<Category>) => {
        this.categories = response.results;
        this.categoryOptions = this.categories.map(cat => ({
          label: cat.name,
          value: cat.id
        }));
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

  private initializeForm() {
    this.skuForm = this.fb.group({
      name: ['', [Validators.required]],
      skuCode: [''],
      category: ['', [Validators.required]],
      price: ['', [Validators.required, Validators.min(0)]],
      stockLevel: ['', [Validators.required, Validators.min(0)]],
      reorderThreshold: [''],
      barcode: [''],
      supplierId: [''],
      trackBatches: [false]
    });

    this.adjustStockForm = this.fb.group({
      adjustmentType: ['', [Validators.required]],
      quantity: ['', [Validators.required, Validators.min(1)]],
      reason: ['', [Validators.required]]
    });
  }

  // Form control getters
  get nameControl() { return this.skuForm.get('name') as FormControl; }
  get skuCodeControl() { return this.skuForm.get('skuCode') as FormControl; }
  get categoryControl() { return this.skuForm.get('category') as FormControl; }
  get priceControl() { return this.skuForm.get('price') as FormControl; }
  get stockLevelControl() { return this.skuForm.get('stockLevel') as FormControl; }
  get reorderThresholdControl() { return this.skuForm.get('reorderThreshold') as FormControl; }
  get barcodeControl() { return this.skuForm.get('barcode') as FormControl; }
  get supplierIdControl() { return this.skuForm.get('supplierId') as FormControl; }
  get trackBatchesControl() { return this.skuForm.get('trackBatches') as FormControl; }

  // Adjust Stock Form controls
  get adjustmentTypeControl() { return this.adjustStockForm.get('adjustmentType') as FormControl; }
  get quantityControl() { return this.adjustStockForm.get('quantity') as FormControl; }
  get reasonControl() { return this.adjustStockForm.get('reason') as FormControl; }

  onCreateSku() {
    this.isEditMode = false;
    this.currentSkuId = null;
    this.skuForm.reset();
    this.skuForm.patchValue({ trackBatches: false });
    this.modalVisible = true;
  }

  onEditSku(sku: SKU) {
    this.isEditMode = true;
    this.currentSkuId = sku.sku_id;
    this.skuForm.patchValue({
      name: sku.name,
      skuCode: sku.sku_code || '',
      category: sku.category?.toString() || '',
      price: sku.price,
      stockLevel: sku.stock_level,
      reorderThreshold: sku.reorder_threshold || '',
      barcode: sku.barcode || '',
      supplierId: sku.supplier_id || '',
      trackBatches: sku.track_batches
    });
    this.modalVisible = true;
  }

  onSubmitSku() {
    if (this.skuForm.invalid) {
      return;
    }

    const formValue = this.skuForm.value;
    const skuData = {
      name: formValue.name,
      sku_code: formValue.skuCode || null,
      category: formValue.category,
      price: parseFloat(formValue.price),
      stock_level: parseInt(formValue.stockLevel),
      reorder_threshold: formValue.reorderThreshold ? parseInt(formValue.reorderThreshold) : null,
      barcode: formValue.barcode || null,
      supplier_id: formValue.supplierId || null,
      track_batches: formValue.trackBatches
    };

    this.loading.set(true);

    if (this.isEditMode && this.currentSkuId) {
      this.skuService.updateSKU(this.currentSkuId, skuData as UpdateSKURequest).subscribe({
        next: (updatedSku) => {
          this.skus.update(skus =>
            skus.map(s => s.sku_id === this.currentSkuId ? updatedSku : s)
          );
          this.toastService.showSuccess('SKU updated successfully!');
          this.modalVisible = false;
          this.loading.set(false);
        },
        error: (error) => {
          this.toastService.showError(`Failed to update SKU: ${error.error?.message || error.message}`);
          this.loading.set(false);
        }
      });
    } else {
      this.skuService.createSKU(skuData as CreateSKURequest).subscribe({
        next: (newSku) => {
          this.loadSKUs(); // Reload to get enriched data
          this.toastService.showSuccess('SKU created successfully!');
          this.modalVisible = false;
          this.loading.set(false);
        },
        error: (error) => {
          this.toastService.showError(`Failed to create SKU: ${error.error?.message || error.message}`);
          this.loading.set(false);
        }
      });
    }
  }

  onDeleteSku(id: string) {
    if (confirm('Are you sure you want to delete this SKU?')) {
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
  }

  onViewSku(sku: SKU) {
    this.selectedSku = sku;
    this.viewModalVisible = true;
  }

  onRefreshData() {
    this.loadSKUs();
  }

  onExportData() {
    const csvData = this.generateSKUCSV();
    this.downloadCSV(csvData, 'skus.csv');
    this.toastService.showSuccess('SKUs exported successfully!');
  }

  private generateSKUCSV(): string {
    const headers = ['SKU ID', 'Name', 'SKU Code', 'Category', 'Price', 'Stock Level', 'Reorder Threshold', 'Barcode', 'Supplier ID', 'Track Batches', 'Created At'];
    const rows = this.skus().map(sku => [
      sku.sku_id || '',
      sku.name,
      sku.sku_code || '',
      sku.category_name || '',
      sku.price?.toString() || '',
      sku.stock_level?.toString() || '',
      sku.reorder_threshold?.toString() || '',
      sku.barcode || '',
      sku.supplier_id || '',
      sku.track_batches ? 'Yes' : 'No',
      sku.created_at || ''
    ]);

    return [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
  }

  private downloadCSV(data: string, filename: string): void {
    const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  onSelectionChange(selectedRows: SKU[]) {
    this.selectedSkus = selectedRows;
    console.log('Selected SKUs:', selectedRows);
  }

  private adjustStock(skuId: string) {
    const sku = this.skus().find(s => s.sku_id === skuId);
    if (sku) {
      this.selectedSku = sku;
      this.adjustStockForm.reset();
      this.adjustStockModalVisible = true;
    }
  }

  private viewBatches(skuId: string) {
    const sku = this.skus().find(s => s.sku_id === skuId);
    if (sku) {
      this.selectedSku = sku;
      this.loadBatches(skuId);
      this.viewBatchesModalVisible = true;
    }
  }

  private loadBatches(skuId: string) {
    this.batchesLoading = true;
    // Mock batch data for demonstration
    setTimeout(() => {
      this.batches = [
        {
          batch_number: 'BATCH-001',
          quantity: 50,
          manufacturing_date: new Date('2024-01-15'),
          expiry_date: new Date('2025-01-15'),
          status: 'active'
        },
        {
          batch_number: 'BATCH-002',
          quantity: 30,
          manufacturing_date: new Date('2024-02-01'),
          expiry_date: new Date('2025-02-01'),
          status: 'active'
        }
      ];
      this.batchesLoading = false;
    }, 500);
  }

  onSubmitStockAdjustment() {
    if (this.adjustStockForm.invalid || !this.selectedSku) {
      return;
    }

    const formValue = this.adjustStockForm.value;
    const currentStock = this.selectedSku.stock_level;
    let newStock = currentStock;

    switch (formValue.adjustmentType) {
      case 'increase':
        newStock = currentStock + parseInt(formValue.quantity);
        break;
      case 'decrease':
        newStock = Math.max(0, currentStock - parseInt(formValue.quantity));
        break;
      case 'set':
        newStock = parseInt(formValue.quantity);
        break;
    }

    // Update the SKU in the list
    this.skus.update(skus =>
      skus.map(sku =>
        sku.sku_id === this.selectedSku!.sku_id
          ? { ...sku, stock_level: newStock }
          : sku
      )
    );

    this.toastService.showSuccess(`Stock adjusted successfully! New stock level: ${newStock}`);
    this.adjustStockModalVisible = false;
    this.adjustStockForm.reset();
  }
}
