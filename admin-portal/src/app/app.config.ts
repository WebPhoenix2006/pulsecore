import {
  ApplicationConfig,
  inject,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { AuthService } from './services/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideAnimationsAsync(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        (req, next) => {
          const authService = inject(AuthService);
          let headers: { [key: string]: string } = {
            Accept: 'application/json',
          };

          if (!(req.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
          }

          const token = authService.getToken();
          if (token) {
            headers['Authorization'] = `Bearer ${token.trim()}`;
          }

          const authReq = req.clone({
            setHeaders: headers,
          });

          return next(authReq);
        },
      ])
    ),
  ],
};
