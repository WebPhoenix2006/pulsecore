import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Environments } from '../../../environments/environment';
import {
  Order,
  CreateOrderRequest,
  UpdateOrderRequest,
  Payment,
  InitiatePaymentRequest,
  PaymentVerificationRequest,
  ReturnRequest,
  ProcessReturnRequest,
  OrderStats,
} from '../interfaces/order.interface';

@Injectable({
  providedIn: 'root',
})
export class OrdersService {
  private readonly baseUrl = Environments.orders.orders;

  constructor(private http: HttpClient) {}

  // Order Management
  getOrders(): Observable<{ results: Order[]; count: number; next: string | null; previous: string | null }> {
    return this.http.get<{ results: Order[]; count: number; next: string | null; previous: string | null }>(
      this.baseUrl
    );
  }

  getOrder(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}${id}/`);
  }

  createOrder(orderData: CreateOrderRequest): Observable<Order> {
    return this.http.post<Order>(this.baseUrl, orderData);
  }

  updateOrder(id: string, orderData: UpdateOrderRequest): Observable<Order> {
    return this.http.patch<Order>(`${this.baseUrl}${id}/`, orderData);
  }

  deleteOrder(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}${id}/`);
  }

  getOrderStats(): Observable<OrderStats> {
    // Note: This endpoint might not exist in backend, using aggregated data from orders list
    return this.http.get<OrderStats>(`${this.baseUrl}stats/`);
  }

  // Payment Management - Note: Payments are PaystackTransactions in backend
  getPayments(): Observable<{ results: Payment[]; count: number; next: string | null; previous: string | null }> {
    // This endpoint might not exist, payments are accessed through orders' transactions
    return this.http.get<{ results: Payment[]; count: number; next: string | null; previous: string | null }>(
      `${this.baseUrl}transactions/`
    );
  }

  getPayment(id: string): Observable<Payment> {
    return this.http.get<Payment>(`${this.baseUrl}transactions/${id}/`);
  }

  initiatePayment(paymentData: InitiatePaymentRequest): Observable<Payment> {
    return this.http.post<Payment>(Environments.orders.paystackInit, paymentData);
  }

  verifyPayment(reference: string): Observable<Payment> {
    return this.http.get<Payment>(`${Environments.orders.paystackVerify}${reference}/`);
  }

  getOrderPayments(orderId: string): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.baseUrl}${orderId}/transactions/`);
  }

  // Returns Management - Returns are nested under orders
  requestReturn(orderId: string, returnData: ReturnRequest): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}${orderId}/return/`, returnData);
  }

  getOrderReturns(orderId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}${orderId}/returns/`);
  }
}