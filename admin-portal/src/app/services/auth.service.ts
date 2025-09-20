import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { LogoutResponseInterface } from '../interfaces/auth/logout-response.interface';
import { Environments } from '../../environments/environment';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private accessKey = 'token';
  private refreshKey = 'refresh-token';
  private tenantId = 'tenant-id';

  constructor(private http: HttpClient, private router: Router) {}

  setAuth(access: string, refresh: string, tenantId: string) {
    localStorage.setItem(this.accessKey, access);
    localStorage.setItem(this.refreshKey, refresh);
    localStorage.setItem(this.tenantId, tenantId);
  }

  getToken(): string | null {
    return localStorage.getItem(this.accessKey);
  }

  logout(): Observable<LogoutResponseInterface> {
    const token = localStorage.getItem('refresh-token');
    const data = {
      refresh: token,
    };
    return this.http.post<LogoutResponseInterface>(Environments.auth.logout, data, {
      responseType: 'text' as 'json',
    });
  }

  clearAuth() {
    localStorage.removeItem(this.accessKey);
    localStorage.removeItem(this.refreshKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
