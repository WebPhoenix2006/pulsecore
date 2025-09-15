import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'auth', pathMatch: 'full' },
  { path: 'auth', loadChildren: () => import('./auth/auth-module').then((m) => m.AuthModule) },
  {
    path: 'catalog',
    loadChildren: () => import('./catalog/catalog-module').then((m) => m.CatalogModule),
    canActivate: [authGuard],
  },
];
