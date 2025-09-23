import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, filter, take } from 'rxjs/operators';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();
    let authReq = this.addTokenHeader(req, token);

    return next.handle(authReq).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          return this.handle401Error(authReq, next);
        }
        return throwError(error);
      })
    );
  }

  private addTokenHeader(request: HttpRequest<any>, token: string | null): HttpRequest<any> {
    let headers: { [key: string]: string } = {
      Accept: 'application/json',
    };

    // Add Content-Type only if not FormData
    if (!(request.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    // Add token if available and not expired
    if (token) {
      if (this.authService.isTokenExpired(token)) {
        // Token is expired, but don't add it to headers
        // The 401 error handling will take care of refreshing
      } else {
        headers['Authorization'] = `Bearer ${token.trim()}`;
      }
    }

    return request.clone({
      setHeaders: headers,
    });
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      const token = this.authService.getToken();
      if (token && this.authService.isTokenExpired(token)) {
        return this.authService.refreshAccessToken().pipe(
          switchMap((newToken: string) => {
            this.isRefreshing = false;
            this.refreshTokenSubject.next(newToken);
            return next.handle(this.addTokenHeader(request, newToken));
          }),
          catchError((error) => {
            this.isRefreshing = false;
            this.authService.clearAuth();
            return throwError(error);
          })
        );
      }
    }

    return this.refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap((token) => next.handle(this.addTokenHeader(request, token)))
    );
  }
}
