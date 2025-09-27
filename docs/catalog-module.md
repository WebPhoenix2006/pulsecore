# Catalog Module Documentation

## Overview

The Catalog Module is a comprehensive product and category management system that provides full CRUD operations, advanced filtering, search functionality, and data export capabilities. It's designed for efficient product catalog management with an intuitive user interface.

## Table of Contents

1. [Components](#components)
2. [Features](#features)
3. [Architecture](#architecture)
4. [API Integration](#api-integration)
5. [User Interface](#user-interface)
6. [Advanced Features](#advanced-features)
7. [Usage Guide](#usage-guide)

## Components

### 1. Categories Component (`category.ts`)

**Location**: `src/app/catalog/components/category/`

**Purpose**: Manages product categories with full CRUD operations

**Key Features**:
- ✅ Create, Read, Update, Delete operations
- ✅ Advanced data table with sorting and filtering
- ✅ Search with real-time highlighting
- ✅ Column-specific filters (text, date)
- ✅ Modal-based forms with validation
- ✅ CSV export functionality
- ✅ View details modal
- ✅ Bulk selection and operations
- ✅ Real-time data updates

**Reactive Forms**:
```typescript
categoryForm = this.fb.group({
  name: ['', Validators.required],
  description: ['']
});
```

**Table Configuration**:
```typescript
tableColumns: TableColumn[] = [
  {
    field: 'name',
    header: 'Name',
    sortable: true,
    filterable: true,
    type: 'text',
    filterType: 'text'
  },
  {
    field: 'description',
    header: 'Description',
    sortable: true,
    filterable: true,
    type: 'text',
    filterType: 'text'
  },
  {
    field: 'created_at',
    header: 'Created',
    sortable: true,
    filterable: true,
    type: 'date',
    filterType: 'date'
  }
];
```

### 2. Products Component (`products.ts`)

**Location**: `src/app/catalog/components/products/`

**Purpose**: Comprehensive product management with extended attributes

**Key Features**:
- ✅ Complete product lifecycle management
- ✅ Category integration and enriched data display
- ✅ Advanced search and filtering
- ✅ Batch number and expiry date tracking
- ✅ Barcode support
- ✅ Supplier management
- ✅ Price management
- ✅ Detailed view modals
- ✅ CSV export with all product data

**Form Structure**:
```typescript
productForm = this.fb.group({
  name: ['', Validators.required],
  category: [''],
  price: ['', [Validators.required, Validators.min(0)]],
  barcode: [''],
  batchNumber: [''],
  expiryDate: [''],
  supplierId: ['']
});
```

**Data Enrichment**:
```typescript
// Products are enriched with category names
const enrichedProducts = this.dataTableHelper.enrichProductData(
  transformedResponse.data,
  this.categories
);
```

## Features

### 1. Advanced Data Table

**Enhanced Filtering**:
- Global search across all fields with highlighting
- Column-specific filters (text, date, select)
- Real-time filter application
- Filter persistence and clear options

**Search Highlighting**:
```typescript
highlightText(text: string, highlight: string): string {
  if (!highlight) return text;
  const re = new RegExp(`(${highlight})`, 'gi');
  return text.replace(re, '<mark class="search-highlight">$1</mark>');
}
```

**Sorting & Pagination**:
- Multi-column sorting
- Configurable page sizes (5, 10, 25, 50)
- Current page reporting
- Responsive pagination controls

### 2. CRUD Operations

**Create**:
- Modal-based forms with validation
- Real-time field validation
- Category selection with options
- Success/error notifications

**Read**:
- Paginated data loading
- Real-time data refresh
- Advanced filtering and search
- Detailed view modals

**Update**:
- Pre-populated forms with existing data
- Validation preservation
- Optimistic updates
- Change tracking

**Delete**:
- Confirmation dialogs
- Batch delete operations
- Immediate UI updates
- Error handling

### 3. Data Export

**CSV Export Features**:
- Complete data export
- Formatted headers
- Proper data encoding
- Download with custom filenames

**Categories Export**:
```typescript
private generateCategoryCSV(): string {
  const headers = ['ID', 'Name', 'Description', 'Created At', 'Updated At'];
  const rows = this.categories().map(cat => [
    cat.id.toString(),
    cat.name,
    cat.description || '',
    cat.created_at || '',
    cat.updated_at || ''
  ]);

  return [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\\n');
}
```

**Products Export**:
```typescript
private generateProductCSV(): string {
  const headers = ['SKU ID', 'Name', 'Category', 'Price', 'Barcode', 'Batch Number', 'Expiry Date', 'Supplier ID', 'Created At'];
  // Full product data with enriched category names
}
```

## Architecture

### 1. Module Structure

```
catalog/
├── components/
│   ├── category/
│   │   ├── category.ts           # Component logic
│   │   ├── category.html         # Template
│   │   └── category.scss         # Styles
│   ├── products/
│   │   ├── products.ts           # Component logic
│   │   ├── products.html         # Template
│   │   └── products.scss         # Styles
│   └── layout/
│       └── layout.ts             # Module layout
├── services/
│   ├── category.ts               # Category API service
│   └── product.ts                # Product API service
└── catalog-module.ts             # Module definition
```

### 2. Service Layer

**Category Service** (`services/category.ts`):
```typescript
@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = 'http://localhost:8000/api/v1/catalog';

  getCategories(): Observable<PaginatedResponse<Category>>
  createCategory(data: CreateCategoryRequest): Observable<Category>
  updateCategory(id: number, data: UpdateCategoryRequest): Observable<Category>
  deleteCategory(id: number): Observable<void>
}
```

**Product Service** (`services/product.ts`):
```typescript
@Injectable({
  providedIn: 'root'
})
export class ProductService {
  getProducts(): Observable<PaginatedResponse<Product>>
  createProduct(data: CreateProductRequest): Observable<Product>
  updateProduct(id: string, data: UpdateProductRequest): Observable<Product>
  deleteProduct(id: string): Observable<void>
}
```

### 3. Data Flow

1. **Component Initialization**: Load data from services
2. **User Interaction**: Handle form submissions, table actions
3. **Service Calls**: Execute API operations
4. **State Updates**: Update component signals/state
5. **UI Refresh**: Automatic UI updates through Angular change detection

## API Integration

### Base URL
```
http://localhost:8000/api/v1/catalog
```

### Endpoints

**Categories**:
- `GET /categories/` - List all categories
- `POST /categories/` - Create new category
- `PUT /categories/{id}/` - Update category
- `DELETE /categories/{id}/` - Delete category

**Products**:
- `GET /products/` - List all products
- `POST /products/` - Create new product
- `PUT /products/{id}/` - Update product
- `DELETE /products/{id}/` - Delete product

### Request/Response Formats

**Category Creation**:
```typescript
interface CreateCategoryRequest {
  name: string;
  description?: string;
}
```

**Product Creation**:
```typescript
interface CreateProductRequest {
  name: string;
  category?: number;
  price: number;
  barcode?: string;
  batch_number?: string;
  expiry_date?: string;
  supplier_id?: string;
}
```

## User Interface

### 1. Design System

**Theme Support**:
- Light/Dark mode compatibility
- CSS custom properties for theming
- Consistent color schemes
- Responsive design principles

**Component Styling**:
```scss
.categories-page, .products-page {
  padding: 1rem;
  min-height: 100vh;
  background: var(--bg-color);

  @media (max-width: 768px) {
    padding: 0.5rem;
  }
}

.details-content {
  .detail-row {
    display: flex;
    justify-content: space-between;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--border-color);
  }
}
```

### 2. Interactive Elements

**Enhanced Search**:
- Real-time search with highlighting
- Animated search highlights
- Clear search functionality
- Search across all visible fields

**Advanced Filters**:
- Column-specific filter inputs
- Date range filters
- Text filters with real-time updates
- Clear individual or all filters

**Action Buttons**:
- Create new records
- Export data (CSV)
- Refresh data
- Bulk operations

### 3. Modal Interfaces

**Form Modals**:
- Create/Edit forms in modal dialogs
- Form validation with error messages
- Cancel/Submit actions
- Responsive modal sizing

**Detail View Modals**:
- Read-only detailed views
- Formatted data display
- Close action
- Responsive layout

## Advanced Features

### 1. Search Highlighting

**Implementation**:
```typescript
highlightText(text: string, highlight: string): string {
  if (!highlight || !this.enableSearchHighlighting) {
    return text;
  }
  const re = new RegExp(`(${highlight})`, 'gi');
  return text.replace(re, '<mark class="search-highlight">$1</mark>');
}
```

**Styling**:
```scss
.search-highlight {
  background: linear-gradient(135deg, var(--warning-color), var(--accent-color));
  color: var(--white);
  padding: 0.125rem 0.25rem;
  border-radius: 4px;
  font-weight: 600;
  animation: highlight-pulse 0.3s ease-in-out;
}
```

### 2. Column Filtering

**Text Filters**:
```html
<input
  type="text"
  class="filter-input"
  [placeholder]="getFilterPlaceholder(col)"
  [value]="columnFilters[col.field] || ''"
  (input)="onColumnFilter(col.field, $event)"
/>
```

**Date Filters**:
```html
<input
  type="date"
  class="filter-input date-filter"
  [value]="columnFilters[col.field] || ''"
  (change)="onDateFilter(col.field, $event.target?.value || '')"
/>
```

### 3. Data Export

**CSV Generation**:
- Properly formatted CSV data
- Escaped special characters
- Custom headers and data mapping
- Automatic file download

### 4. Responsive Design

**Breakpoints**:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

**Adaptive Features**:
- Collapsible table columns
- Responsive modal sizing
- Mobile-optimized forms
- Touch-friendly interactions

## Usage Guide

### 1. Category Management

**Creating a Category**:
1. Click "Create Category" button
2. Fill in the category name (required)
3. Add optional description
4. Click "Create" to save

**Editing a Category**:
1. Click "Edit" action in category row
2. Modify fields in the modal
3. Click "Update" to save changes

**Viewing Category Details**:
1. Click "View Details" action
2. Review all category information
3. Close modal when done

**Searching Categories**:
1. Use global search box for all fields
2. Use column filters for specific data
3. Search terms are highlighted in results

**Exporting Categories**:
1. Click "Export" button
2. CSV file downloads automatically
3. Contains all category data

### 2. Product Management

**Creating a Product**:
1. Click "Add Product" button
2. Fill required fields (name, price)
3. Select category (optional)
4. Add barcode, batch info (optional)
5. Click "Create" to save

**Managing Product Data**:
1. Use search to find specific products
2. Filter by category, price, dates
3. Sort by any column
4. Select multiple products for bulk operations

**Product Details**:
- View complete product information
- See enriched category data
- Check creation/update timestamps
- Review all product attributes

### 3. Best Practices

**Data Entry**:
- Always provide clear, descriptive names
- Use consistent category structures
- Include barcodes for inventory tracking
- Set appropriate expiry dates for perishables

**Search & Filter**:
- Use global search for quick lookups
- Combine column filters for precise results
- Clear filters to reset view
- Export filtered data when needed

**Performance**:
- Data tables are paginated for performance
- Filters are applied client-side for speed
- Real-time updates minimize server requests
- Efficient Angular change detection

## Configuration

### 1. Table Configuration

```typescript
// Enable/disable advanced features
<app-prime-data-table
  [enableAdvancedFilters]="true"
  [enableSearchHighlighting]="true"
  [selectionMode]="'multiple'"
  [paginator]="true"
  [rows]="10"
  [rowsPerPageOptions]="[5, 10, 25, 50]"
>
```

### 2. Column Configuration

```typescript
{
  field: 'name',           // Data field
  header: 'Product Name',  // Display header
  sortable: true,          // Enable sorting
  filterable: true,        // Enable filtering
  type: 'text',           // Display type
  width: '25%',           // Column width
  filterType: 'text'      // Filter input type
}
```

### 3. Service Configuration

```typescript
// Update API base URL as needed
private apiUrl = 'http://localhost:8000/api/v1/catalog';
```

## Troubleshooting

### Common Issues

1. **Data not loading**: Check API connection and backend status
2. **Filters not working**: Verify column configuration and filter types
3. **Export failing**: Check data format and browser permissions
4. **Modal not opening**: Verify form initialization and validation

### Performance Optimization

1. **Large datasets**: Implement server-side pagination
2. **Slow searches**: Add debouncing to search inputs
3. **Memory usage**: Clear filters and data when navigating away
4. **API calls**: Implement caching for category data

## Future Enhancements

1. **Advanced Search**: Boolean operators, saved searches
2. **Bulk Operations**: Multi-select edit, delete, export
3. **Data Validation**: Enhanced client-side validation rules
4. **Audit Trail**: Track all data changes with timestamps
5. **Print Support**: Formatted print views for reports
6. **Import Data**: CSV/Excel import functionality
7. **Real-time Updates**: WebSocket integration for live data
8. **Mobile App**: Progressive Web App capabilities