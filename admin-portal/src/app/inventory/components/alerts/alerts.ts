import { Component, signal, OnInit, ViewChild } from '@angular/core';
import { TableConfig, TableData } from '../../../interfaces/table-config.interface';
import { ReusableDataTable } from '../../../shared/components/reusable-data-table/reusable-data-table';
import { ToastService } from '../../../shared/services/toast.service';
import { Alert, CreateAlertRequest, UpdateAlertRequest } from '../../../interfaces/alert.interface';
import { AlertService } from '../../services/alert.service';
import { alertTableConfig } from '../../config/alert-table.config';
import { SKUService } from '../../services/sku.service';
import { SKU } from '../../../interfaces/sku.interface';
import { PaginatedResponse } from '../../../interfaces/product.interface';

@Component({
  selector: 'app-alerts',
  standalone: false,
  templateUrl: './alerts.html',
  styleUrl: './alerts.scss'
})
export class Alerts implements OnInit {
  @ViewChild(ReusableDataTable) dataTable!: ReusableDataTable;

  tableConfig: TableConfig = alertTableConfig;
  alerts = signal<Alert[]>([]);
  skus: SKU[] = [];
  loading = signal(false);

  constructor(
    private alertService: AlertService,
    private skuService: SKUService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadSKUs();
    this.loadAlerts();
  }

  private loadSKUs() {
    this.skuService.getSKUs().subscribe({
      next: (response: PaginatedResponse<SKU>) => {
        this.skus = response.results;
        const skuField = this.tableConfig.formFields.find((f) => f.field === 'sku_id');
        if (skuField) {
          skuField.options = this.skus.map((sku) => ({
            value: sku.sku_id,
            label: `${sku.name} (${sku.sku_code})`,
          }));
        }
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

  onCreateAlert(data: TableData) {
    this.loading.set(true);
    const payload: CreateAlertRequest = {
      sku_id: data['sku_id'],
      type: data['type'] as 'low_stock' | 'batch_expiry',
      threshold: data['threshold'] || undefined,
    };

    this.alertService.createAlert(payload).subscribe({
      next: (created: Alert) => {
        this.alerts.update((a) => [...a, created]);
        this.dataTable.onOperationSuccess();
        this.toastService.showSuccess('Alert created successfully!');
        this.loading.set(false);
      },
      error: () => {
        this.toastService.showError('Failed to create alert');
        this.dataTable.onOperationError();
        this.loading.set(false);
      },
    });
  }

  onEditAlert(event: { id: string; data: TableData }) {
    this.loading.set(true);

    // Debug logging to check the ID
    console.log('Alert Edit event:', event);
    console.log('Alert Event ID:', event.id);

    const updateData: UpdateAlertRequest = {
      acknowledged: event.data['acknowledged'],
      acknowledged_by: event.data['acknowledged_by'],
      acknowledged_at: event.data['acknowledged_at'],
    };

    // Use the correct ID from the event
    const alertId = event.id;
    if (!alertId) {
      this.toastService.showError('Alert ID is missing');
      this.loading.set(false);
      return;
    }

    this.alertService.updateAlert(alertId, updateData).subscribe({
      next: (updated: Alert) => {
        this.alerts.update((a) => a.map((alert) => (alert.alert_id === alertId ? updated : alert)));
        this.dataTable.onOperationSuccess();
        this.toastService.showSuccess('Alert updated successfully!');
        this.loading.set(false);
      },
      error: () => {
        this.toastService.showError('Failed to update alert');
        this.dataTable.onOperationError();
        this.loading.set(false);
      },
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

  onViewAlert(alert: TableData) {
    this.toastService.showInfo(`Viewing details for alert: ${alert['type']}`);
  }

  onCustomAction(event: { action: string; item: TableData }) {
    const alert = event.item as Alert;

    switch (event.action) {
      case 'acknowledge':
        this.acknowledgeAlert(alert.alert_id);
        break;
      case 'dismiss':
        this.dismissAlert(alert.alert_id);
        break;
      case 'view-sku':
        this.viewSKU(alert.sku_id);
        break;
      default:
        this.toastService.showInfo(`Custom action: ${event.action}`);
    }
  }

  private acknowledgeAlert(alertId: string) {
    this.alertService.acknowledgeAlert(alertId, {
      acknowledged_by: 'current-user-id' // TODO: Get from auth service
    }).subscribe({
      next: (updated: Alert) => {
        this.alerts.update((a) => a.map((alert) => (alert.alert_id === alertId ? updated : alert)));
        this.toastService.showSuccess('Alert acknowledged successfully!');
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
    // TODO: Navigate to SKU details or implement SKU viewing
    this.toastService.showInfo(`Navigating to SKU: ${skuId}`);
  }
}