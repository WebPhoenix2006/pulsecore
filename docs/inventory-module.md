# Inventory Module Documentation

## Overview

The Inventory Module is an advanced inventory management system that provides comprehensive SKU (Stock Keeping Unit) management, inventory alerts, stock adjustments, batch tracking, and real-time inventory monitoring. It's designed for sophisticated inventory operations with enterprise-level features.

## Table of Contents

1. [Components](#components)
2. [Advanced Features](#advanced-features)
3. [Architecture](#architecture)
4. [API Integration](#api-integration)
5. [User Interface](#user-interface)
6. [Inventory Operations](#inventory-operations)
7. [Alert Management](#alert-management)
8. [Usage Guide](#usage-guide)

## Components

### 1. SKUs Component (`skus.ts`)

**Location**: `src/app/inventory/components/skus/`

**Purpose**: Complete Stock Keeping Unit management with advanced inventory features

**Core Features**:
- ✅ Full CRUD operations for SKUs
- ✅ **Stock Level Management** with real-time adjustments
- ✅ **Batch Tracking** with manufacturing and expiry dates
- ✅ **Reorder Threshold Management** with automated alerts
- ✅ **Barcode Integration** for inventory scanning
- ✅ **Supplier Management** with supplier associations
- ✅ **Category Integration** with enriched category display
- ✅ **Advanced Search & Filtering** with highlighting
- ✅ **Multi-Modal Interface** (Create, Edit, View, Adjust Stock, View Batches)
- ✅ **CSV Export** with complete SKU data

**Advanced Operations**:

**Stock Adjustment Modal**:
```typescript
adjustStockForm = this.fb.group({
  adjustmentType: ['', Validators.required],  // increase/decrease/set
  quantity: ['', [Validators.required, Validators.min(1)]],
  reason: ['', Validators.required]
});

adjustmentTypeOptions: FormFieldOption[] = [
  { label: 'Increase Stock', value: 'increase' },
  { label: 'Decrease Stock', value: 'decrease' },
  { label: 'Set Absolute Value', value: 'set' }
];
```

**Batch Tracking System**:
```typescript
private loadBatches(skuId: string) {
  this.batchesLoading = true;
  // Load batch data with manufacturing dates, expiry dates, quantities, status
  this.batches = [
    {
      batch_number: 'BATCH-001',
      quantity: 50,
      manufacturing_date: new Date('2024-01-15'),
      expiry_date: new Date('2025-01-15'),
      status: 'active'
    }
  ];
}
```

**Form Structure**:
```typescript
skuForm = this.fb.group({
  name: ['', Validators.required],
  skuCode: [''],                    // Auto-generated if empty
  category: ['', Validators.required],
  price: ['', [Validators.required, Validators.min(0)]],
  stockLevel: ['', [Validators.required, Validators.min(0)]],
  reorderThreshold: [''],           // Minimum stock level
  barcode: [''],
  supplierId: [''],
  trackBatches: [false]             // Enable/disable batch tracking
});
```

### 2. Alerts Component (`alerts.ts`)

**Location**: `src/app/inventory/components/alerts/`

**Purpose**: Comprehensive inventory alert management and monitoring system

**Alert Types**:
- **Low Stock Alerts**: Triggered when stock falls below reorder threshold
- **Batch Expiry Alerts**: Triggered for approaching expiry dates
- **Custom Alerts**: User-defined alert conditions

**Key Features**:
- ✅ **Real-time Alert Monitoring** with status tracking
- ✅ **Alert Acknowledgment** with user tracking
- ✅ **Alert Dismissal** for irrelevant alerts
- ✅ **SKU Integration** with direct SKU viewing
- ✅ **Alert Creation** for custom monitoring
- ✅ **Advanced Filtering** by type, status, SKU
- ✅ **Detailed Alert Views** with complete information
- ✅ **CSV Export** with alert history

**Alert Management**:
```typescript
acknowledgeAlert(alertId: string) {
  this.alertService.acknowledgeAlert(alertId, {
    acknowledged_by: 'current-user-id' // Integration with auth service
  }).subscribe({
    next: (updated: Alert) => {
      // Update local state and UI
      this.alerts.update(alerts =>
        alerts.map(alert => alert.alert_id === alertId ? updated : alert)
      );
    }
  });
}
```

**Alert Creation Form**:
```typescript
alertForm = this.fb.group({
  sku: ['', Validators.required],
  type: ['', Validators.required],    // low_stock, batch_expiry
  threshold: ['']                     // For low stock alerts
});

alertTypeOptions: FormFieldOption[] = [
  { label: 'Low Stock', value: 'low_stock' },
  { label: 'Batch Expiry', value: 'batch_expiry' }
];
```

## Advanced Features

### 1. Stock Management System

**Real-time Stock Adjustments**:
```typescript
onSubmitStockAdjustment() {
  const formValue = this.adjustStockForm.value;
  const currentStock = this.selectedSku.stock_level;
  let newStock = currentStock;

  switch (formValue.adjustmentType) {
    case 'increase':
      newStock = currentStock + parseInt(formValue.quantity);
      break;
    case 'decrease':
      newStock = Math.max(0, currentStock - parseInt(formValue.quantity));
      break;
    case 'set':
      newStock = parseInt(formValue.quantity);
      break;
  }

  // Update local state immediately for responsive UI
  this.skus.update(skus =>
    skus.map(sku =>
      sku.sku_id === this.selectedSku!.sku_id
        ? { ...sku, stock_level: newStock }
        : sku
    )
  );
}
```

**Stock Adjustment UI**:
```html
<div class="current-stock-info">
  <p><strong>{{ selectedSku.name }}</strong></p>
  <p>Current Stock: <span class="stock-level">{{ selectedSku.stock_level }}</span></p>
</div>

<app-form-field
  label="Adjustment Type"
  type="select"
  [required]="true"
  [formControl]="adjustmentTypeControl"
  [options]="adjustmentTypeOptions"
></app-form-field>
```

### 2. Batch Tracking System

**Batch Management Interface**:
```html
<div class="batches-table">
  <p-table [value]="batches" [loading]="batchesLoading">
    <ng-template pTemplate="header">
      <tr>
        <th>Batch Number</th>
        <th>Quantity</th>
        <th>Manufacturing Date</th>
        <th>Expiry Date</th>
        <th>Status</th>
      </tr>
    </ng-template>
    <ng-template pTemplate="body" let-batch>
      <tr>
        <td>{{ batch.batch_number || 'N/A' }}</td>
        <td>{{ batch.quantity || 0 }}</td>
        <td>{{ batch.manufacturing_date ? (batch.manufacturing_date | date:'shortDate') : 'N/A' }}</td>
        <td>{{ batch.expiry_date ? (batch.expiry_date | date:'shortDate') : 'N/A' }}</td>
        <td>
          <span [class]="'batch-status ' + (batch.status || 'active')">
            {{ batch.status || 'Active' }}
          </span>
        </td>
      </tr>
    </ng-template>
  </p-table>
</div>
```

**Batch Status Styling**:
```scss
.batch-status {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8em;
  text-transform: uppercase;
  font-weight: 600;

  &.active {
    background: var(--success-light);
    color: var(--success-color);
  }

  &.expired {
    background: var(--danger-light);
    color: var(--danger-color);
  }

  &.low {
    background: var(--warning-light);
    color: var(--warning-color);
  }
}
```

### 3. Alert System Architecture

**Alert Types & Configuration**:
```typescript
interface Alert {
  alert_id: string;
  type: 'low_stock' | 'batch_expiry';
  sku_id: string;
  sku_name: string;
  current_stock?: number;
  threshold?: number;
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  created_at: string;
}
```

**Alert Processing Flow**:
1. **Alert Generation**: Backend monitors inventory conditions
2. **Real-time Updates**: Frontend receives alert notifications
3. **User Interaction**: Users can view, acknowledge, or dismiss alerts
4. **State Management**: Local state updates for responsive UI
5. **Persistence**: All actions synced with backend

### 4. Enhanced Search & Filtering

**Multi-field Search with Highlighting**:
- Global search across all SKU fields
- Individual column filters for precise results
- Real-time search highlighting with animations
- Search term preservation during navigation

**Advanced Filter Types**:
```typescript
tableColumns: TableColumn[] = [
  {
    field: 'name',
    header: 'SKU Name',
    filterable: true,
    filterType: 'text'           // Text input filter
  },
  {
    field: 'created_at',
    header: 'Created',
    filterable: true,
    filterType: 'date'           // Date picker filter
  },
  {
    field: 'track_batches',
    header: 'Track Batches',
    filterable: true,
    filterType: 'select',        // Dropdown filter
    filterOptions: [
      { label: 'Yes', value: true },
      { label: 'No', value: false }
    ]
  }
];
```

## Architecture

### 1. Module Structure

```
inventory/
├── components/
│   ├── skus/
│   │   ├── skus.ts               # SKU management component
│   │   ├── skus.html             # SKU template with modals
│   │   └── skus.scss             # SKU styles
│   ├── alerts/
│   │   ├── alerts.ts             # Alert management component
│   │   ├── alerts.html           # Alert template
│   │   └── alerts.scss           # Alert styles
│   └── layout/
│       └── layout.ts             # Module layout
├── services/
│   ├── sku.service.ts            # SKU API service
│   └── alert.service.ts          # Alert API service
└── inventory-module.ts           # Module definition
```

### 2. Service Layer

**SKU Service** (`services/sku.service.ts`):
```typescript
@Injectable({
  providedIn: 'root'
})
export class SKUService {
  private apiUrl = 'http://localhost:8000/api/v1/inventory';

  getSKUs(): Observable<PaginatedResponse<SKU>>
  createSKU(data: CreateSKURequest): Observable<SKU>
  updateSKU(id: string, data: UpdateSKURequest): Observable<SKU>
  deleteSKU(id: string): Observable<void>
  adjustStock(id: string, adjustment: StockAdjustment): Observable<SKU>
  getBatches(skuId: string): Observable<Batch[]>
}
```

**Alert Service** (`services/alert.service.ts`):
```typescript
@Injectable({
  providedIn: 'root'
})
export class AlertService {
  getAlerts(): Observable<Alert[]>
  createAlert(data: CreateAlertRequest): Observable<Alert>
  acknowledgeAlert(id: string, data: AcknowledgeAlertRequest): Observable<Alert>
  dismissAlert(id: string): Observable<void>
  deleteAlert(id: string): Observable<void>
}
```

### 3. State Management

**Angular Signals for Reactive State**:
```typescript
// SKU Component State
skus = signal<SKU[]>([]);
loading = signal(false);
selectedSku: SKU | null = null;
adjustStockModalVisible = false;
viewBatchesModalVisible = false;

// Alert Component State
alerts = signal<Alert[]>([]);
selectedAlert: Alert | null = null;
viewModalVisible = false;
```

**Real-time Updates**:
```typescript
// Optimistic updates for better UX
this.skus.update(skus =>
  skus.map(sku => sku.sku_id === updatedId ? updatedSku : sku)
);

// Error handling with rollback
.catch(error => {
  this.skus.update(skus => originalSkus); // Rollback on error
  this.toastService.showError('Update failed');
});
```

## API Integration

### Base URL
```
http://localhost:8000/api/v1/inventory
```

### SKU Endpoints

**CRUD Operations**:
- `GET /skus/` - List all SKUs with pagination
- `POST /skus/` - Create new SKU
- `PUT /skus/{id}/` - Update SKU
- `DELETE /skus/{id}/` - Delete SKU

**Advanced Operations**:
- `POST /skus/{id}/adjust-stock/` - Adjust stock levels
- `GET /skus/{id}/batches/` - Get batch information
- `POST /skus/{id}/batches/` - Create new batch

### Alert Endpoints

- `GET /alerts/` - List all alerts
- `POST /alerts/` - Create new alert
- `PUT /alerts/{id}/acknowledge/` - Acknowledge alert
- `DELETE /alerts/{id}/` - Dismiss/delete alert

### Request/Response Formats

**SKU Creation**:
```typescript
interface CreateSKURequest {
  name: string;
  sku_code?: string;
  category: number;
  price: number;
  stock_level: number;
  reorder_threshold?: number;
  barcode?: string;
  supplier_id?: string;
  track_batches: boolean;
}
```

**Stock Adjustment**:
```typescript
interface StockAdjustmentRequest {
  adjustment_type: 'increase' | 'decrease' | 'set';
  quantity: number;
  reason: string;
  adjusted_by: string;
}
```

**Alert Creation**:
```typescript
interface CreateAlertRequest {
  sku_id: string;
  type: 'low_stock' | 'batch_expiry';
  threshold?: number;
}
```

## User Interface

### 1. Multi-Modal Design

**SKU Management Modals**:
1. **Create/Edit SKU**: Full form with all SKU attributes
2. **View Details**: Read-only detailed SKU information
3. **Adjust Stock**: Stock level modification with audit trail
4. **View Batches**: Batch tracking and status monitoring

**Modal Transitions**:
```scss
.modal-enter {
  opacity: 0;
  transform: translateY(-50px) scale(0.95);
}

.modal-enter-active {
  opacity: 1;
  transform: translateY(0) scale(1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 2. Advanced Data Visualization

**Stock Level Indicators**:
```html
<div class="current-stock-info">
  <p><strong>{{ selectedSku.name }}</strong></p>
  <p>Current Stock: <span class="stock-level">{{ selectedSku.stock_level }}</span></p>
  <div class="stock-indicator" [class.low]="isLowStock(selectedSku)">
    <div class="stock-bar" [style.width.%]="getStockPercentage(selectedSku)"></div>
  </div>
</div>
```

**Alert Status Badges**:
```html
<span [class]="'alert-status ' + (selectedAlert.acknowledged ? 'acknowledged' : 'pending')">
  {{ selectedAlert.acknowledged ? 'Acknowledged' : 'Pending' }}
</span>
```

### 3. Responsive Design

**Mobile-Optimized Tables**:
```scss
@media (max-width: 768px) {
  .skus-page, .alerts-page {
    padding: 0.5rem;

    .prime-table-container {
      .table-header {
        flex-direction: column;
        gap: 1rem;
      }

      .search-wrapper {
        order: -1;
        width: 100%;
      }
    }
  }
}
```

## Inventory Operations

### 1. Stock Management Workflow

**Stock Adjustment Process**:
1. **Select SKU**: Choose SKU from table or search
2. **Open Adjustment Modal**: Click "Adjust Stock" action
3. **Review Current Stock**: View current stock level and details
4. **Select Adjustment Type**: Increase, Decrease, or Set Absolute
5. **Enter Quantity**: Specify adjustment amount
6. **Provide Reason**: Document the adjustment reason
7. **Submit**: Apply the adjustment with audit trail

**Stock Level Monitoring**:
```typescript
isLowStock(sku: SKU): boolean {
  return sku.reorder_threshold &&
         sku.stock_level <= sku.reorder_threshold;
}

getStockPercentage(sku: SKU): number {
  if (!sku.reorder_threshold) return 100;
  return Math.min(100, (sku.stock_level / (sku.reorder_threshold * 2)) * 100);
}
```

### 2. Batch Tracking Operations

**Batch Information Display**:
- Batch number identification
- Quantity tracking per batch
- Manufacturing date records
- Expiry date monitoring
- Status indicators (Active, Expired, Low)

**Batch-Enabled SKU Features**:
```html
<div *ngIf="selectedSku.track_batches" class="batches-table">
  <!-- Full batch tracking interface -->
</div>

<div *ngIf="!selectedSku.track_batches" class="no-batches">
  <p>Batch tracking is not enabled for this SKU.</p>
  <p>Enable batch tracking in SKU settings to view batch information.</p>
</div>
```

### 3. Reorder Management

**Automatic Reorder Alerts**:
- Monitor stock levels against reorder thresholds
- Generate low stock alerts automatically
- Visual indicators for items needing reorder
- Integration with alert system

**Reorder Threshold Configuration**:
```typescript
// In SKU form
reorderThreshold: ['', Validators.min(0)]

// Alert generation logic
if (sku.stock_level <= sku.reorder_threshold) {
  generateLowStockAlert(sku);
}
```

## Alert Management

### 1. Alert Lifecycle

**Alert States**:
1. **Created**: New alert generated by system
2. **Pending**: Alert awaiting user action
3. **Acknowledged**: User has reviewed and acknowledged
4. **Dismissed**: Alert marked as irrelevant
5. **Resolved**: Underlying condition resolved

**Alert Actions**:
```typescript
// Acknowledge alert
acknowledgeAlert(alertId: string) {
  this.alertService.acknowledgeAlert(alertId, {
    acknowledged_by: this.getCurrentUser(),
    acknowledged_at: new Date().toISOString()
  });
}

// Dismiss alert
dismissAlert(alertId: string) {
  this.alertService.dismissAlert(alertId);
}
```

### 2. Alert Types

**Low Stock Alerts**:
- Triggered when stock falls below reorder threshold
- Include current stock level and threshold
- Link to affected SKU for immediate action
- Can be acknowledged or dismissed

**Batch Expiry Alerts**:
- Generated for approaching expiry dates
- Include batch information and expiry timeline
- Allow batch-specific actions
- Support bulk batch operations

### 3. Alert Filtering & Search

**Advanced Alert Filters**:
```typescript
// Filter by alert type
alertTypeFilter: 'low_stock' | 'batch_expiry' | 'all'

// Filter by status
statusFilter: 'pending' | 'acknowledged' | 'all'

// Filter by SKU
skuFilter: string

// Date range filters
dateRangeFilter: { start: Date, end: Date }
```

## Usage Guide

### 1. SKU Management

**Creating a New SKU**:
1. Click "Create SKU" button
2. Fill in required information:
   - SKU Name (required)
   - Category (required)
   - Price (required)
   - Initial Stock Level (required)
3. Configure optional settings:
   - SKU Code (auto-generated if empty)
   - Reorder Threshold
   - Barcode
   - Supplier ID
   - Enable Batch Tracking
4. Click "Create" to save

**Managing Stock Levels**:
1. Find SKU in table or use search
2. Click "Adjust Stock" action
3. Choose adjustment type:
   - **Increase**: Add to current stock
   - **Decrease**: Subtract from current stock
   - **Set**: Set exact stock level
4. Enter quantity and reason
5. Submit adjustment

**Viewing Batch Information**:
1. Select SKU with batch tracking enabled
2. Click "View Batches" action
3. Review batch details:
   - Batch numbers and quantities
   - Manufacturing and expiry dates
   - Current status of each batch
4. Take action based on batch status

### 2. Alert Management

**Responding to Alerts**:
1. Review alert details in the alerts table
2. Use filters to focus on specific alert types
3. Click "View Details" for complete information
4. Take appropriate action:
   - **Acknowledge**: Mark as reviewed
   - **Dismiss**: Remove irrelevant alerts
   - **View SKU**: Go directly to affected SKU

**Creating Custom Alerts**:
1. Click "Create Alert" button
2. Select target SKU from dropdown
3. Choose alert type (Low Stock or Batch Expiry)
4. Set threshold for low stock alerts
5. Submit to create monitoring alert

### 3. Advanced Operations

**Bulk Operations**:
- Select multiple SKUs or alerts using checkboxes
- Apply bulk actions like export or delete
- Use global filters for precise selection

**Data Export**:
- Export complete SKU data with all attributes
- Export alert history with timestamps
- Choose filtered or complete datasets
- Download as CSV for external analysis

**Search & Filter Best Practices**:
- Use global search for quick SKU lookup by name or code
- Apply column filters for specific data ranges
- Combine multiple filters for precise results
- Save commonly used filter combinations

## Performance & Optimization

### 1. Data Loading Strategies

**Pagination**: Tables are paginated to handle large datasets efficiently
**Lazy Loading**: Batch data loaded on-demand when viewing batches
**Caching**: Category and supplier data cached for form dropdowns
**Optimistic Updates**: UI updates immediately with rollback on errors

### 2. Search Optimization

**Client-side Filtering**: Fast filtering for loaded data
**Debounced Search**: Prevents excessive API calls during typing
**Indexed Searches**: Efficient searching across multiple fields
**Highlighted Results**: Visual feedback for search terms

### 3. Memory Management

**Component Cleanup**: Subscriptions properly unsubscribed
**Signal Updates**: Efficient state management with Angular signals
**Modal State**: Modal data cleared when closed
**Filter Reset**: Filters cleared when navigating away

## Security & Audit

### 1. Data Protection

**Input Validation**: All forms validated client and server-side
**XSS Prevention**: Safe innerHTML rendering for highlights
**CSRF Protection**: API calls include proper authentication
**Data Sanitization**: User inputs properly escaped

### 2. Audit Trail

**Stock Adjustments**: All adjustments logged with user and reason
**Alert Actions**: Acknowledgments and dismissals tracked
**Data Changes**: Create, update, delete operations logged
**User Attribution**: All actions linked to authenticated users

## Troubleshooting

### Common Issues

1. **Stock adjustments not saving**: Check network connection and user permissions
2. **Batch data not loading**: Verify SKU has batch tracking enabled
3. **Alerts not appearing**: Check alert generation settings and thresholds
4. **Search highlighting not working**: Verify search highlighting is enabled

### Performance Issues

1. **Slow table loading**: Implement server-side pagination for large datasets
2. **Search lag**: Add debouncing to search inputs
3. **Memory usage**: Clear component state when navigating
4. **API timeouts**: Implement retry logic for failed requests

### Data Integrity

1. **Stock level discrepancies**: Audit stock adjustment history
2. **Missing alerts**: Review alert generation criteria
3. **Batch data inconsistencies**: Verify batch tracking configuration
4. **Category mismatches**: Check category data synchronization

## Future Enhancements

1. **Advanced Analytics**: Stock movement analysis and forecasting
2. **Mobile App**: Barcode scanning and mobile inventory management
3. **Integration APIs**: Connect with external inventory systems
4. **Automated Reordering**: Automatic purchase order generation
5. **Multi-location Support**: Inventory tracking across multiple warehouses
6. **Reporting Dashboard**: Visual analytics and inventory insights
7. **Real-time Sync**: WebSocket integration for live inventory updates
8. **AI-Powered Insights**: Predictive analytics for inventory optimization