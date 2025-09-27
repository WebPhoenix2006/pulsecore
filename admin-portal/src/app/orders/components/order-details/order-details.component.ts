import { Component, OnInit, OnDestroy, input, output, signal } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { OrdersService } from '../../services/orders.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Order, Payment, OrderStatus, PaymentStatus } from '../../interfaces/order.interface';

@Component({
  selector: 'app-order-details',
  standalone: false,
  templateUrl: './order-details.component.html',
  styleUrls: ['./order-details.component.scss']
})
export class OrderDetailsComponent implements OnInit, OnDestroy {
  order = input.required<Order>();
  close = output<void>();

  payments = signal<Payment[]>([]);
  returns = signal<any[]>([]);
  isLoading = signal<boolean>(false);
  activeTab = signal<string>('details');

  private destroy$ = new Subject<void>();

  constructor(
    private ordersService: OrdersService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadOrderPayments();
    this.loadOrderReturns();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadOrderPayments() {
    this.ordersService.getOrderPayments(this.order().id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (payments) => {
          this.payments.set(payments);
        },
        error: (error) => {
          console.error('Failed to load order payments:', error);
        }
      });
  }

  loadOrderReturns() {
    this.ordersService.getOrderReturns(this.order().id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (returns) => {
          this.returns.set(returns);
        },
        error: (error) => {
          console.error('Failed to load order returns:', error);
        }
      });
  }

  initiatePayment() {
    this.isLoading.set(true);

    const paymentData = {
      orderId: this.order().id,
      email: this.order().customerEmail || '',
      amount: this.order().totalAmount,
      currency: 'NGN'
    };

    this.ordersService.initiatePayment(paymentData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (payment) => {
          if (payment.authorizationUrl) {
            window.open(payment.authorizationUrl, '_blank');
          }
          this.loadOrderPayments();
          this.toastService.showSuccess('Payment initiated successfully');
          this.isLoading.set(false);
        },
        error: (error) => {
          this.toastService.showError('Failed to initiate payment');
          this.isLoading.set(false);
        }
      });
  }

  verifyPayment(reference: string) {
    this.isLoading.set(true);

    this.ordersService.verifyPayment(reference)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (payment) => {
          this.loadOrderPayments();
          this.toastService.showSuccess('Payment verified successfully');
          this.isLoading.set(false);
        },
        error: (error) => {
          this.toastService.showError('Failed to verify payment');
          this.isLoading.set(false);
        }
      });
  }

  setActiveTab(tab: string) {
    this.activeTab.set(tab);
  }

  onClose() {
    this.close.emit();
  }

  getStatusClass(status: OrderStatus | PaymentStatus): string {
    switch (status) {
      case 'pending':
        return 'badge-warning';
      case 'processing':
        return 'badge-info';
      case 'delivered':
      case 'paid':
        return 'badge-success';
      case 'cancelled':
      case 'failed':
        return 'badge-error';
      case 'refunded':
        return 'badge-secondary';
      default:
        return 'badge-secondary';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTotalPaid(): number {
    return this.payments()
      .filter(p => p.status === 'paid')
      .reduce((total, payment) => total + payment.amount, 0);
  }

  getOutstandingAmount(): number {
    return Math.max(0, this.order().totalAmount - this.getTotalPaid());
  }

  canInitiatePayment(): boolean {
    return this.order().paymentStatus !== 'paid' &&
           this.order().status !== 'cancelled' &&
           this.getOutstandingAmount() > 0;
  }

  printOrder() {
    window.print();
  }

  downloadInvoice() {
    // TODO: Implement invoice download functionality
    this.toastService.showInfo('Invoice download will be implemented soon');
  }
}