// sidebar.component.ts
import { Component, input, OnInit, output, signal, OnDestroy, HostListener } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { LogoutResponseInterface } from '../../../interfaces/auth/logout-response.interface';
import { SlowNetworkService } from '../../services/slow-network.service';
import { filter, Subject, takeUntil } from 'rxjs';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
  badge?: string;
  isActive?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss'],
})
export class Sidebar implements OnInit, OnDestroy {
  menuItems: MenuItem[] = [];
  activeAccordions: Set<string> = new Set();
  currentRoute: string = '';
  isLoading = signal<boolean>(false);
  showMobileBackdrop = signal<boolean>(false);

  // Input and Output properties
  isLeftsidebarCollased = input.required<boolean>();
  toggleState = output<boolean>();

  // Destroy subject for cleanup
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private authService: AuthService,
    private toaster: ToastService,
    private slowNetwork: SlowNetworkService
  ) {}

  ngOnInit() {
    this.initializeMenuItems();
    this.currentRoute = this.router.url;

    // Listen to route changes with proper cleanup
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.url;
        this.updateActiveStates();
      });

    // Initial active state update
    this.updateActiveStates();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Handle window resize for responsive behavior
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (event.target.innerWidth > 768 && this.showMobileBackdrop()) {
      this.showMobileBackdrop.set(false);
    }
  }

  // Handle escape key to close sidebar on mobile
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: Event) {
    const keyboardEvent = event as KeyboardEvent;
    if (this.showMobileBackdrop()) {
      this.closeSidebar();
    }
  }

  toggleSidebarState(): void {
    const newState = !this.isLeftsidebarCollased();
    this.toggleState.emit(newState);

    // Handle mobile backdrop
    if (window.innerWidth <= 768) {
      this.showMobileBackdrop.set(newState);
    }
  }

  closeSidebar(): void {
    this.toggleState.emit(true);
    this.showMobileBackdrop.set(false);
  }

  initializeMenuItems() {
    this.menuItems = [
      // {
      //   id: 'dashboard',
      //   label: 'Dashboard',
      //   icon: 'ri-dashboard-line',
      //   route: '/dashboard',
      // },
      {
        id: 'orders',
        label: 'Orders',
        icon: 'ri-bill-line',
        route: '/orders',
        badge: '5',
      },
      {
        id: 'catalog',
        label: 'Catalog',
        icon: 'ri-apps-2-line',
        children: [
          {
            id: 'categories',
            label: 'Categories',
            icon: 'ri-price-tag-3-line',
            route: '/catalog/categories',
          },
          {
            id: 'products',
            label: 'Products',
            icon: 'ri-archive-2-line',
            route: '/catalog/products',
          },
        ],
      },
      {
        id: 'analytics',
        label: 'Analytics',
        icon: 'ri-bar-chart-2-line',
        children: [
          {
            id: 'sales',
            label: 'Sales Report',
            icon: 'ri-money-dollar-circle-line',
            route: '/analytics/sales',
          },
          {
            id: 'performance',
            label: 'Performance',
            icon: 'ri-line-chart-line',
            route: '/analytics/performance',
          },
          {
            id: 'customer-insights',
            label: 'Customer Insights',
            icon: 'ri-team-line',
            route: '/analytics/customers',
          },
        ],
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: 'ri-settings-3-line',
        children: [
          {
            id: 'restaurant-info',
            label: 'Restaurant Info',
            icon: 'ri-building-4-line',
            route: '/settings/restaurant',
          },
          {
            id: 'payment-methods',
            label: 'Payment Methods',
            icon: 'ri-bank-card-line',
            route: '/settings/payments',
          },
          {
            id: 'notifications',
            label: 'Notifications',
            icon: 'ri-notification-3-line',
            route: '/settings/notifications',
          },
          {
            id: 'integrations',
            label: 'Integrations',
            icon: 'ri-links-line',
            route: '/settings/integrations',
          },
        ],
      },
    ];

    this.updateActiveStates();
  }

  toggleAccordion(itemId: string) {
    // Don't toggle if sidebar is collapsed
    if (this.isLeftsidebarCollased()) {
      return;
    }

    if (this.activeAccordions.has(itemId)) {
      this.activeAccordions.delete(itemId);
    } else {
      this.activeAccordions.add(itemId);
    }
  }

  isAccordionActive(itemId: string): boolean {
    return this.activeAccordions.has(itemId) && !this.isLeftsidebarCollased();
  }

  navigateTo(route: string) {
    if (route) {
      this.router.navigate([route]);

      // Close sidebar on mobile after navigation
      if (window.innerWidth <= 768) {
        this.closeSidebar();
      }
    }
  }

  isRouteActive(route: string): boolean {
    if (!route) return false;

    // Exact match for dashboard or if current route starts with the route
    return (
      this.currentRoute === route ||
      (route !== '/dashboard' && this.currentRoute.startsWith(route + '/'))
    );
  }

  hasActiveChild(item: MenuItem): boolean {
    if (!item.children) return false;
    return item.children.some((child) => child.route && this.isRouteActive(child.route));
  }

  updateActiveStates() {
    // Auto-expand accordions that have active children
    this.menuItems.forEach((item) => {
      if (this.hasActiveChild(item) && !this.isLeftsidebarCollased()) {
        this.activeAccordions.add(item.id);
      }
    });
  }

  onLogout() {
    if (this.isLoading()) return; // Prevent multiple logout attempts

    this.isLoading.set(true);

    this.slowNetwork.start(() => {
      if (this.isLoading()) {
        this.toaster.showWarning('This is taking longer than usual...');
      }
    });

    this.authService.logout().subscribe({
      next: (data: LogoutResponseInterface) => {
        this.toaster.showSuccess('Logged out successfully');
        this.isLoading.set(false);
        this.slowNetwork.clear();
        this.authService.clearAuth();
        this.router.navigateByUrl('/auth/login');
      },
      error: (err) => {
        this.slowNetwork.clear();
        this.isLoading.set(false);
        this.toaster.showError(err.message || 'Something went wrong, please try again later');
      },
    });
  }

  // Utility method to get menu item by ID (useful for programmatic access)
  getMenuItemById(id: string): MenuItem | undefined {
    const findItem = (items: MenuItem[]): MenuItem | undefined => {
      for (const item of items) {
        if (item.id === id) return item;
        if (item.children) {
          const found = findItem(item.children);
          if (found) return found;
        }
      }
      return undefined;
    };

    return findItem(this.menuItems);
  }

  // Method to programmatically set badge count
  setBadge(itemId: string, badge: string | undefined) {
    const item = this.getMenuItemById(itemId);
    if (item) {
      item.badge = badge;
    }
  }
}
