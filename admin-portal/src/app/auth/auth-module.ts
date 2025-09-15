import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthRoutingModule } from './auth-routing-module';
import { Signup } from './signup/signup';
import { RouterModule } from '@angular/router';
import { Login } from './login/login';
import { SharedModule } from '../shared/shared-module';
import { ReactiveFormsModule } from '@angular/forms';
import { Verify } from './verify/verify';

@NgModule({
  declarations: [Signup, Login, Verify],
  imports: [CommonModule, RouterModule, AuthRoutingModule, SharedModule, ReactiveFormsModule],
})
export class AuthModule {}
