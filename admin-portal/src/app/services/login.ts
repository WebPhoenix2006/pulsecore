import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RegisterRequestInterface } from '../interfaces/auth/register-request.interface';
import { RegisterResponseInterface } from '../interfaces/auth/register-response.interface';
import { Environments } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  constructor(private http: HttpClient) {}
}
