export interface Order {
  order_id: string;
  customer_name: string;
  customer_email?: string;
  status: OrderStatus;
  items: OrderItem[];
  total_amount: number;
  payment_status: string;
  created_at: string;
  updated_at: string;
  tenant_id?: string;
}

export interface OrderItem {
  item_id: string;
  sku_id: string;
  quantity: number;
}

export interface DeliveryAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  landmark?: string;
}

export interface CreateOrderRequest {
  customerId: string;
  items: CreateOrderItem[];
  deliveryAddress?: DeliveryAddress;
  notes?: string;
  discount?: number;
}

export interface CreateOrderItem {
  skuId: string;
  quantity: number;
}

export interface UpdateOrderRequest {
  status?: OrderStatus;
  items?: CreateOrderItem[];
  deliveryAddress?: DeliveryAddress;
  notes?: string;
}

export interface Payment {
  id?: string;
  transaction_id?: string; // Backend uses transaction_id
  order_id?: string;
  order?: string; // Backend returns order as string
  amount: number;
  currency: string;
  status: PaymentStatus | string; // Backend may return 'initialized', 'success', 'failed'
  provider?: PaymentProvider | string;
  reference: string;
  authorization_url?: string;
  accessCode?: string;
  gatewayResponse?: any;
  paidAt?: string;
  paid_at?: string; // Backend uses snake_case
  failedAt?: string;
  failed_at?: string; // Backend uses snake_case
  createdAt?: string;
  created_at?: string; // Backend uses snake_case
  updatedAt?: string;
  updated_at?: string; // Backend uses snake_case
}

export interface InitiatePaymentRequest {
  order_id: string;
  customer_email: string;
  amount: number;
  currency?: string;
  callbackUrl?: string;
}

export interface PaymentVerificationRequest {
  reference: string;
}

export interface ReturnRequest {
  orderId: string;
  reason: string;
  items?: ReturnItem[];
}

export interface ReturnItem {
  orderItemId: string;
  quantity: number;
  reason?: string;
}

export interface ReturnOrderRequest {
  reason: string;
  items?: ReturnItem[];
}

export interface ProcessReturnRequest {
  returnId: string;
  status: ReturnStatus;
  refundAmount?: number;
  notes?: string;
}

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  UNPAID = 'unpaid',
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PaymentProvider {
  PAYSTACK = 'paystack',
}

export enum ReturnStatus {
  REQUESTED = 'requested',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PROCESSED = 'processed',
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  pendingPayments: number;
  failedPayments: number;
}
