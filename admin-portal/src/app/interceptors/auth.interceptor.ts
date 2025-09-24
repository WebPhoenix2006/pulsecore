import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError, BehaviorSubject, EMPTY } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { Router } from '@angular/router';

let isRefreshing = false;
let refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

// Main authentication interceptor function
// This interceptor handles all HTTP requests and adds appropriate headers based on the endpoint type
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('🔍 INTERCEPTOR: Request intercepted:', req.method, req.url);

  const authService = inject(AuthService);
  const router = inject(Router);

  // STEP 1: Check if this is a public endpoint (login, register, password reset, etc.)
  // Public endpoints don't need authentication tokens or tenant headers
  const isPublic = shouldSkipAuth(req.url);
  console.log('🔍 INTERCEPTOR: Is public endpoint?', isPublic);

  if (isPublic) {
    console.log('🔍 INTERCEPTOR: Using basic headers for public endpoint');
    return next(addBasicHeaders(req));
  }

  // STEP 2: For protected endpoints, add both Authorization token AND X-Tenant-ID header
  // The X-Tenant-ID is REQUIRED by the backend's TenantScopedMixin for data isolation
  console.log('🔍 INTERCEPTOR: Processing protected endpoint, adding headers...');
  const token = authService.getToken();
  let authReq = addTokenHeader(req, token, authService);

  // STEP 3: Send request and handle authentication errors
  return next(authReq).pipe(
    catchError(error => {
      // If we get 401 Unauthorized on a protected endpoint, try to refresh the token
      if (error instanceof HttpErrorResponse && error.status === 401 && !shouldSkipAuth(req.url)) {
        return handle401Error(authReq, next, authService, router);
      }
      return throwError(() => error);
    })
  );
};

// Determines if an endpoint is public (doesn't require authentication)
// PUBLIC ENDPOINTS: These don't need Authorization tokens or X-Tenant-ID headers
// - Login: User doesn't have tokens yet
// - Register: New user creation doesn't require existing authentication
// - Password Reset: User may not have access to their account
// - Email Verification: User may not be fully authenticated yet
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

// Adds only basic headers for PUBLIC endpoints (no auth or tenant headers)
// Used for login, register, password reset, etc.
function addBasicHeaders(request: any) {
  let headers: { [key: string]: string } = {
    'Accept': 'application/json',
  };

  // Add Content-Type only if not FormData (file uploads handle their own Content-Type)
  if (!(request.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  return request.clone({
    setHeaders: headers,
  });
}

function addTokenHeader(request: any, token: string | null, authService: AuthService) {
  console.log('🔍 addTokenHeader: Called for request:', request.url);

  let headers: { [key: string]: string } = {
    'Accept': 'application/json',
  };

  // Add Content-Type only if not FormData
  if (!(request.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Add Authorization token if available and not expired
  console.log('🔍 addTokenHeader: Token available?', !!token);
  if (token && !authService.isTokenExpired(token)) {
    headers['Authorization'] = `Bearer ${token.trim()}`;
    console.log('🔍 addTokenHeader: Authorization header added');
  }

  // Add X-Tenant-ID header for multi-tenant API calls (REQUIRED for all tenant-scoped operations)
  // This header tells the backend which tenant's data to access/modify
  console.log('🔍 addTokenHeader: Getting tenant ID...');
  const tenantId = authService.getTenantId();
  console.log('🔍 addTokenHeader: Tenant ID retrieved:', tenantId);
  if (tenantId) {
    headers['X-Tenant-ID'] = tenantId;
    console.log('🔍 addTokenHeader: X-Tenant-ID header added:', tenantId);
  } else {
    console.log('🔍 addTokenHeader: No tenant ID found - X-Tenant-ID header NOT added');
  }

  console.log('🔍 addTokenHeader: Final headers:', headers);

  return request.clone({
    setHeaders: headers,
  });
}

// Handles 401 Unauthorized errors by attempting to refresh the access token
// FLOW:
// 1. Check if refresh token is valid
// 2. If invalid -> clear auth and redirect to login
// 3. If valid -> refresh access token and retry original request
// 4. If refresh fails -> clear auth and redirect to login
function handle401Error(request: any, next: any, authService: AuthService, router: Router): Observable<any> {
  const refreshToken = authService.getRefreshToken();

  // CASE 1: No refresh token or refresh token expired -> User must re-login
  if (!refreshToken || authService.isTokenExpired(refreshToken)) {
    authService.clearAuth();
    router.navigate(['/auth/login']);
    return EMPTY;
  }

  // CASE 2: Refresh token valid -> Try to refresh access token
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshAccessToken().pipe(
      switchMap((newToken: string) => {
        // SUCCESS: Got new access token -> retry original request with new token and tenant ID
        isRefreshing = false;
        refreshTokenSubject.next(newToken);
        return next(addTokenHeader(request, newToken, authService));
      }),
      catchError((error) => {
        // FAILURE: Refresh failed -> clear auth and redirect to login
        isRefreshing = false;
        authService.clearAuth();
        router.navigate(['/auth/login']);
        return throwError(() => error);
      })
    );
  }

  // CASE 3: Refresh already in progress -> wait for it to complete
  return refreshTokenSubject.pipe(
    filter(token => token !== null),
    take(1),
    switchMap((token) => next(addTokenHeader(request, token, authService)))
  );
}
