import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { OrdersService } from '../../services/orders.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Order, OrderStatus, OrderStats } from '../../interfaces/order.interface';

@Component({
  selector: 'app-orders',
  standalone: false,
  templateUrl: './orders.html',
  styleUrl: './orders.scss'
})
export class Orders implements OnInit, OnDestroy {
  orders = signal<Order[]>([]);
  filteredOrders = signal<Order[]>([]);
  orderStats = signal<OrderStats | null>(null);

  isLoading = signal<boolean>(false);
  searchTerm = signal<string>('');
  selectedStatus = signal<string>('all');
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  pageSize = 10;

  showCreateOrderModal = signal<boolean>(false);
  selectedOrder = signal<Order | null>(null);
  showOrderDetailsModal = signal<boolean>(false);
  showReturnModal = signal<boolean>(false);

  orderStatuses = Object.values(OrderStatus);

  private destroy$ = new Subject<void>();

  constructor(
    private ordersService: OrdersService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadOrders();
    this.loadOrderStats();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadOrders() {
    this.isLoading.set(true);

    this.ordersService.getOrders()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.orders.set(response.results);
          this.applyFilters();
          this.totalPages.set(Math.ceil(response.count / this.pageSize));
          this.isLoading.set(false);
        },
        error: (error) => {
          this.toastService.showError('Failed to load orders');
          this.isLoading.set(false);
        }
      });
  }

  loadOrderStats() {
    this.ordersService.getOrderStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.orderStats.set(stats);
        },
        error: (error) => {
          console.error('Failed to load order stats:', error);
        }
      });
  }

  applyFilters() {
    let filtered = this.orders();

    // Filter by search term
    if (this.searchTerm()) {
      const term = this.searchTerm().toLowerCase();
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(term) ||
        order.customerName?.toLowerCase().includes(term) ||
        order.customerEmail?.toLowerCase().includes(term)
      );
    }

    // Filter by status
    if (this.selectedStatus() !== 'all') {
      filtered = filtered.filter(order => order.status === this.selectedStatus());
    }

    this.filteredOrders.set(filtered);
  }

  onSearchChange() {
    this.applyFilters();
  }

  onStatusChange() {
    this.applyFilters();
  }

  openCreateOrderModal() {
    this.showCreateOrderModal.set(true);
  }

  closeCreateOrderModal() {
    this.showCreateOrderModal.set(false);
  }

  onOrderCreated() {
    this.closeCreateOrderModal();
    this.loadOrders();
    this.loadOrderStats();
    this.toastService.showSuccess('Order created successfully');
  }

  viewOrderDetails(order: Order) {
    this.selectedOrder.set(order);
    this.showOrderDetailsModal.set(true);
  }

  closeOrderDetailsModal() {
    this.showOrderDetailsModal.set(false);
    this.selectedOrder.set(null);
  }

  updateOrderStatus(order: Order, newStatus: OrderStatus) {
    this.isLoading.set(true);

    this.ordersService.updateOrder(order.id, { status: newStatus })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedOrder) => {
          this.loadOrders();
          this.loadOrderStats();
          this.toastService.showSuccess('Order status updated successfully');
        },
        error: (error) => {
          this.toastService.showError('Failed to update order status');
          this.isLoading.set(false);
        }
      });
  }

  deleteOrder(order: Order) {
    if (confirm('Are you sure you want to delete this order?')) {
      this.isLoading.set(true);

      this.ordersService.deleteOrder(order.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadOrders();
            this.loadOrderStats();
            this.toastService.showSuccess('Order deleted successfully');
          },
          error: (error) => {
            this.toastService.showError('Failed to delete order');
            this.isLoading.set(false);
          }
        });
    }
  }

  openReturnModal(order: Order) {
    this.selectedOrder.set(order);
    this.showReturnModal.set(true);
  }

  closeReturnModal() {
    this.showReturnModal.set(false);
    this.selectedOrder.set(null);
  }

  onReturnRequested() {
    this.closeReturnModal();
    this.loadOrders();
    this.toastService.showSuccess('Return request submitted successfully');
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

  getStatusClass(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.PENDING:
        return 'badge-warning';
      case OrderStatus.PROCESSING:
        return 'badge-info';
      case OrderStatus.DELIVERED:
        return 'badge-success';
      case OrderStatus.CANCELLED:
        return 'badge-error';
      default:
        return 'badge-secondary';
    }
  }

  getPaymentStatusClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'badge-warning';
      case 'paid':
        return 'badge-success';
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
}
