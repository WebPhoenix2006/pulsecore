import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError, BehaviorSubject, EMPTY } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { Router } from '@angular/router';

let isRefreshing = false;
let refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Skip authentication for specific endpoints
  if (shouldSkipAuth(req.url)) {
    return next(addBasicHeaders(req));
  }

  const token = authService.getToken();
  let authReq = addTokenHeader(req, token, authService);

  return next(authReq).pipe(
    catchError(error => {
      if (error instanceof HttpErrorResponse && error.status === 401 && !shouldSkipAuth(req.url)) {
        return handle401Error(authReq, next, authService, router);
      }
      return throwError(() => error);
    })
  );
};

function shouldSkipAuth(url: string): boolean {
  const publicEndpoints = [
    '/auth/login/',
    '/auth/register/',
    '/auth/password-reset/',
    '/auth/password-reset/confirm/',
    '/auth/verify-email/'
  ];

  return publicEndpoints.some(endpoint => url.includes(endpoint));
}

function addBasicHeaders(request: any) {
  let headers: { [key: string]: string } = {
    'Accept': 'application/json',
  };

  // Add Content-Type only if not FormData
  if (!(request.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  return request.clone({
    setHeaders: headers,
  });
}

function addTokenHeader(request: any, token: string | null, authService: AuthService) {
  let headers: { [key: string]: string } = {
    'Accept': 'application/json',
  };

  // Add Content-Type only if not FormData
  if (!(request.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Add token if available and not expired
  if (token && !authService.isTokenExpired(token)) {
    headers['Authorization'] = `Bearer ${token.trim()}`;
  }

  return request.clone({
    setHeaders: headers,
  });
}

function handle401Error(request: any, next: any, authService: AuthService, router: Router): Observable<any> {
  const refreshToken = authService.getRefreshToken();

  // If no refresh token, redirect to login
  if (!refreshToken || authService.isTokenExpired(refreshToken)) {
    authService.clearAuth();
    router.navigate(['/auth/login']);
    return EMPTY;
  }

  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshAccessToken().pipe(
      switchMap((newToken: string) => {
        isRefreshing = false;
        refreshTokenSubject.next(newToken);
        return next(addTokenHeader(request, newToken, authService));
      }),
      catchError((error) => {
        isRefreshing = false;
        authService.clearAuth();
        router.navigate(['/auth/login']);
        return throwError(() => error);
      })
    );
  }

  return refreshTokenSubject.pipe(
    filter(token => token !== null),
    take(1),
    switchMap((token) => next(addTokenHeader(request, token, authService)))
  );
}
