import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthRoutingModule } from './auth-routing-module';
import { Signup } from './signup/signup';
import { RouterModule } from '@angular/router';
import { Login } from './login/login';
import { SharedModule } from '../shared/shared-module';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Verify } from './verify/verify';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';

@NgModule({
  declarations: [Signup, Login, Verify, ForgotPasswordComponent],
  imports: [
    CommonModule,
    RouterModule,
    AuthRoutingModule,
    SharedModule,
    ReactiveFormsModule,
    FormsModule,
  ],
})
export class AuthModule {}
