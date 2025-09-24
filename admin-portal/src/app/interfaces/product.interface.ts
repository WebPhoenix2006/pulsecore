export interface Product {
  sku_id: string;
  name: string;
  category?: string; // category UUID
  attributes?: Record<string, string | number | boolean>;
  barcode?: string;
  price: number;
  supplier_id?: string;
  batch_number?: string;
  expiry_date?: string;
  created_at: string;
  updated_at: string;

  // derived for UI
  category_name?: string;
}

export interface CreateProductRequest {
  name: string;
  category?: string;
  attributes?: Record<string, string | number | boolean>;
  barcode?: string;
  price: number;
  supplier_id?: string;
  batch_number?: string;
  expiry_date?: string;
}

export interface UpdateProductRequest {
  name?: string;
  category?: string;
  attributes?: Record<string, string | number | boolean>;
  barcode?: string;
  price?: number;
  supplier_id?: string;
  batch_number?: string;
  expiry_date?: string;
}

// already exists in your project
export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}
