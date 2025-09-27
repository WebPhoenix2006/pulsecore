// catalog/pages/products/products.component.ts
import { Component, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { TableColumn, TableAction } from '../../../shared/components/prime-data-table/prime-data-table';
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
import { FormFieldOption } from '../../../interfaces/form-field-options';

@Component({
  selector: 'app-products',
  standalone: false,
  templateUrl: './products.html',
  styleUrl: './products.scss',
})
export class Products implements OnInit {
  products = signal<Product[]>([]);
  categories: Category[] = [];
  loading = signal(false);
  selectedProducts: Product[] = [];

  // Form properties
  modalVisible = false;
  viewModalVisible = false;
  isEditMode = false;
  productForm!: FormGroup;
  currentProductId: string | null = null;
  categoryOptions: FormFieldOption[] = [];
  selectedProduct: Product | null = null;

  tableColumns: TableColumn[] = [
    {
      field: 'name',
      header: 'Product Name',
      sortable: true,
      filterable: true,
      type: 'text',
      width: '25%',
      filterType: 'text'
    },
    {
      field: 'category_name',
      header: 'Category',
      sortable: true,
      filterable: true,
      type: 'text',
      width: '15%',
      filterType: 'text'
    },
    {
      field: 'price',
      header: 'Price',
      sortable: true,
      filterable: true,
      type: 'text',
      width: '12%',
      filterType: 'text'
    },
    {
      field: 'barcode',
      header: 'Barcode',
      filterable: true,
      type: 'text',
      width: '15%',
      filterType: 'text'
    },
    {
      field: 'batch_number',
      header: 'Batch No.',
      filterable: true,
      type: 'text',
      width: '15%',
      filterType: 'text'
    },
    {
      field: 'expiry_date',
      header: 'Expiry Date',
      sortable: true,
      filterable: true,
      type: 'date',
      width: '18%',
      filterType: 'date'
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
      action: (rowData) => this.onViewProduct(rowData)
    },
    {
      label: 'Edit',
      value: 'edit',
      icon: 'edit',
      iconPosition: 'left',
      action: (rowData) => this.onEditProduct(rowData)
    },
    {
      label: 'Delete',
      value: 'delete',
      icon: 'trash',
      iconPosition: 'left',
      action: (rowData) => this.onDeleteProduct(rowData.sku_id)
    }
  ];

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private toastService: ToastService,
    private dataTableHelper: DataTableHelperService,
    private fb: FormBuilder
  ) {
    this.initializeForm();
  }

  ngOnInit() {
    this.loadCategories();
    this.loadProducts();
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

  private initializeForm() {
    this.productForm = this.fb.group({
      name: ['', [Validators.required]],
      category: [''],
      price: ['', [Validators.required, Validators.min(0)]],
      barcode: [''],
      batchNumber: [''],
      expiryDate: [''],
      supplierId: ['']
    });
  }

  // Form control getters
  get nameControl() { return this.productForm.get('name') as FormControl; }
  get categoryControl() { return this.productForm.get('category') as FormControl; }
  get priceControl() { return this.productForm.get('price') as FormControl; }
  get barcodeControl() { return this.productForm.get('barcode') as FormControl; }
  get batchNumberControl() { return this.productForm.get('batchNumber') as FormControl; }
  get expiryDateControl() { return this.productForm.get('expiryDate') as FormControl; }
  get supplierIdControl() { return this.productForm.get('supplierId') as FormControl; }

  onCreateProduct() {
    this.isEditMode = false;
    this.currentProductId = null;
    this.productForm.reset();
    this.modalVisible = true;
  }

  onEditProduct(product: Product) {
    this.isEditMode = true;
    this.currentProductId = product.sku_id;
    this.productForm.patchValue({
      name: product.name,
      category: product.category || '',
      price: product.price,
      barcode: product.barcode || '',
      batchNumber: product.batch_number || '',
      expiryDate: product.expiry_date || '',
      supplierId: product.supplier_id || ''
    });
    this.modalVisible = true;
  }

  onSubmitProduct() {
    if (this.productForm.invalid) {
      return;
    }

    const formValue = this.productForm.value;
    const productData = {
      name: formValue.name,
      category: formValue.category || undefined,
      price: parseFloat(formValue.price),
      barcode: formValue.barcode || undefined,
      batch_number: formValue.batchNumber || undefined,
      expiry_date: formValue.expiryDate || undefined,
      supplier_id: formValue.supplierId || undefined
    };

    this.loading.set(true);

    if (this.isEditMode && this.currentProductId) {
      this.productService.updateProduct(this.currentProductId, productData as UpdateProductRequest).subscribe({
        next: (updatedProduct) => {
          this.products.update(products =>
            products.map(p => p.sku_id === this.currentProductId ? updatedProduct : p)
          );
          this.toastService.showSuccess('Product updated successfully!');
          this.modalVisible = false;
          this.loading.set(false);
        },
        error: (error) => {
          this.toastService.showError(`Failed to update product: ${error.error?.message || error.message}`);
          this.loading.set(false);
        }
      });
    } else {
      this.productService.createProduct(productData as CreateProductRequest).subscribe({
        next: (newProduct) => {
          this.loadProducts(); // Reload to get enriched data
          this.toastService.showSuccess('Product created successfully!');
          this.modalVisible = false;
          this.loading.set(false);
        },
        error: (error) => {
          this.toastService.showError(`Failed to create product: ${error.error?.message || error.message}`);
          this.loading.set(false);
        }
      });
    }
  }

  onDeleteProduct(id: string) {
    if (confirm('Are you sure you want to delete this product?')) {
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
  }

  onViewProduct(product: Product) {
    this.selectedProduct = product;
    this.viewModalVisible = true;
  }

  onRefreshData() {
    this.loadProducts();
  }

  onExportData() {
    const csvData = this.generateProductCSV();
    this.downloadCSV(csvData, 'products.csv');
    this.toastService.showSuccess('Products exported successfully!');
  }

  private generateProductCSV(): string {
    const headers = ['SKU ID', 'Name', 'Category', 'Price', 'Barcode', 'Batch Number', 'Expiry Date', 'Supplier ID', 'Created At'];
    const rows = this.products().map(product => [
      product.sku_id || '',
      product.name,
      product.category_name || '',
      product.price?.toString() || '',
      product.barcode || '',
      product.batch_number || '',
      product.expiry_date || '',
      product.supplier_id || '',
      product.created_at || ''
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

  onSelectionChange(selectedRows: Product[]) {
    this.selectedProducts = selectedRows;
    console.log('Selected products:', selectedRows);
  }
}
