export interface DashboardData {
  stock_total: number;
  low_stock_count: number;
  stockout_count: number;
  sales_count: number;
  revenue_total: string;
  top_skus: TopSKU[];
  revenue_trend: TrendData[];
  stock_trend: TrendData[];
}

export interface TopSKU {
  sku_id: string;
  sku_name: string;
  total_sold: number;
  revenue: string;
}

export interface TrendData {
  date: string | Date;
  value: number | string;
}

export interface SalesData {
  date: string;
  total_orders: number;
  total_items: number;
  total_revenue: string;
  top_skus: TopSKU[];
}

export interface StockData {
  date: string;
  total_stock: number;
  low_stock_count: number;
  stockout_count: number;
}

export interface StockoutIncident {
  incident_date: string;
  sku_name: string;
  note: string;
  order_id?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface DateRangeFilter {
  start_date?: string;
  end_date?: string;
}

export interface ExportParams extends DateRangeFilter {
  metric: 'sales' | 'stock' | 'stockouts';
}
