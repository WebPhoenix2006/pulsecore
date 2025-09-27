import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    loadChildren: () => import('./guest/guest.module').then((m) => m.GuestModule)
  },
  { path: 'auth', loadChildren: () => import('./auth/auth-module').then((m) => m.AuthModule) },
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
];
