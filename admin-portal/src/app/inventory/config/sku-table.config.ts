import { TableConfig } from '../../interfaces/table-config.interface';

export const skuTableConfig: TableConfig = {
  title: 'SKU Management',
  idField: 'sku_id',
  description: 'Manage all SKUs and stock levels',
  entityName: 'SKU',
  showCreateButton: true,
  showSearch: true,
  searchPlaceholder: 'Search SKUs...',
  emptyMessage: 'No SKUs found',
  emptyDescription: 'Start by adding your first SKU.',
  pageSize: 10,
  showPaginator: true,

  columns: [
    { field: 'sku_code', header: 'SKU Code', type: 'text', sortable: true, filterable: true },
    { field: 'name', header: 'Product Name', type: 'text', sortable: true, filterable: true },
    { field: 'category_name', header: 'Category', type: 'text', sortable: true },
    { field: 'stock_level', header: 'Stock Level', type: 'number', sortable: true },
    { field: 'reorder_threshold', header: 'Reorder Level', type: 'number', sortable: true },
    { field: 'price', header: 'Price', type: 'number', sortable: true },
    { field: 'barcode', header: 'Barcode', type: 'text' },
    { field: 'track_batches', header: 'Track Batches', type: 'custom' },
  ],

  actions: [
    { type: 'view', icon: 'fa fa-eye', label: 'View', severity: 'info' },
    { type: 'edit', icon: 'fa fa-pencil', label: 'Edit', severity: 'warning' },
    { type: 'delete', icon: 'fa fa-trash', label: 'Delete', severity: 'danger' },
    {
      type: 'custom',
      key: 'adjust-stock',
      icon: 'fa fa-plus-minus',
      label: 'Adjust Stock',
      severity: 'secondary',
    },
    {
      type: 'custom',
      key: 'view-batches',
      icon: 'fa fa-list',
      label: 'View Batches',
      severity: 'info',
    },
  ],

  formFields: [
    {
      field: 'name',
      label: 'Product Name',
      type: 'text',
      required: true,
      placeholder: 'Enter product name',
    },
    {
      field: 'sku_code',
      label: 'SKU Code',
      type: 'text',
      placeholder: 'Enter SKU code (optional)',
    },
    {
      field: 'category',
      label: 'Category',
      type: 'select',
      required: true,
      placeholder: 'Select category',
      options: [], // Will be populated dynamically
    },
    {
      field: 'price',
      label: 'Price',
      type: 'number',
      required: true,
      placeholder: 'Enter price',
    },
    {
      field: 'stock_level',
      label: 'Initial Stock Level',
      type: 'number',
      required: true,
      placeholder: 'Enter initial stock quantity',
    },
    {
      field: 'reorder_threshold',
      label: 'Reorder Threshold',
      type: 'number',
      placeholder: 'Enter reorder level',
    },
    {
      field: 'barcode',
      label: 'Barcode',
      type: 'text',
      placeholder: 'Enter barcode (optional)',
    },
    {
      field: 'supplier_id',
      label: 'Supplier',
      type: 'select',
      placeholder: 'Select supplier (optional)',
      options: [], // Will be populated dynamically
    },
    {
      field: 'track_batches',
      label: 'Track Batches',
      type: 'checkbox',
    },
  ],
};
