import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import { RegisterRequestInterface } from '../../interfaces/auth/register-request.interface';
import { RegisterResponseInterface } from '../../interfaces/auth/register-response.interface';
import { Environments } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class VerifyEmailService {
  constructor(private http: HttpClient) {}

  verifyEmail(token: string | null): Observable<RegisterRequestInterface | null> {
    if (!token) {
      return EMPTY;
    }

    return this.http.post<any>(
      `${Environments.auth.verifyEmail}?token=${token}`,
      { token },
      {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
        }),
      }
    );
  }
}
