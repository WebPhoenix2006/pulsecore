import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Environments } from '../../environments/environment';
import { RegisterRequestInterface } from '../interfaces/auth/register-request.interface';
import { RegisterResponseInterface } from '../interfaces/auth/register-response.interface';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class SignupService {
  constructor(private http: HttpClient) {}

  registerUser(data: RegisterRequestInterface): Observable<RegisterResponseInterface> {
    return this.http.post<RegisterResponseInterface>(Environments.auth.signup, data);
  }
}
