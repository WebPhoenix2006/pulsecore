import { Component, signal, OnInit, ViewChild } from '@angular/core';
import { TableConfig, TableData } from '../../../interfaces/table-config.interface';
import { categoryTableConfig } from '../../config/category-table.config';
import { ReusableDataTable } from '../../../shared/components/reusable-data-table/reusable-data-table';
import { CategoryService } from '../../services/category';
import { Category as CategoryInterface } from '../../../interfaces/category.interface';
import { ToastService } from '../../../shared/services/toast.service';

interface CategoryData extends CategoryInterface {}

@Component({
  selector: 'app-category',
  standalone: false,
  templateUrl: './category.html',
  styleUrl: './category.scss'
})
export class Category implements OnInit {
  @ViewChild(ReusableDataTable) dataTable!: ReusableDataTable;

  tableConfig: TableConfig = categoryTableConfig;
  categories = signal<CategoryData[]>([]);
  loading = signal(false);

  constructor(
    private categoryService: CategoryService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadCategories();
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
      }
    });
  }

  onCreateCategory(categoryData: TableData) {
    this.loading.set(true);

    const newCategory = {
      name: categoryData['name'],
      description: categoryData['description'] || ''
    };

    this.categoryService.createCategory(newCategory).subscribe({
      next: (createdCategory) => {
        this.categories.update(categories => [...categories, createdCategory]);
        this.loading.set(false);
        this.dataTable.onOperationSuccess();
        this.toastService.showSuccess('Category created successfully!');
      },
      error: (error) => {
        console.error('Error creating category:', error);
        this.toastService.showError('Failed to create category');
        this.loading.set(false);
        this.dataTable.onOperationError();
      }
    });
  }

  onEditCategory(event: { id: any; data: TableData }) {
    this.loading.set(true);

    const updateData = {
      name: event.data['name'],
      description: event.data['description'] || ''
    };

    this.categoryService.updateCategory(event.id, updateData).subscribe({
      next: (updatedCategory) => {
        this.categories.update(categories =>
          categories.map(cat => cat.id === event.id ? updatedCategory : cat)
        );
        this.loading.set(false);
        this.dataTable.onOperationSuccess();
        this.toastService.showSuccess('Category updated successfully!');
      },
      error: (error) => {
        console.error('Error updating category:', error);
        this.toastService.showError('Failed to update category');
        this.loading.set(false);
        this.dataTable.onOperationError();
      }
    });
  }

  onDeleteCategory(categoryId: any) {
    this.loading.set(true);

    this.categoryService.deleteCategory(categoryId).subscribe({
      next: () => {
        this.categories.update(categories =>
          categories.filter(cat => cat.id !== categoryId)
        );
        this.loading.set(false);
        this.toastService.showSuccess('Category deleted successfully!');
      },
      error: (error) => {
        console.error('Error deleting category:', error);
        this.toastService.showError('Failed to delete category');
        this.loading.set(false);
      }
    });
  }

  onViewCategory(category: TableData) {
    console.log('Viewing category:', category);
    this.toastService.showInfo(`Viewing details for ${category['name']}`);
  }

  onCustomAction(event: { action: string; item: TableData }) {
    console.log('Custom action:', event);
    this.toastService.showInfo(`Custom action: ${event.action}`);
  }
}
