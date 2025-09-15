import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { FormField } from './components/form-field/form-field';
import { SmartFileField } from './components/smart-file-field/smart-file-field';
import { GradientBackground } from './ui/gradient-background/gradient-background';
import { Sidebar } from './components/sidebar/sidebar';
import { Button } from './ui/button/button';
import { Loader } from './components/loader/loader';
import { SvgIcons } from './components/svg-icons/svg-icons';

@NgModule({
  declarations: [FormField, SmartFileField, GradientBackground, Sidebar, Button, Loader, SvgIcons],
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  exports: [FormField, SmartFileField, GradientBackground, Button, Loader, Sidebar],
})
export class SharedModule {}
