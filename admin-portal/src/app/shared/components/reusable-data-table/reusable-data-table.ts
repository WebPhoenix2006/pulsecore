import { Component, input, output, computed, signal, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import {
  TableConfig,
  TableData,
  TableAction,
  FormFieldConfig,
  TableColumn,
} from '../../../interfaces/table-config.interface';

interface ActionDialogConfig {
  type: 'view' | 'form' | 'custom';
  title: string;
  width?: string;
  message?: string;
  showCancel?: boolean;
  buttons: {
    label: string;
    loadingLabel?: string;
    severity?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger';
    loading?: boolean;
    disabled?: boolean;
    action?: string;
  }[];
}

@Component({
  selector: 'app-reusable-data-table',
  standalone: false,
  templateUrl: './reusable-data-table.html',
  styleUrl: './reusable-data-table.scss',
  providers: [ConfirmationService],
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
  onBulkAction = output<{ action: string; items: TableData[] }>();

  // Internal state
  showCreateModal = false;
  showEditModal = false;
  showViewModal = false;
  showActionDialog = false;
  actionDialogConfig: ActionDialogConfig = {
    type: 'view',
    title: '',
    buttons: []
  };

  selectedItem = signal<TableData | null>(null);
  selectedItems = signal<TableData[]>([]);
  searchTerm = signal('');
  currentPage = signal(0);
  rowsPerPage = signal(10);
  sortField = signal<string>('');
  sortOrder = signal<number>(0);
  columnFilters = signal<{[key: string]: any}>({});
  activeDropdown = signal<string | null>(null);

  // Form
  entityForm!: FormGroup;
  isSubmitting = signal(false);

  // ViewChild for dropdown management
  @ViewChild('tableContainer') tableContainer!: ElementRef;

  // Computed values
  filteredData = computed(() => {
    let filtered = this.data();

    // Apply search filter
    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter((item) =>
        this.config().columns.some(
          (col) =>
            col.filterable !== false &&
            String(item[col.field] || '')
              .toLowerCase()
              .includes(search)
        )
      );
    }

    // Apply column filters
    const filters = this.columnFilters();
    Object.keys(filters).forEach(field => {
      if (filters[field] !== null && filters[field] !== undefined && filters[field] !== '') {
        filtered = filtered.filter(item =>
          String(item[field] || '').toLowerCase().includes(String(filters[field]).toLowerCase())
        );
      }
    });

    // Apply sorting
    const sortField = this.sortField();
    const sortOrder = this.sortOrder();
    if (sortField && sortOrder !== 0) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];

        if (aVal === bVal) return 0;
        if (aVal === null || aVal === undefined) return sortOrder;
        if (bVal === null || bVal === undefined) return -sortOrder;

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return aVal.localeCompare(bVal) * sortOrder;
        }

        return (aVal > bVal ? 1 : -1) * sortOrder;
      });
    }

    return filtered;
  });

  paginatedData = computed(() => {
    const filtered = this.filteredData();
    const start = this.currentPage() * this.rowsPerPage();
    const end = start + this.rowsPerPage();
    return filtered.slice(start, end);
  });

  totalRecords = computed(() => this.filteredData().length);
  totalPages = computed(() => Math.ceil(this.totalRecords() / this.rowsPerPage()));

  constructor(private fb: FormBuilder, private confirmationService: ConfirmationService) {}

  // Host listener for closing dropdowns when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.action-dropdown')) {
      this.activeDropdown.set(null);
    }
  }

  ngOnInit() {
    this.initializeForm();
    this.rowsPerPage.set(this.config().pageSize || 10);
  }

  initializeForm() {
    const formControls: any = {};

    this.config().formFields.forEach((field) => {
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

  // Enhanced action dialog
  openActionDialog(config: ActionDialogConfig) {
    this.actionDialogConfig = config;
    this.showActionDialog = true;
  }

  closeActionDialog() {
    this.showActionDialog = false;
    this.actionDialogConfig = {
      type: 'view',
      title: '',
      buttons: []
    };
  }

  handleActionDialogButton(button: any) {
    if (button.action) {
      // Handle different button actions
      switch (button.action) {
        case 'save':
          this.handleEdit();
          break;
        case 'create':
          this.handleCreate();
          break;
        default:
          this.onCustomAction.emit({ action: button.action, item: this.selectedItem()! });
      }
    }

    if (!button.loading) {
      this.closeActionDialog();
    }
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
        data: this.entityForm.value,
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  handleDelete(item: TableData) {
    const idField = this.config().idField || 'id';
    const itemId = item[idField];

    this.confirmationService.confirm({
      message: `Are you sure you want to delete this ${this.config().entityName.toLowerCase()}?`,
      header: `Delete ${this.config().entityName}`,
      icon: 'fas fa-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.onDelete.emit(itemId);
      },
    });
  }

  handleCustomAction(action: TableAction, item: TableData) {
    if (action.customFunction) {
      this.onCustomAction.emit({ action: action.customFunction, item });
    }
  }

  // Enhanced table actions
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

  handleEnhancedAction(action: TableAction, item: TableData) {
    this.selectedItem.set(item);
    this.activeDropdown.set(null);
    this.handleAction(action, item);
  }

  // Enhanced pagination
  onPageChange(event: any) {
    this.currentPage.set(event.page);
    this.rowsPerPage.set(event.rows);
  }

  goToPage(page: number) {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  goToFirstPage() {
    this.currentPage.set(0);
  }

  goToLastPage() {
    this.currentPage.set(this.totalPages() - 1);
  }

  changePageSize(event: Event) {
    const target = event.target as HTMLSelectElement;
    const newSize = parseInt(target.value, 10);
    this.rowsPerPage.set(newSize);
    this.currentPage.set(0);
  }

  getPaginationStart(): number {
    return Math.min(this.currentPage() * this.rowsPerPage() + 1, this.totalRecords());
  }

  getPaginationEnd(): number {
    return Math.min((this.currentPage() + 1) * this.rowsPerPage(), this.totalRecords());
  }

  getVisiblePages(): number[] {
    const totalPages = this.totalPages();
    const currentPage = this.currentPage();
    const delta = 2;
    const pages: number[] = [];

    const start = Math.max(1, currentPage + 1 - delta);
    const end = Math.min(totalPages, currentPage + 1 + delta);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  // Enhanced search and filtering
  onSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
    this.currentPage.set(0);
  }

  clearSearch() {
    this.searchTerm.set('');
    this.currentPage.set(0);
  }

  sortData(field: string) {
    if (this.sortField() === field) {
      // Toggle sort order
      const currentOrder = this.sortOrder();
      this.sortOrder.set(currentOrder === 1 ? -1 : currentOrder === -1 ? 0 : 1);
      if (this.sortOrder() === 0) {
        this.sortField.set('');
      }
    } else {
      this.sortField.set(field);
      this.sortOrder.set(1);
    }
    this.currentPage.set(0);
  }

  toggleColumnFilter(field: string) {
    // Implementation for column-specific filtering
    const filters = this.columnFilters();
    if (filters[field] !== undefined) {
      delete filters[field];
    } else {
      filters[field] = '';
    }
    this.columnFilters.set({...filters});
  }

  hasColumnFilter(field: string): boolean {
    return this.columnFilters()[field] !== undefined;
  }

  hasActiveFilters(): boolean {
    return Object.keys(this.columnFilters()).length > 0;
  }

  clearAllFilters() {
    this.columnFilters.set({});
    this.currentPage.set(0);
  }

  // Utility methods
  private markFormGroupTouched() {
    Object.keys(this.entityForm.controls).forEach((key) => {
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

  formatCellValue(item: TableData | null, column: any): string {
    if (!item) return '';

    const value = item[column.field];

    switch (column.type) {
      case 'date':
        return value ? new Date(value).toLocaleDateString() : '';
      case 'badge':
        return value || '';
      case 'number':
        return value !== null && value !== undefined ? String(value) : '';
      default:
        return value || '';
    }
  }

  getBadgeDetails(item: TableData | null, column: any) {
    if (!item) return { severity: 'info', value: 'N/A' };
    const value = item[column.field];
    return column.badgeMapping?.[value] || { severity: 'info', value };
  }

  getBadgeClass(value: any): string {
    const column = this.config().columns.find(col => col.type === 'badge');
    if (column?.badgeMapping?.[value]) {
      return `status-badge ${column.badgeMapping[value].severity}-badge`;
    }
    return 'status-badge info-badge';
  }

  // Method to reset the component state (useful for external calls)
  resetComponent() {
    this.closeModals();
    this.searchTerm.set('');
    this.currentPage.set(0);
    this.isSubmitting.set(false);
    this.selectedItems.set([]);
    this.columnFilters.set({});
    this.sortField.set('');
    this.sortOrder.set(0);
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

  // Selection methods
  toggleItemSelection(item: TableData, event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const selected = this.selectedItems();

    if (checkbox.checked) {
      this.selectedItems.set([...selected, item]);
    } else {
      this.selectedItems.set(selected.filter(selectedItem =>
        this.getItemId(selectedItem) !== this.getItemId(item)
      ));
    }
  }

  toggleAllSelection(event: Event) {
    const checkbox = event.target as HTMLInputElement;

    if (checkbox.checked) {
      this.selectedItems.set([...this.paginatedData()]);
    } else {
      this.selectedItems.set([]);
    }
  }

  isItemSelected(item: TableData): boolean {
    const itemId = this.getItemId(item);
    return this.selectedItems().some(selected => this.getItemId(selected) === itemId);
  }

  isAllSelected(): boolean {
    return this.paginatedData().length > 0 &&
           this.paginatedData().every(item => this.isItemSelected(item));
  }

  isSomeSelected(): boolean {
    return this.selectedItems().length > 0 && !this.isAllSelected();
  }

  clearSelection() {
    this.selectedItems.set([]);
  }

  getItemId(item: TableData): any {
    const idField = this.config().idField || 'id';
    return item[idField];
  }

  isItemHighlighted(item: TableData): boolean {
    return false; // Can be extended for highlighting logic
  }

  // Action helpers
  getQuickActions(item: TableData): TableAction[] {
    return this.config().actions.filter((action, index) =>
      index < 2 && this.isActionVisible(action, item)
    );
  }

  getMoreActions(item: TableData): TableAction[] {
    return this.config().actions.filter((action, index) =>
      index >= 2 && this.isActionVisible(action, item)
    );
  }

  getActionClass(action: TableAction): string {
    return `btn-${action.severity || 'primary'}`;
  }

  getActionMenuClass(action: TableAction): string {
    return action.severity || 'primary';
  }

  isActionVisible(action: TableAction, item: TableData): boolean {
    return action.visible ? action.visible(item) : true;
  }

  toggleActionDropdown(item: TableData) {
    const itemId = this.getItemId(item);
    this.activeDropdown.set(
      this.activeDropdown() === itemId ? null : itemId
    );
  }

  // Image handling
  handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/placeholder.png'; // Default placeholder
  }

  getDefaultAvatar(item: TableData): string {
    // Generate a default avatar based on user initials or use placeholder
    return 'assets/images/default-avatar.png';
  }

  // Empty state helpers
  getEmptyStateTitle(): string {
    if (this.searchTerm()) {
      return `No ${this.config().entityName}s Found`;
    }
    return this.config().emptyMessage || `No ${this.config().entityName}s Available`;
  }

  getEmptyStateMessage(): string {
    if (this.searchTerm()) {
      return `No results found for "${this.searchTerm()}". Try adjusting your search.`;
    }
    return this.config().emptyDescription || `Start by creating your first ${this.config().entityName.toLowerCase()}.`;
  }

  // Stats helpers
  getActiveCount(): number {
    return this.data().filter(item => item['isActive'] === true).length;
  }
}