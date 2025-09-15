import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormField } from './components/form-field/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import { SmartFileField } from './components/smart-file-field/smart-file-field';
import { GradientBackground } from './ui/gradient-background/gradient-background';
import { AuthRoutingModule } from '../auth/auth-routing-module';
import { Sidebar } from './ui/sidebar/sidebar';
import { Button } from './ui/button/button';
import { Toast } from './components/toast/toast';
import { Loader } from './components/loader/loader';

@NgModule({
  declarations: [FormField, SmartFileField, GradientBackground, Sidebar, Button, Toast, Loader],
  imports: [CommonModule, ReactiveFormsModule, AuthRoutingModule],
  exports: [FormField, SmartFileField, GradientBackground, Button, Toast, Loader],
})
export class SharedModule {}
