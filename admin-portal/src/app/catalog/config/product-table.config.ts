import { TableConfig } from '../../interfaces/table-config.interface';

export const productTableConfig: TableConfig = {
  title: 'Products',
  idField: 'sku_id',
  description: 'Manage all products (SKUs)',
  entityName: 'Product',
  showCreateButton: true,
  showSearch: true,
  searchPlaceholder: 'Search products...',
  emptyMessage: 'No products found',
  emptyDescription: 'Start by adding your first product.',
  pageSize: 10,
  showPaginator: true,
  // Enhanced features
  allowSelection: true,
  showStats: true,
  showActiveCount: false,

  columns: [
    {
      field: 'name',
      header: 'Product Name',
      type: 'text',
      sortable: true,
      filterable: true,
      width: '25%'
    },
    {
      field: 'category_name',
      header: 'Category',
      type: 'text',
      sortable: true,
      filterable: true,
      width: '15%'
    },
    {
      field: 'price',
      header: 'Price',
      type: 'number',
      sortable: true,
      width: '12%'
    },
    {
      field: 'barcode',
      header: 'Barcode',
      type: 'text',
      filterable: true,
      width: '15%'
    },
    {
      field: 'batch_number',
      header: 'Batch No.',
      type: 'text',
      filterable: true,
      width: '15%'
    },
    {
      field: 'expiry_date',
      header: 'Expiry Date',
      type: 'date',
      sortable: true,
      width: '18%'
    },
  ],

  actions: [
    { type: 'view', icon: 'fa fa-eye', label: 'View', severity: 'info' },
    { type: 'edit', icon: 'fa fa-pencil', label: 'Edit', severity: 'warning' },
    { type: 'delete', icon: 'fa fa-trash', label: 'Delete', severity: 'danger' },
  ],

  formFields: [
    {
      field: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      placeholder: 'Enter product name',
    },
    {
      field: 'category',
      label: 'Category',
      type: 'select',
      placeholder: 'Select category',
      options: [],
    },
    { field: 'price', label: 'Price', type: 'number', required: true, placeholder: 'Enter price' },
    { field: 'barcode', label: 'Barcode', type: 'text', placeholder: 'Enter barcode' },
    { field: 'batch_number', label: 'Batch No.', type: 'text', placeholder: 'Enter batch number' },
    { field: 'expiry_date', label: 'Expiry Date', type: 'date', placeholder: 'Select expiry date' },
  ],
};
