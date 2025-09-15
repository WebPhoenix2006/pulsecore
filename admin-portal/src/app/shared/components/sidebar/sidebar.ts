// sidebar.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

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
export class Sidebar implements OnInit {
  menuItems: MenuItem[] = [];
  activeAccordions: Set<string> = new Set();
  currentRoute: string = '';

  constructor(private router: Router) {}

  ngOnInit() {
    this.initializeMenuItems();
    this.currentRoute = this.router.url;

    // Listen to route changes
    this.router.events.subscribe(() => {
      this.currentRoute = this.router.url;
      this.updateActiveStates();
    });
  }

  initializeMenuItems() {
    this.menuItems = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'bi-speedometer2',
        route: '/dashboard',
      },
      {
        id: 'orders',
        label: 'Orders',
        icon: 'bi-receipt',
        route: '/orders',
        badge: '5',
      },
      {
        id: 'catalog',
        label: 'Catalog',
        icon: 'bi-grid-3x3-gap',
        children: [
          {
            id: 'categories',
            label: 'Categories',
            icon: 'bi-tags',
            route: '/catalog/categories',
          },
          {
            id: 'products',
            label: 'Products',
            icon: 'bi-box',
            route: '/catalog/products',
          },
        ],
      },

      {
        id: 'analytics',
        label: 'Analytics',
        icon: 'bi-graph-up',
        children: [
          {
            id: 'sales',
            label: 'Sales Report',
            icon: 'bi-currency-dollar',
            route: '/analytics/sales',
          },
          {
            id: 'performance',
            label: 'Performance',
            icon: 'bi-bar-chart',
            route: '/analytics/performance',
          },
          {
            id: 'customer-insights',
            label: 'Customer Insights',
            icon: 'bi-people-fill',
            route: '/analytics/customers',
          },
        ],
      },

      {
        id: 'settings',
        label: 'Settings',
        icon: 'bi-gear',
        children: [
          {
            id: 'restaurant-info',
            label: 'Restaurant Info',
            icon: 'bi-building',
            route: '/settings/restaurant',
          },
          {
            id: 'payment-methods',
            label: 'Payment Methods',
            icon: 'bi-credit-card',
            route: '/settings/payments',
          },
          {
            id: 'notifications',
            label: 'Notifications',
            icon: 'bi-bell',
            route: '/settings/notifications',
          },
          {
            id: 'integrations',
            label: 'Integrations',
            icon: 'bi-link-45deg',
            route: '/settings/integrations',
          },
        ],
      },
    ];

    this.updateActiveStates();
  }

  toggleAccordion(itemId: string) {
    if (this.activeAccordions.has(itemId)) {
      this.activeAccordions.delete(itemId);
    } else {
      this.activeAccordions.add(itemId);
    }
  }

  isAccordionActive(itemId: string): boolean {
    return this.activeAccordions.has(itemId);
  }

  navigateTo(route: string) {
    if (route) {
      this.router.navigate([route]);
    }
  }

  isRouteActive(route: string): boolean {
    return this.currentRoute === route || this.currentRoute.startsWith(route + '/');
  }

  hasActiveChild(item: MenuItem): boolean {
    if (!item.children) return false;
    return item.children.some((child) => child.route && this.isRouteActive(child.route));
  }

  updateActiveStates() {
    // Auto-expand accordions that have active children
    this.menuItems.forEach((item) => {
      if (this.hasActiveChild(item)) {
        this.activeAccordions.add(item.id);
      }
    });
  }

  onLogout() {
    // Add logout logic here
    console.log('Logout clicked');
    // this.authService.logout();
    // this.router.navigate(['/login']);
  }
}
