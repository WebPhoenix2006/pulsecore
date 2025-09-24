export interface Order {
  id: number;
  user: number;
  status: OrderStatus;
  total_amount: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: number;
  product: number;
  product_name?: string;
  quantity: number;
  price: string;
  total_price: string;
}

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

export interface CreateOrderRequest {
  items: {
    product: number;
    quantity: number;
    price: string;
  }[];
}

export interface UpdateOrderRequest {
  status?: OrderStatus;
}

export interface PaystackInitRequest {
  email: string;
  amount: number; // In kobo (naira * 100)
  order_id: number;
}

export interface PaystackInitResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}