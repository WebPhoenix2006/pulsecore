export interface Alert {
  alert_id: string;
  tenant_id: string;
  sku_id: string;
  sku_name: string;
  current_stock: number;
  threshold: number | null;
  type: 'low_stock' | 'batch_expiry';
  created_at: string;
  acknowledged: boolean;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
}

export interface CreateAlertRequest {
  sku_id: string;
  type: 'low_stock' | 'batch_expiry';
  threshold?: number;
}

export interface UpdateAlertRequest {
  acknowledged?: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
}

export interface AcknowledgeAlertRequest {
  acknowledged_by: string;
}