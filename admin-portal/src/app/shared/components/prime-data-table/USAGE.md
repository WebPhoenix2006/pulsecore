# PrimeNG Data Table Component Usage

## Basic Usage

Replace your old `app-reusable-data-table` with `app-prime-data-table`:

### HTML Template

```html
<app-prime-data-table
  [data]="tableData"
  [columns]="tableColumns"
  [loading]="isLoading"
  [actions]="tableActions"
  tableTitle="Products"
  tableDescription="Manage your product inventory"
  createLabel="Add Product"
  emptyMessage="No products found"
  [showCreate]="true"
  [showExport]="true"
  [showRefresh]="true"
  [selectionMode]="'multiple'"
  (createClick)="onCreateProduct()"
  (refreshClick)="onRefreshData()"
  (exportClick)="onExportData()"
  (selectionChange)="onSelectionChange($event)"
>
</app-prime-data-table>
```

### Component TypeScript

```typescript
import { Component } from '@angular/core';
import { TableColumn, TableAction } from '../shared/components/prime-data-table/prime-data-table';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html'
})
export class ProductsComponent {
  tableData: any[] = [
    {
      id: 1,
      name: 'Product 1',
      price: 99.99,
      status: 'active',
      createdAt: new Date(),
      image: 'https://example.com/image1.jpg',
      category: { name: 'Electronics' }
    },
    // ... more data
  ];

  tableColumns: TableColumn[] = [
    {
      field: 'id',
      header: 'ID',
      sortable: true,
      type: 'text',
      width: '80px'
    },
    {
      field: 'name',
      header: 'Product Name',
      sortable: true,
      filterable: true,
      type: 'text'
    },
    {
      field: 'price',
      header: 'Price',
      sortable: true,
      type: 'text'
    },
    {
      field: 'status',
      header: 'Status',
      sortable: true,
      filterable: true,
      type: 'status'
    },
    {
      field: 'createdAt',
      header: 'Created Date',
      sortable: true,
      type: 'date'
    },
    {
      field: 'image',
      header: 'Image',
      type: 'image',
      width: '100px'
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
      action: (rowData) => this.viewProduct(rowData)
    },
    {
      label: 'Edit',
      value: 'edit',
      icon: 'edit',
      iconPosition: 'left',
      action: (rowData) => this.editProduct(rowData)
    },
    {
      label: 'Delete',
      value: 'delete',
      icon: 'trash',
      iconPosition: 'left',
      action: (rowData) => this.deleteProduct(rowData)
    }
  ];

  isLoading = false;

  onCreateProduct() {
    console.log('Create product clicked');
  }

  onRefreshData() {
    this.isLoading = true;
    // Refresh your data
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }

  onExportData() {
    console.log('Export data clicked');
  }

  onSelectionChange(selectedRows: any[]) {
    console.log('Selected rows:', selectedRows);
  }

  viewProduct(product: any) {
    console.log('View product:', product);
  }

  editProduct(product: any) {
    console.log('Edit product:', product);
  }

  deleteProduct(product: any) {
    console.log('Delete product:', product);
  }
}
```

## Advanced Usage with Custom Templates

You can also use custom templates for cells and actions:

```html
<app-prime-data-table
  [data]="tableData"
  [columns]="tableColumns"
  [loading]="isLoading"
>
  <!-- Custom actions template -->
  <ng-template #actionsTemplate let-rowData let-index="index">
    <button class="btn-custom-primary small" (click)="customAction(rowData)">
      <i class="fas fa-cog"></i>
    </button>
  </ng-template>

  <!-- Custom cell template -->
  <ng-template #cellTemplate let-rowData let-column="column" let-value="value">
    <ng-container [ngSwitch]="column.field">
      <span *ngSwitchCase="'customField'" class="custom-cell">
        Custom: {{ value }}
      </span>
      <span *ngSwitchDefault>{{ value }}</span>
    </ng-container>
  </ng-template>
</app-prime-data-table>
```

## Column Types

The component supports these column types:

- `text` (default): Simple text display
- `date`: Formatted date with calendar icon
- `status`: Status badge with color coding
- `image`: Image preview with fallback
- `user`: User info with avatar
- `actions`: Action buttons/dropdown

## Input Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `data` | `any[]` | `[]` | Table data array |
| `columns` | `TableColumn[]` | `[]` | Column definitions |
| `loading` | `boolean` | `false` | Loading state |
| `paginator` | `boolean` | `true` | Enable pagination |
| `rows` | `number` | `10` | Rows per page |
| `selectionMode` | `'single' \| 'multiple' \| null` | `null` | Selection mode |
| `tableTitle` | `string` | `''` | Table title |
| `tableDescription` | `string` | `''` | Table description |
| `actions` | `TableAction[]` | `[]` | Action definitions |
| `showCreate` | `boolean` | `true` | Show create button |
| `showExport` | `boolean` | `true` | Show export button |
| `showRefresh` | `boolean` | `true` | Show refresh button |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `createClick` | `void` | Create button clicked |
| `refreshClick` | `void` | Refresh button clicked |
| `exportClick` | `void` | Export button clicked |
| `selectionChange` | `any[]` | Selection changed |
| `rowSelect` | `any` | Row selected |
| `rowUnselect` | `any` | Row unselected |

## Migration from ReusableDataTable

1. Replace `app-reusable-data-table` with `app-prime-data-table`
2. Update column definitions to use `TableColumn` interface
3. Update action definitions to use `TableAction` interface
4. Replace event handlers with new event names
5. Remove any custom table styling (now handled by the component)

The new component maintains the same visual design and functionality while leveraging PrimeNG's robust table features.