// shared/shared.module.ts

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// PrimeNG Modules - Add these to fix the p-tag errors
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CheckboxModule } from 'primeng/checkbox';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmationService } from 'primeng/api';

// Your Components
import { FormField } from './components/form-field/form-field';
import { SmartFileField } from './components/smart-file-field/smart-file-field';
import { GradientBackground } from './ui/gradient-background/gradient-background';
import { Button } from './ui/button/button';
import { Loader } from './components/loader/loader';
import { SvgIcons } from './components/svg-icons/svg-icons';
import { Sidebar } from './components/sidebar/sidebar';
import { ReusableDataTable } from './components/reusable-data-table/reusable-data-table';
import { SpecialH1 } from './components/special-h1/special-h1';
import { CustomScrollbarComponent } from './components/custom-scrollbar/custom-scrollbar.component';

@NgModule({
  declarations: [
    FormField,
    SmartFileField,
    GradientBackground,
    Button,
    Loader,
    SvgIcons,
    Sidebar,
    ReusableDataTable,
    SpecialH1,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    CustomScrollbarComponent, // Import the standalone component
    // PrimeNG Modules
    TableModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    TooltipModule,
    DialogModule,
    ConfirmDialogModule,
    CheckboxModule,
    ProgressSpinnerModule,
  ],
  exports: [
    FormField,
    SmartFileField,
    GradientBackground,
    Button,
    Loader,
    Sidebar,
    ReusableDataTable,
    SpecialH1,
    CustomScrollbarComponent,
    // Export PrimeNG modules so they can be used in pages that import SharedModule
    TableModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    TooltipModule,
    DialogModule,
    ConfirmDialogModule,
    CheckboxModule,
    ProgressSpinnerModule,
  ],
  providers: [
    ConfirmationService
  ]
})
export class SharedModule {}
