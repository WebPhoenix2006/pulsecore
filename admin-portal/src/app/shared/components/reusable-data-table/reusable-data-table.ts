import { Component, input, output, computed, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { TableConfig, TableData, TableAction, FormFieldConfig } from '../../../interfaces/table-config.interface';

@Component({
  selector: 'app-reusable-data-table',
  standalone: false,
  templateUrl: './reusable-data-table.html',
  styleUrl: './reusable-data-table.scss',
  providers: [ConfirmationService]
})
export class ReusableDataTable implements OnInit {
  // Inputs
  config = input.required<TableConfig>();
  data = input.required<TableData[]>();
  loading = input<boolean>(false);

  // Outputs
  onCreate = output<TableData>();
  onEdit = output<{ id: any; data: TableData }>();
  onDelete = output<any>();
  onView = output<TableData>();
  onCustomAction = output<{ action: string; item: TableData }>();

  // Internal state
  showCreateModal = false;
  showEditModal = false;
  showViewModal = false;
  selectedItem = signal<TableData | null>(null);
  searchTerm = signal('');
  currentPage = signal(0);
  rowsPerPage = signal(10);

  // Form
  entityForm!: FormGroup;
  isSubmitting = signal(false);

  // Computed values
  filteredData = computed(() => {
    const search = this.searchTerm().toLowerCase();
    if (!search) return this.data();

    return this.data().filter(item =>
      this.config().columns.some(col =>
        col.filterable !== false &&
        String(item[col.field] || '').toLowerCase().includes(search)
      )
    );
  });

  paginatedData = computed(() => {
    const filtered = this.filteredData();
    const start = this.currentPage() * this.rowsPerPage();
    const end = start + this.rowsPerPage();
    return filtered.slice(start, end);
  });

  totalRecords = computed(() => this.filteredData().length);
  totalPages = computed(() => Math.ceil(this.totalRecords() / this.rowsPerPage()));

  constructor(
    private fb: FormBuilder,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.initializeForm();
    this.rowsPerPage.set(this.config().pageSize || 10);
  }

  initializeForm() {
    const formControls: any = {};

    this.config().formFields.forEach(field => {
      const validators = [];
      if (field.required) validators.push(Validators.required);
      if (field.type === 'email') validators.push(Validators.email);

      formControls[field.field] = ['', validators];
    });

    this.entityForm = this.fb.group(formControls);
  }

  // Modal actions
  openCreateModal() {
    this.entityForm.reset();
    this.showCreateModal = true;
  }

  openEditModal(item: TableData) {
    this.selectedItem.set(item);
    this.entityForm.patchValue(item);
    this.showEditModal = true;
  }

  openViewModal(item: TableData) {
    this.selectedItem.set(item);
    this.showViewModal = true;
    this.onView.emit(item);
  }

  closeModals() {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showViewModal = false;
    this.selectedItem.set(null);
    this.isSubmitting.set(false);
  }

  // CRUD operations
  handleCreate() {
    if (this.entityForm.valid) {
      this.isSubmitting.set(true);
      this.onCreate.emit(this.entityForm.value);
    } else {
      this.markFormGroupTouched();
    }
  }

  handleEdit() {
    if (this.entityForm.valid && this.selectedItem()) {
      this.isSubmitting.set(true);
      this.onEdit.emit({
        id: this.selectedItem()!['id'],
        data: this.entityForm.value
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  handleDelete(item: TableData) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete this ${this.config().entityName.toLowerCase()}?`,
      header: `Delete ${this.config().entityName}`,
      icon: 'fas fa-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.onDelete.emit(item['id']);
      }
    });
  }

  handleCustomAction(action: TableAction, item: TableData) {
    if (action.customFunction) {
      this.onCustomAction.emit({ action: action.customFunction, item });
    }
  }

  // Table actions
  handleAction(action: TableAction, item: TableData) {
    switch (action.type) {
      case 'view':
        this.openViewModal(item);
        break;
      case 'edit':
        this.openEditModal(item);
        break;
      case 'delete':
        this.handleDelete(item);
        break;
      case 'custom':
        this.handleCustomAction(action, item);
        break;
    }
  }

  // Pagination
  onPageChange(event: any) {
    this.currentPage.set(event.page);
    this.rowsPerPage.set(event.rows);
  }

  goToPage(page: number) {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  // Search
  onSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
    this.currentPage.set(0); // Reset to first page when searching
  }

  // Utility methods
  private markFormGroupTouched() {
    Object.keys(this.entityForm.controls).forEach(key => {
      this.entityForm.get(key)?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.entityForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) return `${fieldName} is required`;
      if (control.errors['email']) return 'Please enter a valid email';
      // Add more validation messages as needed
    }
    return '';
  }

  formatCellValue(item: TableData, column: any): string {
    const value = item[column.field];

    switch (column.type) {
      case 'date':
        return value ? new Date(value).toLocaleDateString() : '';
      case 'badge':
        return value || '';
      default:
        return value || '';
    }
  }

  getBadgeDetails(item: TableData, column: any) {
    const value = item[column.field];
    return column.badgeMapping?.[value] || { severity: 'info', value };
  }

  // Method to reset the component state (useful for external calls)
  resetComponent() {
    this.closeModals();
    this.searchTerm.set('');
    this.currentPage.set(0);
    this.isSubmitting.set(false);
  }

  // Public method to handle successful operations (to be called from parent)
  onOperationSuccess() {
    this.closeModals();
    this.isSubmitting.set(false);
  }

  // Public method to handle operation errors (to be called from parent)
  onOperationError() {
    this.isSubmitting.set(false);
  }
}
