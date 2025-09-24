import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { LogoutResponseInterface } from '../interfaces/auth/logout-response.interface';
import { Environments } from '../../environments/environment';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { catchError, tap, map } from 'rxjs/operators';

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
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(private http: HttpClient, private router: Router) {}

  // Store authentication tokens and tenant ID after successful login
  setAuth(access: string, refresh: string, tenantId: string) {
    localStorage.setItem(this.accessKey, access);
    localStorage.setItem(this.refreshKey, refresh);
    localStorage.setItem(this.tenantId, tenantId);
  }

  getToken(): string | null {
    return localStorage.getItem(this.accessKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshKey);
  }

  // Get the current user's tenant ID (required for multi-tenant API calls)
  getTenantId(): string | null {
    const tenantId = localStorage.getItem(this.tenantId);
    console.log(tenantId);
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
    const token = localStorage.getItem('token');
    const data = {
      token: token,
    };
    return this.http.post<LogoutResponseInterface>(Environments.auth.logout, data, {
      responseType: 'text' as 'json',
    });
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
}
