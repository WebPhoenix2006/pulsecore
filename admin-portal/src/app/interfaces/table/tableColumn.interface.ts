// interfaces/table/tableColumn.interface.ts

export interface TableColumn {
  /** The field name from your data object (e.g., 'name', 'slug', 'isActive') */
  field: string;

  /** Display name for the column header */
  header: string;

  /** Column type - determines how data is rendered */
  type?: 'text' | 'badge' | 'date' | 'image' | 'custom';

  /** Whether this column can be sorted */
  sortable?: boolean;

  /** CSS width for the column */
  width?: string;

  /** For badge type - map values to badge severities */
  badgeMap?: { [key: string]: 'success' | 'info' | 'warning' | 'danger' | 'secondary' };

  /** For image type - fallback icon class when image fails */
  fallbackIcon?: string;

  /** For custom type - template reference name */
  templateName?: string;
}

export interface TableAction {
  /** Unique identifier for the action */
  type: 'view' | 'edit' | 'delete' | 'custom';

  /** FontAwesome icon class */
  icon: string;

  /** Button label for accessibility */
  label: string;

  /** PrimeNG button severity */
  severity?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger';

  /** Whether button should be outlined */
  outlined?: boolean;

  /** Tooltip text */
  tooltip?: string;
}

export interface TableConfig {
  /** Page title */
  title: string;

  /** Page description */
  description: string;

  /** Entity name (e.g., 'Sport', 'Category') - used for buttons and messages */
  entityName: string;

  /** Column definitions */
  columns: TableColumn[];

  /** Available row actions */
  actions: TableAction[];

  /** Whether to show the "Add New" button */
  showCreateButton?: boolean;

  /** Fields that can be searched (for PrimeNG global filter) */
  searchableFields?: string[];

  /** Empty state message when no data */
  emptyMessage?: string;

  /** Empty state description */
  emptyDescription?: string;
}
