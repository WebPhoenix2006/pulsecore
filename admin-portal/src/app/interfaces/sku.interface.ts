export interface SKU {
  sku_id: string;
  tenant_id: string;
  name: string;
  sku_code: string | null;
  category: number;
  attributes?: Record<string, any>;
  barcode: string | null;
  price: number;
  stock_level: number;
  supplier_id: string | null;
  track_batches: boolean;
  reorder_threshold: number | null;
  created_at: string;
  updated_at: string;

  // derived for UI
  category_name?: string;
  supplier_name?: string;
}

export interface CreateSKURequest {
  name: string;
  sku_code?: string | null;
  category: string;
  attributes?: Record<string, any>;
  barcode?: string | null;
  price: number;
  stock_level: number;
  supplier_id?: string | null;
  track_batches?: boolean;
  reorder_threshold?: number | null;
}

export interface UpdateSKURequest {
  name?: string;
  sku_code?: string | null;
  category?: string;
  attributes?: Record<string, any>;
  barcode?: string | null;
  price?: number;
  stock_level?: number;
  supplier_id?: string | null;
  track_batches?: boolean;
  reorder_threshold?: number | null;
}

export interface StockAdjustmentRequest {
  quantity: number;
  reason: 'purchase' | 'sale' | 'return' | 'correction' | 'transfer';
  batch_id?: string;
  reference?: string;
  note?: string;
}

export interface Batch {
  batch_id: string;
  tenant_id: string;
  sku_id: string;
  batch_number: string;
  quantity: number;
  remaining_quantity: number;
  received_at: string | null;
  expiry_date: string | null;
  cost_price: number;
  created_at: string;
}

export interface CreateBatchRequest {
  batch_number: string;
  quantity: number;
  received_at?: string;
  expiry_date?: string;
  cost_price: number;
}
