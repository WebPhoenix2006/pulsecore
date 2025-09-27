export interface Order {
  id: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number;
  subtotal: number;
  tax: number;
  discount?: number;
  deliveryFee?: number;
  notes?: string;
  deliveryAddress?: DeliveryAddress;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
  cancelledAt?: string;
  returnRequested?: boolean;
  returnStatus?: ReturnStatus;
  returnReason?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  skuId: string;
  skuName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
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
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: PaymentProvider;
  reference: string;
  authorizationUrl?: string;
  accessCode?: string;
  gatewayResponse?: any;
  paidAt?: string;
  failedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InitiatePaymentRequest {
  orderId: string;
  email: string;
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
  CANCELLED = 'cancelled'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

export enum PaymentProvider {
  PAYSTACK = 'paystack'
}

export enum ReturnStatus {
  REQUESTED = 'requested',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PROCESSED = 'processed'
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