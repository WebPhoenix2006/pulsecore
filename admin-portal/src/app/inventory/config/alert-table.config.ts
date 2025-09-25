import { TableConfig } from '../../interfaces/table-config.interface';

export const alertTableConfig: TableConfig = {
  title: 'Inventory Alerts',
  idField: 'alert_id',
  description: 'Manage inventory alerts and notifications',
  entityName: 'Alert',
  showCreateButton: false, // Alerts are typically system-generated
  showSearch: true,
  searchPlaceholder: 'Search alerts...',
  emptyMessage: 'No alerts found',
  emptyDescription: 'All clear! No inventory alerts at this time.',
  pageSize: 10,
  showPaginator: true,

  columns: [
    { field: 'type', header: 'Alert Type', type: 'badge', sortable: true, filterable: true },
    { field: 'sku_name', header: 'Product', type: 'text', sortable: true, filterable: true },
    { field: 'current_stock', header: 'Current Stock', type: 'number', sortable: true },
    { field: 'threshold', header: 'Threshold', type: 'number', sortable: true },
    { field: 'created_at', header: 'Created', type: 'date', sortable: true },
    { field: 'acknowledged', header: 'Status', type: 'custom', sortable: true },
  ],

  actions: [
    { type: 'view', icon: 'fa fa-eye', label: 'View', severity: 'info' },
    {
      type: 'custom',
      key: 'acknowledge',
      icon: 'fa fa-check',
      label: 'Acknowledge',
      severity: 'success',
    },
    { type: 'custom', key: 'dismiss', icon: 'fa fa-times', label: 'Dismiss', severity: 'warning' },
    {
      type: 'custom',
      key: 'view-sku',
      icon: 'fa fa-external-link',
      label: 'View SKU',
      severity: 'info',
    },
  ],

  formFields: [
    {
      field: 'type',
      label: 'Alert Type',
      type: 'select',
      required: true,
      options: [
        { value: 'low_stock', label: 'Low Stock' },
        { value: 'batch_expiry', label: 'Batch Expiry' },
      ],
    },
    {
      field: 'sku_id',
      label: 'SKU',
      type: 'select',
      required: true,
      placeholder: 'Select SKU',
      options: [], // Will be populated dynamically
    },
    {
      field: 'threshold',
      label: 'Threshold',
      type: 'number',
      placeholder: 'Enter threshold value',
    },
  ],
};
