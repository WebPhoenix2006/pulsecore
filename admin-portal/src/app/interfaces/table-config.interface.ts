export interface TableColumn {
  field: string;
  header: string;
  type: 'text' | 'number' | 'date' | 'badge' | 'image' | 'custom';
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  badgeMapping?: { [key: string]: { severity: string; value: string } };
}

export interface TableAction {
  type: 'view' | 'edit' | 'delete' | 'custom';
  icon: string;
  label: string;
  severity?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger';
  customFunction?: string;
  visible?: (item: any) => boolean;
}

export interface FormFieldConfig {
  field: string;
  label: string;
  type:
    | 'text'
    | 'email'
    | 'password'
    | 'number'
    | 'textarea'
    | 'select'
    | 'checkbox'
    | 'date'
    | 'tel'
    | 'file'
    | 'multiselect';
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: any }[];
  validators?: any[];
  disabled?: boolean;
  description?: string;
}

export interface TableConfig {
  title: string;
  idField?: string;
  description?: string;
  entityName: string;
  columns: TableColumn[];
  actions: TableAction[];
  formFields: FormFieldConfig[];
  showCreateButton?: boolean;
  showSearch?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  emptyDescription?: string;
  pageSize?: number;
  showPaginator?: boolean;
  apiEndpoint?: string;
}

export interface TableData {
  [key: string]: any;
}
