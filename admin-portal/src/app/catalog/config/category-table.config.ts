import { TableConfig } from '../../interfaces/table-config.interface';

export const categoryTableConfig: TableConfig = {
  title: 'Categories',
  description: 'Manage product categories for your catalog',
  entityName: 'Category',
  showCreateButton: true,
  showSearch: true,
  searchPlaceholder: 'Search categories...',
  emptyMessage: 'No categories found',
  emptyDescription: 'Create your first category to get started organizing your products',
  pageSize: 10,
  showPaginator: true,

  columns: [
    {
      field: 'name',
      header: 'Name',
      type: 'text',
      sortable: true,
      filterable: true,
      width: '25%'
    },
    {
      field: 'description',
      header: 'Description',
      type: 'text',
      sortable: true,
      filterable: true,
      width: '40%'
    },
    {
      field: 'created_at',
      header: 'Created',
      type: 'date',
      sortable: true,
      filterable: false,
      width: '15%'
    },
    {
      field: 'updated_at',
      header: 'Last Updated',
      type: 'date',
      sortable: true,
      filterable: false,
      width: '15%'
    }
  ],

  actions: [
    {
      type: 'view',
      icon: 'fas fa-eye',
      label: 'View Details',
      severity: 'info'
    },
    {
      type: 'edit',
      icon: 'fas fa-edit',
      label: 'Edit Category',
      severity: 'primary'
    },
    {
      type: 'delete',
      icon: 'fas fa-trash',
      label: 'Delete Category',
      severity: 'danger'
    }
  ],

  formFields: [
    {
      field: 'name',
      label: 'Category Name',
      type: 'text',
      required: true,
      placeholder: 'Enter category name',
      description: 'A unique name for this category'
    },
    {
      field: 'description',
      label: 'Description',
      type: 'textarea',
      required: false,
      placeholder: 'Enter category description (optional)',
      description: 'Provide a detailed description of this category'
    }
  ]
};