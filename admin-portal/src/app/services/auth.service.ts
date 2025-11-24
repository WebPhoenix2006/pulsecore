import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { LogoutResponseInterface } from '../interfaces/auth/logout-response.interface';
import { Environments } from '../../environments/environment';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { catchError, tap, map } from 'rxjs/operators';
import { User } from '../interfaces/auth/user.interface';

interface TokenRefreshResponse {
  access: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private accessKey = 'token';
  private refreshKey = 'refresh-token';
  private tenantId = 'tenant-id';
  private userKey = 'user'; // changed from username -> user
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  private tokenExpirationTimer: any;

  constructor(private http: HttpClient, private router: Router) {
    // Start monitoring token expiration when service is initialized
    this.startTokenExpirationMonitoring();
  }

  // Store authentication tokens, tenant ID and user object after successful login
  setAuth(access: string, refresh: string, tenantId: string, user: User) {
    localStorage.setItem(this.accessKey, access);
    localStorage.setItem(this.refreshKey, refresh);
    localStorage.setItem(this.tenantId, tenantId);
    // store full user object as JSON
    localStorage.setItem(this.userKey, JSON.stringify(user));
    // Restart token monitoring when new tokens are set
    this.startTokenExpirationMonitoring();
  }

  getToken(): string | null {
    return localStorage.getItem(this.accessKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshKey);
  }
  getUser() {
    return localStorage.getItem(this.userKey);
  }

  // Get the current user's tenant ID (required for multi-tenant API calls)
  getTenantId(): string | null {
    const tenantId = localStorage.getItem(this.tenantId);
    return localStorage.getItem(this.tenantId);
  }

  isTokenExpired(token: string): boolean {
    try {
      const decodedToken: any = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decodedToken.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  getTokenExpiration(token: string): Date | null {
    try {
      const decodedToken: any = jwtDecode(token);
      return new Date(decodedToken.exp * 1000);
    } catch (error) {
      return null;
    }
  }

  logout(): Observable<LogoutResponseInterface> {
    const refreshToken = this.getRefreshToken();

    // Always clear auth on logout, regardless of token state
    // This ensures user can logout even if tokens are expired/blacklisted
    if (!refreshToken) {
      this.clearAuth();
      this.router.navigate(['/auth/login']);
      return throwError(() => new Error('No refresh token available'));
    }

    const data = {
      refresh: refreshToken,
    };

    // Try to blacklist the token on backend, but don't fail if it's already blacklisted
    return this.http
      .post<LogoutResponseInterface>(Environments.auth.logout, data, {
        responseType: 'text' as 'json',
      })
      .pipe(
        tap(() => {
          console.log('Successfully blacklisted token on backend');
          this.clearAuth();
          this.router.navigate(['/auth/login']);
        }),
        catchError((error) => {
          // Clear auth even if logout fails (token might be already blacklisted/expired)
          console.warn(
            'Logout API failed (token may be expired/blacklisted), clearing local storage:',
            error
          );
          this.clearAuth();
          this.router.navigate(['/auth/login']);
          // Return success since we successfully logged out locally
          return throwError(() => error);
        })
      );
  }

  refreshAccessToken(): Observable<string> {
    if (this.isRefreshing) {
      return this.refreshTokenSubject.pipe(
        catchError((error) => {
          return throwError(() => error);
        })
      );
    }

    this.isRefreshing = true;
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      this.isRefreshing = false;
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http
      .post<TokenRefreshResponse>(Environments.auth.refreshToken, {
        refresh: refreshToken,
      })
      .pipe(
        tap((response) => {
          this.isRefreshing = false;
          localStorage.setItem(this.accessKey, response.access);
          this.refreshTokenSubject.next(response.access);
        }),
        catchError((error) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(null);
          return throwError(() => error);
        }),
        map((response) => response.access)
      );
  }

  clearAuth() {
    localStorage.removeItem(this.accessKey);
    localStorage.removeItem(this.refreshKey);
    localStorage.removeItem(this.tenantId);
    localStorage.removeItem(this.userKey); // remove stored user
    // Clear token expiration timer
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
      this.tokenExpirationTimer = null;
    }
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    if (this.isTokenExpired(token)) {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken || this.isTokenExpired(refreshToken)) {
        // Don't automatically clear auth here, let the interceptor handle it
        return false;
      }
      // Token expired but refresh token is valid - still considered authenticated
      return true;
    }

    return true;
  }

  // Password reset functionality
  requestPasswordReset(email: string): Observable<any> {
    return this.http.post<any>(Environments.auth.passwordReset, { email });
  }

  confirmPasswordReset(token: string, password: string): Observable<any> {
    return this.http.post<any>(Environments.auth.passwordResetConfirm, {
      token,
      password,
    });
  }

  // Get current user
  getCurrentUser(): Observable<any> {
    return this.http.get<any>(Environments.auth.currentUser);
  }

  // Convenience: get stored user object from localStorage
  getStoredUser(): User | null {
    const raw = localStorage.getItem(this.userKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }

  // Monitor token expiration and automatically logout or refresh
  private startTokenExpirationMonitoring() {
    // Clear any existing timer
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
    }

    const accessToken = this.getToken();
    const refreshToken = this.getRefreshToken();

    // No tokens to monitor
    if (!accessToken && !refreshToken) {
      return;
    }

    // Both tokens expired - logout immediately
    if (
      accessToken &&
      this.isTokenExpired(accessToken) &&
      refreshToken &&
      this.isTokenExpired(refreshToken)
    ) {
      console.warn('Both tokens expired - logging out automatically');
      this.clearAuth();
      this.router.navigate(['/auth/login']);
      return;
    }

    // Check refresh token expiration
    if (refreshToken) {
      const refreshExpiration = this.getTokenExpiration(refreshToken);
      if (refreshExpiration) {
        const refreshTimeUntilExpiry = refreshExpiration.getTime() - Date.now();

        // If refresh token expires in less than 1 minute, logout immediately
        if (refreshTimeUntilExpiry < 60000) {
          console.warn('Refresh token expiring soon - logging out automatically');
          this.clearAuth();
          this.router.navigate(['/auth/login']);
          return;
        }

        // Set timer to logout when refresh token expires
        this.tokenExpirationTimer = setTimeout(() => {
          console.warn('Refresh token expired - logging out automatically');
          this.clearAuth();
          this.router.navigate(['/auth/login']);
        }, refreshTimeUntilExpiry);
      }
    }
  }
}
