import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();
  const refreshToken = authService.getRefreshToken();

  // No tokens at all
  if (!token && !refreshToken) {
    return router.createUrlTree(['/auth/login']);
  }

  // Token exists and is not expired
  if (token && !authService.isTokenExpired(token)) {
    return true;
  }

  // Access token is expired but refresh token exists
  if (token && authService.isTokenExpired(token) && refreshToken) {
    // Check if refresh token is also expired
    if (authService.isTokenExpired(refreshToken)) {
      authService.clearAuth();
      return router.createUrlTree(['/auth/login']);
    }

    // Try to refresh the token
    return authService.refreshAccessToken().pipe(
      map(() => true),
      catchError(() => {
        authService.clearAuth();
        return of(router.createUrlTree(['/auth/login']));
      })
    );
  }

  // Default case: redirect to login
  return router.createUrlTree(['/auth/login']);
};
