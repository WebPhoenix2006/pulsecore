import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { OrdersService } from '../../services/orders.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Payment, PaymentStatus, PaymentProvider } from '../../interfaces/order.interface';

interface PaymentStats {
  totalPayments: number;
  pendingPayments: number;
  successfulPayments: number;
  failedPayments: number;
  totalAmount: number;
  successfulAmount: number;
  pendingAmount: number;
}

@Component({
  selector: 'app-payments',
  standalone: false,
  templateUrl: './payments.html',
  styleUrl: './payments.scss'
})
export class Payments implements OnInit, OnDestroy {
  payments = signal<Payment[]>([]);
  filteredPayments = signal<Payment[]>([]);
  paymentStats = signal<PaymentStats | null>(null);

  isLoading = signal<boolean>(false);
  searchTerm = signal<string>('');
  selectedStatus = signal<string>('all');
  selectedProvider = signal<string>('all');
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  pageSize = 10;

  showPaymentModal = signal<boolean>(false);
  selectedPayment = signal<Payment | null>(null);

  paymentStatuses = Object.values(PaymentStatus);
  paymentProviders = Object.values(PaymentProvider);

  private destroy$ = new Subject<void>();

  constructor(
    private ordersService: OrdersService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadPayments();
    this.calculateStats();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPayments() {
    this.isLoading.set(true);

    this.ordersService.getPayments()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.payments.set(response.results);
          this.applyFilters();
          this.totalPages.set(Math.ceil(response.count / this.pageSize));
          this.calculateStats();
          this.isLoading.set(false);
        },
        error: (error) => {
          this.toastService.showError('Failed to load payments');
          this.isLoading.set(false);
        }
      });
  }

  calculateStats() {
    const payments = this.payments();

    const stats: PaymentStats = {
      totalPayments: payments.length,
      pendingPayments: payments.filter(p => p.status === PaymentStatus.PENDING).length,
      successfulPayments: payments.filter(p => p.status === PaymentStatus.PAID).length,
      failedPayments: payments.filter(p => p.status === PaymentStatus.FAILED).length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      successfulAmount: payments.filter(p => p.status === PaymentStatus.PAID).reduce((sum, p) => sum + p.amount, 0),
      pendingAmount: payments.filter(p => p.status === PaymentStatus.PENDING).reduce((sum, p) => sum + p.amount, 0)
    };

    this.paymentStats.set(stats);
  }

  applyFilters() {
    let filtered = this.payments();

    // Filter by search term
    if (this.searchTerm()) {
      const term = this.searchTerm().toLowerCase();
      filtered = filtered.filter(payment =>
        payment.reference.toLowerCase().includes(term) ||
        payment.orderId.toLowerCase().includes(term)
      );
    }

    // Filter by status
    if (this.selectedStatus() !== 'all') {
      filtered = filtered.filter(payment => payment.status === this.selectedStatus());
    }

    // Filter by provider
    if (this.selectedProvider() !== 'all') {
      filtered = filtered.filter(payment => payment.provider === this.selectedProvider());
    }

    this.filteredPayments.set(filtered);
  }

  onSearchChange() {
    this.applyFilters();
  }

  onStatusChange() {
    this.applyFilters();
  }

  onProviderChange() {
    this.applyFilters();
  }

  viewPaymentDetails(payment: Payment) {
    this.selectedPayment.set(payment);
    this.showPaymentModal.set(true);
  }

  closePaymentModal() {
    this.showPaymentModal.set(false);
    this.selectedPayment.set(null);
  }

  verifyPayment(payment: Payment) {
    this.isLoading.set(true);

    this.ordersService.verifyPayment(payment.reference)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedPayment) => {
          this.loadPayments();
          this.toastService.showSuccess('Payment verified successfully');
        },
        error: (error) => {
          this.toastService.showError('Failed to verify payment');
          this.isLoading.set(false);
        }
      });
  }

  retryPayment(payment: Payment) {
    // TODO: Implement payment retry logic
    this.toastService.showInfo('Payment retry functionality will be implemented soon');
  }

  exportPayments() {
    // TODO: Implement payment export functionality
    this.toastService.showInfo('Payment export functionality will be implemented soon');
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
      // Note: Backend handles pagination automatically, implement URL parameter pagination if needed
    }
  }

  previousPage() {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
      // Note: Backend handles pagination automatically, implement URL parameter pagination if needed
    }
  }

  goToPage(page: number) {
    this.currentPage.set(page);
    // Note: Backend handles pagination automatically, implement URL parameter pagination if needed
  }

  getStatusClass(status: PaymentStatus): string {
    switch (status) {
      case PaymentStatus.PENDING:
        return 'badge-warning';
      case PaymentStatus.PAID:
        return 'badge-success';
      case PaymentStatus.FAILED:
        return 'badge-error';
      case PaymentStatus.REFUNDED:
        return 'badge-secondary';
      default:
        return 'badge-secondary';
    }
  }

  getProviderIcon(provider: PaymentProvider): string {
    switch (provider) {
      case PaymentProvider.PAYSTACK:
        return 'ri-bank-card-line';
      default:
        return 'ri-bank-line';
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

  getSuccessRate(): number {
    const stats = this.paymentStats();
    if (!stats || stats.totalPayments === 0) return 0;
    return Math.round((stats.successfulPayments / stats.totalPayments) * 100);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages(); i++) {
      pages.push(i);
    }
    return pages;
  }

  absValue(value: number): number {
    return Math.abs(value);
  }

  openPaymentLink(url: string) {
    window.open(url, '_blank');
  }
}
