import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private tokenKey = 'token';
  private refreshKey = 'refresh-token';

  setAuth(token: string, refresh: string) {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.refreshKey, refresh);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  clearAuth() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
