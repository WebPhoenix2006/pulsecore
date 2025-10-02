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
import { PaginatorModule } from 'primeng/paginator';
import { ConfirmationService } from 'primeng/api';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectButtonModule } from 'primeng/selectbutton';
import { MultiSelectModule } from 'primeng/multiselect';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

// Your Components
import { FormField } from './components/form-field/form-field';
import { SmartFileField } from './components/smart-file-field/smart-file-field';
import { GradientBackground } from './ui/gradient-background/gradient-background';
import { Button } from './ui/button/button';
import { Loader } from './components/loader/loader';
import { Sidebar } from './components/sidebar/sidebar';
import { PrimeDataTableComponent } from './components/prime-data-table/prime-data-table';
import { SpecialH1 } from './components/special-h1/special-h1';
import { CustomScrollbarComponent } from './components/custom-scrollbar/custom-scrollbar.component';
import { PaginationComponent } from './components/pagination/pagination.component';
import { SvgIcons } from './components/svg-icons/svg-icons';
import { Dropdown } from './components/dropdown/dropdown';
import { CustomSelectComponent } from './components/custom-select/custom-select.component';

@NgModule({
  declarations: [
    FormField,
    SmartFileField,
    GradientBackground,
    Button,
    Loader,
    Sidebar,
    PrimeDataTableComponent,
    SpecialH1,
    Dropdown,
    PaginationComponent,
    SvgIcons,
    CustomSelectComponent,
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
    PaginatorModule,

    InputNumberModule,
    SelectButtonModule,
    MultiSelectModule,
    FloatLabelModule,
    DividerModule,
    ToastModule,
  ],
  exports: [
    FormField,
    SmartFileField,
    GradientBackground,
    Button,
    Loader,
    Sidebar,
    PrimeDataTableComponent,
    SpecialH1,
    CustomScrollbarComponent,
    CustomSelectComponent,
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
    PaginatorModule,

    InputNumberModule,
    SelectButtonModule,
    MultiSelectModule,
    FloatLabelModule,
    DividerModule,
    ToastModule,
    PaginationComponent,
    Dropdown,
    SvgIcons,
  ],
  providers: [ConfirmationService, MessageService],
})
export class SharedModule {}
