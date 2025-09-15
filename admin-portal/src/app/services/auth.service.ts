import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private accessKey = 'token';
  private refreshKey = 'refresh-token';
  private tenantId = 'tenant-id';

  setAuth(access: string, refresh: string, tenantId: string) {
    console.log('Setting auth with:', { access, refresh, tenantId });
    localStorage.setItem(this.accessKey, access);
    localStorage.setItem(this.refreshKey, refresh);
    localStorage.setItem(this.tenantId, tenantId);
  }

  getToken(): string | null {
    return localStorage.getItem(this.accessKey);
  }

  clearAuth() {
    localStorage.removeItem(this.accessKey);
    localStorage.removeItem(this.refreshKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
