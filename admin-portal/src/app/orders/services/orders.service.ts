import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'X-Tenant-ID': this.getTenantId(),
      'Content-Type': 'application/json',
    });
  }

  private getTenantId(): string {
    return localStorage.getItem('tenant-id') || 'tenant-uuid-placeholder';
  }

  // Order Management
  getOrders(): Observable<{ results: Order[]; count: number; next: string | null; previous: string | null }> {
    return this.http.get<{ results: Order[]; count: number; next: string | null; previous: string | null }>(
      this.baseUrl,
      { headers: this.getHeaders() }
    );
  }

  getOrder(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}${id}/`, { headers: this.getHeaders() });
  }

  createOrder(orderData: CreateOrderRequest): Observable<Order> {
    return this.http.post<Order>(this.baseUrl, orderData, {
      headers: this.getHeaders(),
    });
  }

  updateOrder(id: string, orderData: UpdateOrderRequest): Observable<Order> {
    return this.http.patch<Order>(`${this.baseUrl}${id}/`, orderData, {
      headers: this.getHeaders(),
    });
  }

  deleteOrder(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}${id}/`, { headers: this.getHeaders() });
  }

  getOrderStats(): Observable<OrderStats> {
    // Note: This endpoint might not exist in backend, using aggregated data from orders list
    return this.http.get<OrderStats>(`${this.baseUrl}stats/`, {
      headers: this.getHeaders(),
    });
  }

  // Payment Management - Note: Payments are PaystackTransactions in backend
  getPayments(): Observable<{ results: Payment[]; count: number; next: string | null; previous: string | null }> {
    // This endpoint might not exist, payments are accessed through orders' transactions
    return this.http.get<{ results: Payment[]; count: number; next: string | null; previous: string | null }>(
      `${this.baseUrl}transactions/`,
      { headers: this.getHeaders() }
    );
  }

  getPayment(id: string): Observable<Payment> {
    return this.http.get<Payment>(`${this.baseUrl}transactions/${id}/`, { headers: this.getHeaders() });
  }

  initiatePayment(paymentData: InitiatePaymentRequest): Observable<Payment> {
    return this.http.post<Payment>(Environments.orders.paystackInit, paymentData, {
      headers: this.getHeaders(),
    });
  }

  verifyPayment(reference: string): Observable<Payment> {
    return this.http.get<Payment>(`${Environments.orders.paystackVerify}${reference}/`, {
      headers: this.getHeaders(),
    });
  }

  getOrderPayments(orderId: string): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.baseUrl}${orderId}/transactions/`, {
      headers: this.getHeaders(),
    });
  }

  // Returns Management - Returns are nested under orders
  requestReturn(orderId: string, returnData: ReturnRequest): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}${orderId}/return/`, returnData, {
      headers: this.getHeaders(),
    });
  }

  getOrderReturns(orderId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}${orderId}/returns/`, {
      headers: this.getHeaders(),
    });
  }
}
