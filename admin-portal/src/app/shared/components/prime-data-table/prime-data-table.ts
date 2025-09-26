import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, TemplateRef, ContentChild, ViewChild } from '@angular/core';

export interface TableColumn {
  field: string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  type?: 'text' | 'date' | 'status' | 'image' | 'user' | 'actions';
  width?: string;
  sortOrder?: number;
  filterType?: 'text' | 'date' | 'select' | 'multiselect';
  filterOptions?: any[];
}

export interface TableAction {
  label: string;
  value: string;
  icon: string;
  iconPosition?: 'left' | 'right';
  action?: (rowData: any) => void;
}

@Component({
  selector: 'app-prime-data-table',
  standalone: false,
  templateUrl: './prime-data-table.html',
  styleUrl: './prime-data-table.scss',
})
export class PrimeDataTableComponent implements OnInit, OnChanges {
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() loading: boolean = false;
  @Input() paginator: boolean = true;
  @Input() rows: number = 10;
  @Input() rowsPerPageOptions: number[] = [5, 10, 25, 50];
  @Input() globalFilterFields: string[] = [];
  @Input() exportFilename: string = 'data';
  @Input() showCurrentPageReport: boolean = true;
  @Input() currentPageReportTemplate: string = 'Showing {first} to {last} of {totalRecords} entries';
  @Input() selectionMode: 'single' | 'multiple' | null = null;
  @Input() dataKey: string = 'id';
  @Input() actions: TableAction[] = [];
  @Input() showGlobalFilter: boolean = true;
  @Input() showExport: boolean = true;
  @Input() showRefresh: boolean = true;
  @Input() tableTitle: string = '';
  @Input() tableDescription: string = '';
  @Input() emptyMessage: string = 'No data found';
  @Input() createLabel: string = 'Create New';
  @Input() showCreate: boolean = true;
  @Input() enableAdvancedFilters: boolean = true;
  @Input() enableSearchHighlighting: boolean = true;

  @Output() rowSelect = new EventEmitter<any>();
  @Output() rowUnselect = new EventEmitter<any>();
  @Output() selectionChange = new EventEmitter<any>();
  @Output() sortChange = new EventEmitter<any>();
  @Output() filterChange = new EventEmitter<any>();
  @Output() createClick = new EventEmitter<void>();
  @Output() refreshClick = new EventEmitter<void>();
  @Output() exportClick = new EventEmitter<void>();

  @ContentChild('actionsTemplate') actionsTemplate?: TemplateRef<any>;
  @ContentChild('cellTemplate') cellTemplate?: TemplateRef<any>;

  selectedRows: any[] = [];
  globalFilterValue: string = '';
  first: number = 0;
  columnFilters: {[key: string]: any} = {};
  filteredData: any[] = [];
  highlightTerm: string = '';

  ngOnInit() {
    if (this.globalFilterFields.length === 0) {
      this.globalFilterFields = this.columns.map(col => col.field);
    }
    this.filteredData = [...this.data];
    this.applyFilters();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data'] && changes['data'].currentValue) {
      this.filteredData = [...this.data];
      this.applyFilters();
    }
  }

  onGlobalFilter(event: Event) {
    const target = event.target as HTMLInputElement;
    this.globalFilterValue = target.value;
    this.highlightTerm = target.value;
    this.applyFilters();
  }

  onColumnFilter(field: string, event: Event) {
    const target = event.target as HTMLInputElement;
    this.columnFilters[field] = target.value;
    this.applyFilters();
  }

  onDateFilter(field: string, value: string) {
    this.columnFilters[field] = value;
    this.applyFilters();
  }

  clearFilter(field?: string) {
    if (field) {
      delete this.columnFilters[field];
    } else {
      this.globalFilterValue = '';
      this.highlightTerm = '';
      this.columnFilters = {};
    }
    this.applyFilters();
  }

  private applyFilters() {
    let filtered = [...this.data];

    // Apply global filter
    if (this.globalFilterValue) {
      filtered = filtered.filter(item => {
        return this.globalFilterFields.some(field => {
          const value = this.getFieldValue(item, field);
          return value?.toString().toLowerCase().includes(this.globalFilterValue.toLowerCase());
        });
      });
    }

    // Apply column filters
    Object.keys(this.columnFilters).forEach(field => {
      const filterValue = this.columnFilters[field];
      if (filterValue) {
        filtered = filtered.filter(item => {
          const value = this.getFieldValue(item, field);
          const column = this.columns.find(col => col.field === field);

          if (column?.type === 'date') {
            const itemDate = new Date(value);
            const filterDate = new Date(filterValue);
            return itemDate.toDateString() === filterDate.toDateString();
          }

          return value?.toString().toLowerCase().includes(filterValue.toLowerCase());
        });
      }
    });

    this.filteredData = filtered;
  }

  highlightText(text: string, highlight: string): string {
    if (!highlight || !this.enableSearchHighlighting) {
      return text;
    }

    const re = new RegExp(`(${highlight})`, 'gi');
    return text.replace(re, '<mark class="search-highlight">$1</mark>');
  }

  getHighlightedValue(rowData: any, field: string): string {
    const value = this.getFieldValue(rowData, field)?.toString() || '';
    return this.highlightText(value, this.highlightTerm);
  }

  onSelectionChange(selection: any) {
    this.selectedRows = Array.isArray(selection) ? selection : [selection];
    this.selectionChange.emit(this.selectedRows);
  }

  onRowSelect(event: any) {
    this.rowSelect.emit(event);
  }

  onRowUnselect(event: any) {
    this.rowUnselect.emit(event);
  }

  onSort(event: any) {
    this.sortChange.emit(event);
  }

  onFilter(event: any) {
    this.filterChange.emit(event);
  }

  onCreate() {
    this.createClick.emit();
  }

  onRefresh() {
    this.refreshClick.emit();
  }

  onExport() {
    this.exportClick.emit();
  }

  executeAction(action: TableAction, rowData: any) {
    if (action.action) {
      action.action(rowData);
    }
  }

  getActionsForRow(rowData: any): any[] {
    return this.actions.map(action => ({
      label: action.label,
      value: action.value,
      icon: action.icon,
      iconPosition: action.iconPosition || 'left',
      action: () => this.executeAction(action, rowData)
    }));
  }

  getFieldValue(rowData: any, field: string): any {
    return field.split('.').reduce((obj, key) => obj?.[key], rowData);
  }

  formatDate(value: any): string {
    if (!value) return '';
    const date = new Date(value);
    return date.toLocaleDateString();
  }

  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'active': 'success-badge',
      'inactive': 'secondary-badge',
      'pending': 'warning-badge',
      'rejected': 'danger-badge',
      'approved': 'success-badge',
      'draft': 'info-badge'
    };
    return `status-badge ${statusMap[status?.toLowerCase()] || 'secondary-badge'}`;
  }

  getFilterPlaceholder(column: TableColumn): string {
    switch (column.type) {
      case 'date':
        return 'Filter by date...';
      case 'status':
        return 'Filter by status...';
      default:
        return `Filter ${column.header.toLowerCase()}...`;
    }
  }
}