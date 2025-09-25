# 📊 Reusable Data Table Component

A comprehensive, feature-rich Angular data table component built with Angular 18+ signals, PrimeNG integration, and full CRUD operations support. This component provides a complete table solution with built-in pagination, search, modals, and form handling.

## ✨ Features

### Core Functionality

- **Full CRUD Operations** - Create, Read, Update, Delete with built-in modals
- **Advanced Search** - Real-time filtering across multiple columns
- **Smart Pagination** - Configurable page sizes with intuitive navigation
- **Dynamic Forms** - Auto-generated forms based on field configuration
- **Multiple Column Types** - Text, number, date, badge, image support
- **Responsive Design** - Mobile-friendly with adaptive layouts
- **Loading States** - Built-in loading indicators and empty states
- **Action Buttons** - Configurable row actions with custom functions

### Modern Architecture

- **Angular 18+ Signals** - Reactive state management with computed values
- **Standalone Component Ready** - Can be used as standalone or in modules
- **PrimeNG Integration** - Leverages PrimeNG modals and UI components
- **TypeScript Support** - Fully typed interfaces for configuration
- **Form Integration** - Built-in Angular Reactive Forms support

## 🚀 Installation & Setup

### Prerequisites

```bash
npm install @angular/forms primeng primeicons
```

### Module Declaration

```typescript
import { ReusableDataTable } from "./shared/components/reusable-data-table/reusable-data-table";
import { FormField } from "./shared/components/form-field/form-field";

@NgModule({
  declarations: [
    ReusableDataTable,
    FormField,
    // ... other components
  ],
  imports: [
    ReactiveFormsModule,
    // PrimeNG modules as needed
  ],
})
export class SharedModule {}
```

## 📦 Basic Usage

### Simple Table Setup

```typescript
// component.ts
import { Component, signal } from "@angular/core";
import { TableConfig, TableData } from "./interfaces/table-config.interface";

@Component({
  template: `
    <app-reusable-data-table
      [config]="tableConfig()"
      [data]="tableData()"
      [loading]="loading()"
      (onCreate)="handleCreate($event)"
      (onEdit)="handleEdit($event)"
      (onDelete)="handleDelete($event)"
      (onView)="handleView($event)"
    ></app-reusable-data-table>
  `,
})
export class MyTableComponent {
  loading = signal(false);
  tableData = signal<TableData[]>([
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      isActive: true,
      createdAt: "2024-01-15",
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      isActive: false,
      createdAt: "2024-01-16",
    },
  ]);

  tableConfig = signal<TableConfig>({
    title: "User Management",
    description: "Manage your application users",
    entityName: "User",
    idField: "id",
    columns: [
      {
        field: "name",
        header: "Full Name",
        type: "text",
        sortable: true,
        filterable: true,
      },
      {
        field: "email",
        header: "Email Address",
        type: "text",
        sortable: true,
        filterable: true,
      },
      {
        field: "isActive",
        header: "Status",
        type: "badge",
        badgeMapping: {
          true: { severity: "success", value: "Active" },
          false: { severity: "danger", value: "Inactive" },
        },
      },
      {
        field: "createdAt",
        header: "Created Date",
        type: "date",
        sortable: true,
      },
    ],
    actions: [
      { type: "view", icon: "fas fa-eye", label: "View", severity: "info" },
      { type: "edit", icon: "fas fa-edit", label: "Edit", severity: "primary" },
      {
        type: "delete",
        icon: "fas fa-trash",
        label: "Delete",
        severity: "danger",
      },
    ],
    formFields: [
      { field: "name", label: "Full Name", type: "text", required: true },
      { field: "email", label: "Email", type: "email", required: true },
      {
        field: "isActive",
        label: "Status",
        type: "select",
        options: [
          { label: "Active", value: true },
          { label: "Inactive", value: false },
        ],
      },
    ],
    showCreateButton: true,
    showSearch: true,
    pageSize: 10,
    emptyMessage: "No users found",
    emptyDescription: "Start by creating your first user",
  });

  handleCreate(data: TableData) {
    console.log("Creating:", data);
    // Add your create logic here
  }

  handleEdit(event: { id: any; data: TableData }) {
    console.log("Editing:", event);
    // Add your edit logic here
  }

  handleDelete(id: any) {
    console.log("Deleting:", id);
    // Add your delete logic here
  }

  handleView(data: TableData) {
    console.log("Viewing:", data);
    // Add your view logic here
  }
}
```

## ⚙️ Configuration Interfaces

### TableConfig

```typescript
interface TableConfig {
  title: string; // Page/table title
  idField?: string; // Primary key field (default: 'id')
  description?: string; // Table description
  entityName: string; // Entity name for buttons/messages
  columns: TableColumn[]; // Column definitions
  actions: TableAction[]; // Row action buttons
  formFields: FormFieldConfig[]; // Form field configurations
  showCreateButton?: boolean; // Show "Add New" button (default: true)
  showSearch?: boolean; // Show search input (default: true)
  searchPlaceholder?: string; // Search placeholder text
  emptyMessage?: string; // Message when no data
  emptyDescription?: string; // Empty state description
  pageSize?: number; // Items per page (default: 10)
  showPaginator?: boolean; // Show pagination (default: true)
  apiEndpoint?: string; // API endpoint (future use)
}
```

### TableColumn

```typescript
interface TableColumn {
  field: string; // Data field name
  header: string; // Column header text
  type: "text" | "number" | "date" | "badge" | "image" | "custom";
  sortable?: boolean; // Enable sorting
  filterable?: boolean; // Include in search
  width?: string; // CSS width
  badgeMapping?: {
    // For badge type columns
    [key: string]: {
      severity: string;
      value: string;
    };
  };
}
```

### TableAction

```typescript
interface TableAction {
  type: "view" | "edit" | "delete" | "custom";
  icon: string; // FontAwesome icon class
  label: string; // Accessibility label
  severity?:
    | "primary"
    | "secondary"
    | "success"
    | "info"
    | "warning"
    | "danger";
  customFunction?: string; // Custom action identifier
  visible?: (item: any) => boolean; // Conditional visibility
}
```

### FormFieldConfig

```typescript
interface FormFieldConfig {
  field: string; // Form control name
  label: string; // Field label
  type:
    | "text"
    | "email"
    | "password"
    | "number"
    | "textarea"
    | "select"
    | "checkbox"
    | "date"
    | "tel"
    | "file"
    | "multiselect";
  required?: boolean; // Required validation
  placeholder?: string; // Input placeholder
  options?: FormFieldOption[]; // For select/multiselect
  validators?: any[]; // Additional validators
  disabled?: boolean; // Disable field
  description?: string; // Help text
}
```

## 🎯 Advanced Features

### Custom Column Types

#### Badge Columns

```typescript
{
  field: 'status',
  header: 'Status',
  type: 'badge',
  badgeMapping: {
    'active': { severity: 'success', value: 'Active' },
    'pending': { severity: 'warning', value: 'Pending' },
    'inactive': { severity: 'danger', value: 'Inactive' }
  }
}
```

#### Image Columns

```typescript
{
  field: 'profileImage',
  header: 'Profile',
  type: 'image',
  width: '80px'
}
```

#### Date Columns

```typescript
{
  field: 'createdAt',
  header: 'Created Date',
  type: 'date',
  sortable: true
}
```

### Conditional Action Visibility

```typescript
{
  type: 'edit',
  icon: 'fas fa-edit',
  label: 'Edit',
  visible: (item) => item.status !== 'locked'
}
```

### Custom Actions

```typescript
// In TableConfig actions array
{
  type: 'custom',
  icon: 'fas fa-download',
  label: 'Download',
  customFunction: 'download',
  severity: 'info'
}

// In component
(onCustomAction)="handleCustomAction($event)"

handleCustomAction(event: { action: string; item: TableData }) {
  if (event.action === 'download') {
    this.downloadFile(event.item);
  }
}
```

### Form Field Types

#### Select Dropdown

```typescript
{
  field: 'category',
  label: 'Category',
  type: 'select',
  options: [
    { label: 'Technology', value: 'tech' },
    { label: 'Business', value: 'business' },
    { label: 'Science', value: 'science' }
  ]
}
```

#### Multi-select

```typescript
{
  field: 'tags',
  label: 'Tags',
  type: 'multiselect',
  options: [
    { label: 'Important', value: 'important' },
    { label: 'Urgent', value: 'urgent' },
    { label: 'Review', value: 'review' }
  ]
}
```

#### File Upload

```typescript
{
  field: 'document',
  label: 'Upload Document',
  type: 'file',
  description: 'Accepted formats: PDF, DOC, DOCX'
}
```

## 🎨 Styling & Theming

The component includes comprehensive SCSS with support for:

- **CSS Custom Properties** - Easy theming with CSS variables
- **Dark Mode Support** - Automatic dark theme adaptation
- **Responsive Design** - Mobile-first responsive layouts
- **Animation Effects** - Smooth transitions and hover effects
- **PrimeNG Integration** - Consistent with PrimeNG design system

### Key CSS Variables

```scss
--card-bg: #ffffff;
--surface-color: #f8fafc;
--text-color: #1e293b;
--border-color: #e2e8f0;
--secondary-color: #6366f1;
--error-color: #ef4444;
--shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

## 📱 Responsive Behavior

- **Desktop**: Full feature set with hover effects
- **Tablet**: Optimized touch targets and spacing
- **Mobile**: Stacked layouts, full-width modals, simplified pagination

## 🛠️ API Methods

### Public Methods

```typescript
// Reset component state
resetComponent(): void

// Handle successful operations (call from parent)
onOperationSuccess(): void

// Handle operation errors (call from parent)
onOperationError(): void

// Navigate to specific page
goToPage(page: number): void

// Format cell values
formatCellValue(item: TableData, column: TableColumn): string

// Get badge styling details
getBadgeDetails(item: TableData, column: TableColumn): { severity: string; value: string }
```

### Usage Example

```typescript
@ViewChild(ReusableDataTable) dataTable!: ReusableDataTable;

onCreateSuccess() {
  this.dataTable.onOperationSuccess(); // Closes modal and resets form
}

onCreateError() {
  this.dataTable.onOperationError(); // Stops loading state
}
```

## 🔧 Event Handling

### Output Events

```typescript
// CRUD operations
onCreate =
  "handleCreate($event)"(
    // TableData
    onEdit
  ) =
  "handleEdit($event)"(
    // { id: any; data: TableData }
    onDelete
  ) =
  "handleDelete($event)"(
    // any (id)
    onView
  ) =
  "handleView($event)"(
    // TableData
    onCustomAction
  ) =
    "handleCustomAction($event)"; // { action: string; item: TableData }
```

### Complete Event Handler Example

```typescript
export class DataTableExample {
  loading = signal(false);

  async handleCreate(data: TableData) {
    this.loading.set(true);
    try {
      await this.apiService.create(data);
      this.dataTable.onOperationSuccess();
      this.loadData(); // Refresh table data
    } catch (error) {
      this.dataTable.onOperationError();
      console.error("Create failed:", error);
    } finally {
      this.loading.set(false);
    }
  }

  async handleEdit(event: { id: any; data: TableData }) {
    this.loading.set(true);
    try {
      await this.apiService.update(event.id, event.data);
      this.dataTable.onOperationSuccess();
      this.loadData();
    } catch (error) {
      this.dataTable.onOperationError();
      console.error("Update failed:", error);
    } finally {
      this.loading.set(false);
    }
  }

  async handleDelete(id: any) {
    try {
      await this.apiService.delete(id);
      this.loadData();
    } catch (error) {
      console.error("Delete failed:", error);
    }
  }
}
```

## 🧪 Testing

### Component Testing

```typescript
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ReusableDataTable } from "./reusable-data-table";

describe("ReusableDataTable", () => {
  let component: ReusableDataTable;
  let fixture: ComponentFixture<ReusableDataTable>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ReusableDataTable],
      imports: [ReactiveFormsModule /* PrimeNG modules */],
    });
    fixture = TestBed.createComponent(ReusableDataTable);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should filter data based on search term", () => {
    // Test implementation
  });
});
```

## 🔍 Troubleshooting

### Common Issues

1. **Modal not showing**: Ensure PrimeNG Dialog module is imported
2. **Forms not working**: Check ReactiveFormsModule import
3. **Styling issues**: Verify CSS custom properties are defined
4. **Actions not triggering**: Check event handler binding syntax

### Performance Tips

1. **Large datasets**: Consider implementing virtual scrolling or server-side pagination
2. **Complex computations**: Use `trackBy` functions for better performance
3. **Image columns**: Implement lazy loading for better UX
4. **Search optimization**: Debounce search input for better performance

## 📚 Dependencies

- `@angular/core` ^18.0.0
- `@angular/forms` ^18.0.0
- `primeng` ^17.0.0
- `primeicons` ^7.0.0

## 🚀 Future Enhancements

- [ ] Virtual scrolling for large datasets
- [ ] Export functionality (CSV, Excel, PDF)
- [ ] Column resizing and reordering
- [ ] Server-side pagination and filtering
- [ ] Bulk operations support
- [ ] Advanced filtering with date ranges
- [ ] Column grouping and aggregation
- [ ] Inline editing capabilities

## 📄 License

This component is part of the PulseCore project and follows the project's licensing terms.
