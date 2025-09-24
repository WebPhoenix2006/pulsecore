import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order, CreateOrderRequest, UpdateOrderRequest, PaystackInitRequest, PaystackInitResponse } from '../interfaces/order.interface';
import { PaginatedResponse } from '../interfaces/category.interface';
import { Environments } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  constructor(private http: HttpClient) {}

  // Headers are now handled by the interceptor

  // Get all orders with pagination
  getOrders(page: number = 1, pageSize: number = 10, search?: string): Observable<PaginatedResponse<Order>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString());

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<PaginatedResponse<Order>>(Environments.orders.orders, {
      params
    });
  }

  // Get single order by ID
  getOrder(id: number): Observable<Order> {
    return this.http.get<Order>(`${Environments.orders.orders}${id}/`);
  }

  // Create new order
  createOrder(orderData: CreateOrderRequest): Observable<Order> {
    return this.http.post<Order>(Environments.orders.orders, orderData);
  }

  // Update order
  updateOrder(id: number, orderData: UpdateOrderRequest): Observable<Order> {
    return this.http.patch<Order>(`${Environments.orders.orders}${id}/`, orderData);
  }

  // Delete order
  deleteOrder(id: number): Observable<void> {
    return this.http.delete<void>(`${Environments.orders.orders}${id}/`);
  }

  // Initialize Paystack payment
  initializePaystackPayment(paymentData: PaystackInitRequest): Observable<PaystackInitResponse> {
    return this.http.post<PaystackInitResponse>(Environments.orders.paystackInit, paymentData);
  }

  // Verify Paystack payment
  verifyPaystackPayment(reference: string): Observable<any> {
    return this.http.get<any>(`${Environments.orders.paystackVerify}${reference}/`);
  }
}