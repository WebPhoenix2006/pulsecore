import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'auth', pathMatch: 'full' },
  { path: 'auth', loadChildren: () => import('./auth/auth-module').then((m) => m.AuthModule) },
  {
    path: 'restaurants',
    loadChildren: () => import('./restaurants/restaurants-module').then((m) => m.RestaurantsModule),
    canActivate: [authGuard],
  },
];
