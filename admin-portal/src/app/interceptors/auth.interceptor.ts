import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let headers: { [key: string]: string } = {
      Accept: 'application/json',
    };

    // Add Content-Type only if not FormData
    if (!(req.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    // Add token if available
    const token = this.authService.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token.trim()}`;
    }

    const authReq = req.clone({
      setHeaders: headers,
    });

    return next.handle(authReq);
  }
}
