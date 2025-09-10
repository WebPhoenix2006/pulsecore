import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthRoutingModule } from './auth-routing-module';
import { Signup } from './signup/signup';
import { RouterModule } from '@angular/router';
import { Login } from './login/login';

@NgModule({
  declarations: [Signup, Login],
  imports: [CommonModule, RouterModule, AuthRoutingModule],
})
export class AuthModule {}
