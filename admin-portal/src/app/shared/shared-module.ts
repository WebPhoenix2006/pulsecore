import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { FormField } from './components/form-field/form-field';
import { SmartFileField } from './components/smart-file-field/smart-file-field';
import { GradientBackground } from './ui/gradient-background/gradient-background';
import { Button } from './ui/button/button';
import { Loader } from './components/loader/loader';
import { SvgIcons } from './components/svg-icons/svg-icons';
import { Sidebar } from './components/sidebar/sidebar';

@NgModule({
  declarations: [FormField, SmartFileField, GradientBackground, Button, Loader, SvgIcons, Sidebar],
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  exports: [FormField, SmartFileField, GradientBackground, Button, Loader, Sidebar],
})
export class SharedModule {}
