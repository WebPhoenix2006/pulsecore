import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'auth', pathMatch: 'full' },

  { path: 'auth', loadChildren: () => import('./auth/auth-module').then((m) => m.AuthModule) },
  {
    path: 'analytics',
    loadChildren: () => import('./analytics/analytics-module').then((m) => m.AnalyticsModule),
    canActivate: [authGuard],
  },
  {
    path: 'catalog',
    loadChildren: () => import('./catalog/catalog-module').then((m) => m.CatalogModule),
    canActivate: [authGuard],
  },
  {
    path: 'inventory',
    loadChildren: () => import('./inventory/inventory-module').then((m) => m.InventoryModule),
    canActivate: [authGuard],
  },
  {
    path: 'orders',
    loadChildren: () => import('./orders/orders-module').then((m) => m.OrdersModule),
    canActivate: [authGuard],
  },
];
