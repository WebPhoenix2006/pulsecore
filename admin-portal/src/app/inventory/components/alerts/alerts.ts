import { Component, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { TableColumn, TableAction } from '../../../shared/components/prime-data-table/prime-data-table';
import { ToastService } from '../../../shared/services/toast.service';
import { Alert, CreateAlertRequest, UpdateAlertRequest } from '../../../interfaces/alert.interface';
import { AlertService } from '../../services/alert.service';
import { SKUService } from '../../services/sku.service';
import { SKU } from '../../../interfaces/sku.interface';
import { PaginatedResponse } from '../../../interfaces/product.interface';
import { FormFieldOption } from '../../../interfaces/form-field-options';

@Component({
  selector: 'app-alerts',
  standalone: false,
  templateUrl: './alerts.html',
  styleUrl: './alerts.scss'
})
export class Alerts implements OnInit {
  alerts = signal<Alert[]>([]);
  skus: SKU[] = [];
  loading = signal(false);
  selectedAlerts: Alert[] = [];

  // Form properties
  modalVisible = false;
  viewModalVisible = false;
  alertForm!: FormGroup;
  skuOptions: FormFieldOption[] = [];
  selectedAlert: Alert | null = null;
  alertTypeOptions: FormFieldOption[] = [
    { label: 'Low Stock', value: 'low_stock' },
    { label: 'Batch Expiry', value: 'batch_expiry' }
  ];

  tableColumns: TableColumn[] = [
    {
      field: 'type',
      header: 'Alert Type',
      sortable: true,
      filterable: true,
      type: 'status',
      width: '15%'
    },
    {
      field: 'sku_name',
      header: 'Product',
      sortable: true,
      filterable: true,
      type: 'text',
      width: '25%'
    },
    {
      field: 'current_stock',
      header: 'Current Stock',
      sortable: true,
      type: 'text',
      width: '15%'
    },
    {
      field: 'threshold',
      header: 'Threshold',
      sortable: true,
      type: 'text',
      width: '15%'
    },
    {
      field: 'created_at',
      header: 'Created',
      sortable: true,
      type: 'date',
      width: '15%'
    },
    {
      field: 'acknowledged',
      header: 'Status',
      sortable: true,
      type: 'status',
      width: '10%'
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
      action: (rowData) => this.onViewAlert(rowData)
    },
    {
      label: 'Acknowledge',
      value: 'acknowledge',
      icon: 'check',
      iconPosition: 'left',
      action: (rowData) => this.acknowledgeAlert(rowData.alert_id)
    },
    {
      label: 'Dismiss',
      value: 'dismiss',
      icon: 'times',
      iconPosition: 'left',
      action: (rowData) => this.dismissAlert(rowData.alert_id)
    },
    {
      label: 'View SKU',
      value: 'view-sku',
      icon: 'external-link',
      iconPosition: 'left',
      action: (rowData) => this.viewSKU(rowData.sku_id)
    }
  ];

  constructor(
    private alertService: AlertService,
    private skuService: SKUService,
    private toastService: ToastService,
    private fb: FormBuilder
  ) {
    this.initializeForm();
  }

  ngOnInit() {
    this.loadSKUs();
    this.loadAlerts();
  }

  private loadSKUs() {
    this.skuService.getSKUs().subscribe({
      next: (response: PaginatedResponse<SKU>) => {
        this.skus = response.results;
        this.skuOptions = this.skus.map(sku => ({
          label: `${sku.name} (${sku.sku_code || 'N/A'})`,
          value: sku.sku_id
        }));
      },
      error: () => this.toastService.showError('Failed to load SKUs'),
    });
  }

  private loadAlerts() {
    this.loading.set(true);
    this.alertService.getAlerts().subscribe({
      next: (alerts: Alert[]) => {
        // Ensure we always have an array
        const alertsArray = Array.isArray(alerts) ? alerts : [];
        console.log('Loaded alerts:', alertsArray);
        this.alerts.set(alertsArray);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load alerts:', error);
        this.toastService.showError('Failed to load alerts');
        this.alerts.set([]); // Set empty array on error
        this.loading.set(false);
      },
    });
  }

  private initializeForm() {
    this.alertForm = this.fb.group({
      sku: ['', [Validators.required]],
      type: ['', [Validators.required]],
      threshold: ['']
    });
  }

  // Form control getters
  get skuControl() { return this.alertForm.get('sku') as FormControl; }
  get typeControl() { return this.alertForm.get('type') as FormControl; }
  get thresholdControl() { return this.alertForm.get('threshold') as FormControl; }

  onCreateAlert() {
    this.alertForm.reset();
    this.modalVisible = true;
  }

  onEditAlert(alert: Alert) {
    // Note: Alerts typically can't be edited, only acknowledged/dismissed
    this.toastService.showInfo(`Alert ${alert.type} can only be acknowledged or dismissed`);
  }

  onSubmitAlert() {
    if (this.alertForm.invalid) {
      return;
    }

    const formValue = this.alertForm.value;
    const alertData: CreateAlertRequest = {
      sku_id: formValue.sku,
      type: formValue.type,
      threshold: formValue.threshold ? parseInt(formValue.threshold) : undefined
    };

    this.loading.set(true);

    this.alertService.createAlert(alertData).subscribe({
      next: (newAlert) => {
        this.loadAlerts(); // Reload to get updated data
        this.toastService.showSuccess('Alert created successfully!');
        this.modalVisible = false;
        this.loading.set(false);
      },
      error: (error) => {
        this.toastService.showError(`Failed to create alert: ${error.error?.message || error.message}`);
        this.loading.set(false);
      }
    });
  }

  onDeleteAlert(id: string) {
    this.loading.set(true);
    this.alertService.deleteAlert(id).subscribe({
      next: () => {
        this.alerts.update((a) => a.filter((alert) => alert.alert_id !== id));
        this.toastService.showSuccess('Alert deleted successfully!');
        this.loading.set(false);
      },
      error: () => {
        this.toastService.showError('Failed to delete alert');
        this.loading.set(false);
      },
    });
  }

  onViewAlert(alert: Alert) {
    this.selectedAlert = alert;
    this.viewModalVisible = true;
  }

  onRefreshData() {
    this.loadAlerts();
  }

  onExportData() {
    const csvData = this.generateAlertCSV();
    this.downloadCSV(csvData, 'alerts.csv');
    this.toastService.showSuccess('Alerts exported successfully!');
  }

  private generateAlertCSV(): string {
    const headers = ['Alert ID', 'Type', 'SKU Name', 'Current Stock', 'Threshold', 'Status', 'Acknowledged By', 'Acknowledged At', 'Created At'];
    const rows = this.alerts().map(alert => [
      alert.alert_id || '',
      alert.type,
      alert.sku_name || '',
      alert.current_stock?.toString() || '',
      alert.threshold?.toString() || '',
      alert.acknowledged ? 'Acknowledged' : 'Pending',
      alert.acknowledged_by || '',
      alert.acknowledged_at || '',
      alert.created_at || ''
    ]);

    return [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
  }

  private downloadCSV(data: string, filename: string): void {
    const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  onSelectionChange(selectedRows: Alert[]) {
    this.selectedAlerts = selectedRows;
    console.log('Selected alerts:', selectedRows);
  }

  acknowledgeAlert(alertId: string) {
    this.alertService.acknowledgeAlert(alertId, {
      acknowledged_by: 'current-user-id' // TODO: Get from auth service
    }).subscribe({
      next: (updated: Alert) => {
        this.alerts.update((a) => a.map((alert) => (alert.alert_id === alertId ? updated : alert)));
        this.toastService.showSuccess('Alert acknowledged successfully!');
        if (this.selectedAlert && this.selectedAlert.alert_id === alertId) {
          this.selectedAlert = updated;
        }
        this.viewModalVisible = false;
      },
      error: () => {
        this.toastService.showError('Failed to acknowledge alert');
      },
    });
  }

  private dismissAlert(alertId: string) {
    this.alertService.dismissAlert(alertId).subscribe({
      next: () => {
        this.alerts.update((a) => a.filter((alert) => alert.alert_id !== alertId));
        this.toastService.showSuccess('Alert dismissed successfully!');
      },
      error: () => {
        this.toastService.showError('Failed to dismiss alert');
      },
    });
  }

  private viewSKU(skuId: string) {
    // Find the SKU from the loaded SKUs
    const sku = this.skus.find(s => s.sku_id === skuId);
    if (sku) {
      // Show SKU details in a toast with more information
      this.toastService.showInfo(`SKU: ${sku.name} | Code: ${sku.sku_code || 'N/A'} | Stock: ${sku.stock_level || 'N/A'}`);
    } else {
      this.toastService.showInfo(`SKU ID: ${skuId} - Navigate to SKU details`);
    }
  }
}