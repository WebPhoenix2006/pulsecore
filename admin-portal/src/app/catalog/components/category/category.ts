import { Component, signal, OnInit, ViewChild } from '@angular/core';
import { TableConfig, TableData } from '../../../interfaces/table-config.interface';
import { categoryTableConfig } from '../../config/category-table.config';
import { ReusableDataTable } from '../../../shared/components/reusable-data-table/reusable-data-table';

interface CategoryData {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

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

  // Dummy data for demonstration
  private dummyCategories: CategoryData[] = [
    {
      id: '1',
      name: 'Electronics',
      description: 'Electronic devices including smartphones, laptops, and accessories',
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-02-20T14:15:00Z'
    },
    {
      id: '2',
      name: 'Clothing',
      description: 'Fashion items including shirts, pants, dresses, and shoes',
      created_at: '2024-01-20T09:15:00Z',
      updated_at: '2024-02-18T11:30:00Z'
    },
    {
      id: '3',
      name: 'Home & Garden',
      description: 'Home improvement items, furniture, and gardening supplies',
      created_at: '2024-02-01T16:45:00Z',
      updated_at: '2024-02-25T08:20:00Z'
    },
    {
      id: '4',
      name: 'Books',
      description: 'Physical and digital books across various genres and topics',
      created_at: '2024-02-05T13:22:00Z',
      updated_at: '2024-02-28T15:45:00Z'
    },
    {
      id: '5',
      name: 'Sports & Outdoors',
      description: 'Sports equipment, outdoor gear, and fitness accessories',
      created_at: '2024-02-10T11:30:00Z',
      updated_at: '2024-03-01T10:15:00Z'
    },
    {
      id: '6',
      name: 'Health & Beauty',
      description: 'Skincare products, cosmetics, and health supplements',
      created_at: '2024-02-12T14:20:00Z',
      updated_at: '2024-03-02T09:45:00Z'
    },
    {
      id: '7',
      name: 'Toys & Games',
      description: 'Toys for children, board games, and educational materials',
      created_at: '2024-02-15T10:45:00Z',
      updated_at: '2024-03-03T16:30:00Z'
    },
    {
      id: '8',
      name: 'Automotive',
      description: 'Car parts, tools, and automotive accessories',
      created_at: '2024-02-18T12:15:00Z',
      updated_at: '2024-03-04T13:20:00Z'
    }
  ];

  ngOnInit() {
    this.loadCategories();
  }

  private loadCategories() {
    this.loading.set(true);

    // Simulate API call with setTimeout
    setTimeout(() => {
      this.categories.set(this.dummyCategories);
      this.loading.set(false);
    }, 800);
  }

  onCreateCategory(categoryData: TableData) {
    console.log('Creating category:', categoryData);

    // Simulate API call
    this.loading.set(true);

    setTimeout(() => {
      const newCategory: CategoryData = {
        id: Date.now().toString(),
        name: categoryData['name'],
        description: categoryData['description'] || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      this.categories.update(categories => [...categories, newCategory]);
      this.loading.set(false);
      this.dataTable.onOperationSuccess();

      // Here you would typically call your API service
      console.log('Category created successfully:', newCategory);
    }, 1000);
  }

  onEditCategory(event: { id: any; data: TableData }) {
    console.log('Editing category:', event);

    this.loading.set(true);

    setTimeout(() => {
      this.categories.update(categories =>
        categories.map(cat =>
          cat.id === event.id
            ? {
                ...cat,
                name: event.data['name'],
                description: event.data['description'] || '',
                updated_at: new Date().toISOString()
              }
            : cat
        )
      );

      this.loading.set(false);
      this.dataTable.onOperationSuccess();
      console.log('Category updated successfully');
    }, 1000);
  }

  onDeleteCategory(categoryId: any) {
    console.log('Deleting category:', categoryId);

    this.loading.set(true);

    setTimeout(() => {
      this.categories.update(categories =>
        categories.filter(cat => cat.id !== categoryId)
      );

      this.loading.set(false);
      console.log('Category deleted successfully');
    }, 800);
  }

  onViewCategory(category: TableData) {
    console.log('Viewing category:', category);
    // Handle view logic here - could open a detailed view, etc.
  }

  onCustomAction(event: { action: string; item: TableData }) {
    console.log('Custom action:', event);
    // Handle any custom actions here
  }
}
