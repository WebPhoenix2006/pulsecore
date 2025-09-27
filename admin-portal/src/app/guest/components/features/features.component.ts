import { Component } from '@angular/core';

@Component({
  selector: 'app-features',
  standalone: false,
  templateUrl: './features.component.html',
  styleUrls: ['./features.component.scss']
})
export class FeaturesComponent {

  features = [
    {
      icon: 'fas fa-boxes',
      title: 'Smart Inventory Management',
      description: 'Track stock levels, set alerts, manage batches with expiry dates, and automate reorder points.',
      capabilities: [
        'Real-time stock tracking',
        'Low stock alerts',
        'Batch management',
        'Expiry date monitoring',
        'Automated reorder points'
      ]
    },
    {
      icon: 'fas fa-tags',
      title: 'Product Catalog Management',
      description: 'Organize products by categories, manage SKUs, set pricing, and maintain detailed product information.',
      capabilities: [
        'Category organization',
        'SKU management',
        'Dynamic pricing',
        'Product attributes',
        'Barcode support'
      ]
    },
    {
      icon: 'fas fa-shopping-cart',
      title: 'Order Processing',
      description: 'Handle orders from creation to delivery with integrated payment processing and status tracking.',
      capabilities: [
        'Order lifecycle management',
        'Paystack integration',
        'Payment verification',
        'Return processing',
        'Customer notifications'
      ]
    },
    {
      icon: 'fas fa-truck',
      title: 'Delivery & Dispatch',
      description: 'Manage riders, assign deliveries, track locations, and optimize delivery routes.',
      capabilities: [
        'Rider management',
        'Real-time tracking',
        'Route optimization',
        'Delivery status updates',
        'Performance analytics'
      ]
    },
    {
      icon: 'fas fa-handshake',
      title: 'Supplier Management',
      description: 'Maintain supplier database, create purchase orders, track deliveries, and manage relationships.',
      capabilities: [
        'Supplier database',
        'Purchase order creation',
        'Delivery tracking',
        'Cost management',
        'Performance metrics'
      ]
    },
    {
      icon: 'fas fa-shield-alt',
      title: 'Secure Authentication',
      description: 'Multi-tenant secure login system with role-based access control and email verification.',
      capabilities: [
        'Multi-tenant security',
        'Role-based access',
        'Email verification',
        'Password reset',
        'Session management'
      ]
    }
  ];

  selectedFeature = this.features[0];

  selectFeature(feature: any) {
    this.selectedFeature = feature;
  }

  trackByFn(index: number, item: any) {
    return item.title;
  }

  trackByCapability(index: number, item: string) {
    return item;
  }
}