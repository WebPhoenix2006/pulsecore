import { Component, signal, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import {
  TableColumn,
  TableAction,
} from '../../../shared/components/prime-data-table/prime-data-table';
import { CategoryService } from '../../services/category';
import { Category as CategoryInterface } from '../../../interfaces/category.interface';
import { ToastService } from '../../../shared/services/toast.service';
import { ConfirmationService, MessageService } from 'primeng/api';

interface CategoryData extends CategoryInterface {}

@Component({
  selector: 'app-category',
  standalone: false,
  templateUrl: './category.html',
  styleUrl: './category.scss',
})
export class Category implements OnInit {
  categories = signal<CategoryData[]>([]);
  loading = signal(false);
  selectedCategories: CategoryData[] = [];
  categoryForm!: FormGroup;

  isModalVisible = signal(false);
  viewModalVisible = false;
  isEditMode = false;
  editingCategoryId: number | null = null;
  selectedCategory: CategoryData | null = null;

  tableColumns: TableColumn[] = [
    {
      field: 'name',
      header: 'Name',
      sortable: true,
      filterable: true,
      type: 'text',
      width: '25%',
      filterType: 'text'
    },
    {
      field: 'description',
      header: 'Description',
      sortable: true,
      filterable: true,
      type: 'text',
      width: '40%',
      filterType: 'text'
    },
    {
      field: 'created_at',
      header: 'Created',
      sortable: true,
      filterable: true,
      type: 'date',
      width: '15%',
      filterType: 'date'
    },
    {
      field: 'updated_at',
      header: 'Last Updated',
      sortable: true,
      filterable: true,
      type: 'date',
      width: '15%',
      filterType: 'date'
    },
    { field: 'actions', header: 'Actions', type: 'actions', width: '120px' },
  ];

  tableActions: TableAction[] = [
    {
      label: 'View Details',
      value: 'view',
      icon: 'eye',
      iconPosition: 'left',
      action: (rowData) => this.onViewCategory(rowData),
    },
    {
      label: 'Edit',
      value: 'edit',
      icon: 'edit',
      iconPosition: 'left',
      action: (rowData) => this.onEditCategory(rowData),
    },
    {
      label: 'Delete',
      value: 'delete',
      icon: 'trash',
      iconPosition: 'left',
      action: (rowData) => this.onDeleteCategory(rowData.id),
    },
  ];

  constructor(
    private categoryService: CategoryService,
    private toastService: ToastService,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.loadCategories();

    this.categoryForm = this.fb.group({
      name: [''],
      description: [''],
    });
  }

  private loadCategories() {
    this.loading.set(true);
    this.categoryService.getCategories().subscribe({
      next: (response) => {
        this.categories.set(response.results);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.toastService.showError('Failed to load categories');
        this.loading.set(false);
      },
    });
  }

  private initCategoryForm(category?: CategoryData) {
    this.categoryForm.patchValue({
      name: category?.name || '',
      description: category?.description || '',
    });
  }

  onCreateCategory() {
    this.isEditMode = false;
    this.editingCategoryId = null;
    this.initCategoryForm();
    this.isModalVisible.set(true);
  }

  onEditCategory(category: CategoryData) {
    this.isEditMode = true;
    this.editingCategoryId = category.id;
    this.initCategoryForm(category);
    this.isModalVisible.set(true);
  }

  onSubmitCategory() {
    if (this.categoryForm.invalid) return;

    const payload = this.categoryForm.value;

    if (this.isEditMode && this.editingCategoryId) {
      this.categoryService.updateCategory(this.editingCategoryId, payload).subscribe({
        next: (updated) => {
          this.categories.update((cats) =>
            cats.map((cat) => (cat.id === updated.id ? updated : cat))
          );
          this.toastService.showSuccess('Category updated successfully!');
          this.isModalVisible.set(false);
        },
        error: (err) => this.toastService.showError('Failed to update category'),
      });
    } else {
      this.categoryService.createCategory(payload).subscribe({
        next: (created) => {
          this.categories.update((cats) => [created, ...cats]);
          this.toastService.showSuccess('Category created successfully!');
          this.isModalVisible.set(false);
        },
        error: (err) => this.toastService.showError('Failed to create category'),
      });
    }
  }

  onDeleteCategory(categoryId: number) {
    if (confirm('Are you sure you want to delete this category?')) {
      this.loading.set(true);

      this.categoryService.deleteCategory(categoryId).subscribe({
        next: () => {
          this.categories.update((cats) => cats.filter((cat) => cat.id !== categoryId));
          this.loading.set(false);
          this.toastService.showSuccess('Category deleted successfully!');
        },
        error: (error) => {
          console.error('Error deleting category:', error);
          this.toastService.showError('Failed to delete category');
          this.loading.set(false);
        },
      });
    }
  }

  onViewCategory(category: CategoryData) {
    this.selectedCategory = category;
    this.viewModalVisible = true;
  }

  onRefreshData() {
    this.loadCategories();
  }

  onExportData() {
    const csvData = this.generateCategoryCSV();
    this.downloadCSV(csvData, 'categories.csv');
    this.toastService.showSuccess('Categories exported successfully!');
  }

  private generateCategoryCSV(): string {
    const headers = ['ID', 'Name', 'Description', 'Created At', 'Updated At'];
    const rows = this.categories().map(cat => [
      cat.id.toString(),
      cat.name,
      cat.description || '',
      cat.created_at || '',
      cat.updated_at || ''
    ]);

    return [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
  }

  private downloadCSV(data: string, filename: string): void {
    const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  onSelectionChange(selectedRows: CategoryData[]) {
    this.selectedCategories = selectedRows;
    console.log('Selected categories:', selectedRows);
  }

  // Getter/Setter to unwrap signal for template binding
  get modalVisible(): boolean {
    return this.isModalVisible();
  }
  set modalVisible(value: boolean) {
    this.isModalVisible.set(value);
  }

  get nameControl(): FormControl {
    return this.categoryForm.get('name') as FormControl;
  }

  get descriptionControl(): FormControl {
    return this.categoryForm.get('description') as FormControl;
  }
}
