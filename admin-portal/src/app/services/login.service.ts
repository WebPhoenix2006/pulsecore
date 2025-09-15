import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthResponseInterface } from '../interfaces/auth/register-response.interface';
import { Environments } from '../../environments/environment';
import { LoginRequestInterface } from '../interfaces/auth/login.interface';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  constructor(private http: HttpClient) {}

  loginUser(data: LoginRequestInterface): Observable<AuthResponseInterface> {
    return this.http.post<AuthResponseInterface>(Environments.auth.login, data);
  }
}
