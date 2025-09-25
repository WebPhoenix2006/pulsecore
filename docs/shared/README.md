# 📚 PulseCore Reusable Components Library

A comprehensive collection of reusable Angular components designed for the PulseCore application. These components follow modern Angular best practices, utilize Angular 18+ signals, and provide a consistent, themeable design system.

## 📋 Component Index

### 🗂️ Data Display Components

#### [📊 Reusable Data Table](./reusable-data-table.readme.md)
**Location:** `src/app/shared/components/reusable-data-table/`
**Selector:** `<app-reusable-data-table>`

A comprehensive data table component with full CRUD operations, pagination, search, filtering, and modal forms.

**Key Features:**
- ✅ Full CRUD operations with built-in modals
- ✅ Advanced search and filtering
- ✅ Configurable pagination
- ✅ Multiple column types (text, date, badge, image)
- ✅ Dynamic form generation
- ✅ Responsive design
- ✅ Loading states and empty state handling

**Best For:** Admin dashboards, data management interfaces, user tables, product catalogs

---

### 📝 Form Components

#### [📄 Form Field](./form-field.readme.md)
**Location:** `src/app/shared/components/form-field/`
**Selector:** `<app-form-field>`

A versatile form input component supporting multiple field types with Angular reactive forms integration.

**Key Features:**
- ✅ Multiple input types (text, email, password, select, checkbox, file, etc.)
- ✅ Angular reactive forms integration (ControlValueAccessor)
- ✅ Built-in validation and error handling
- ✅ Password visibility toggle
- ✅ Multi-select support
- ✅ File upload handling

**Best For:** Dynamic forms, user registration, settings pages, data entry

#### [📎 Smart File Field](./smartfilefield.readme.md)
**Location:** `src/app/shared/components/smart-file-field/`
**Selector:** `<app-smart-file-field>`

An advanced file upload component with preview capabilities and drag-and-drop support.

**Key Features:**
- ✅ Image preview for image files
- ✅ Document information display
- ✅ Drag and drop upload
- ✅ File validation (size, type)
- ✅ Angular reactive forms integration
- ✅ Responsive design

**Best For:** Profile image uploads, document attachments, media management

---

### 🎨 UI Components

#### [🔘 Button](./button.readme.md)
**Location:** `src/app/shared/ui/button/`
**Selector:** `<cus-btn>`

A customizable button component with multiple sizes and styles.

**Key Features:**
- ✅ Multiple sizes (small, large, full)
- ✅ Outlined variant support
- ✅ Disabled state handling
- ✅ Type support (button, submit)
- ✅ Angular signals integration

**Best For:** Forms, call-to-actions, navigation, toolbars

#### [📋 Special H1](./special-h1.readme.md)
**Location:** `src/app/shared/components/special-h1/`
**Selector:** `<cus-h1>`

A styled heading component with decorative gradient accent bar.

**Key Features:**
- ✅ Gradient accent bar styling
- ✅ Dynamic text content
- ✅ CSS custom properties theming
- ✅ Responsive typography

**Best For:** Page titles, section headers, feature highlights

#### [🌈 Gradient Background](./gradient-background.readme.md)
**Location:** `src/app/shared/ui/gradient-background/`
**Selector:** `<app-gradient-background>`

A visually appealing gradient background component for hero sections and feature highlights.

**Key Features:**
- ✅ Gradient background styling
- ✅ Centered content layout
- ✅ Dynamic title and body text
- ✅ Responsive design
- ✅ Flexible sizing

**Best For:** Hero sections, landing pages, call-to-action areas, feature highlights

#### [⏳ Loader](./loader.readme.md)
**Location:** `src/app/shared/components/loader/`
**Selector:** `<app-loader>`

An animated loading spinner with optional text display.

**Key Features:**
- ✅ Smooth CSS animations
- ✅ Optional loading text
- ✅ Themed with CSS custom properties
- ✅ Lightweight and performant

**Best For:** Loading states, API calls, form submissions, page transitions

#### [🎨 SVG Icons](./svg-icons.readme.md) *[In Development]*
**Location:** `src/app/shared/components/svg-icons/`
**Selector:** `<app-svg-icons>`

A centralized SVG icon management component (currently in development).

**Planned Features:**
- 🚧 Icon registry service
- 🚧 Dynamic icon loading
- 🚧 Customizable sizing and theming
- 🚧 Performance optimized

**Best For:** Icons throughout the application, navigation, buttons, status indicators

---

## 🚀 Quick Start Guide

### 1. Import Components

```typescript
// Import in your module
import { ReusableDataTable } from './shared/components/reusable-data-table/reusable-data-table';
import { FormField } from './shared/components/form-field/form-field';
import { Button } from './shared/ui/button/button';
import { SpecialH1 } from './shared/components/special-h1/special-h1';
// ... other imports

@NgModule({
  declarations: [
    ReusableDataTable,
    FormField,
    Button,
    SpecialH1,
    // ... your other components
  ],
  imports: [
    ReactiveFormsModule, // Required for form components
    // PrimeNG modules as needed
  ]
})
export class SharedModule {}
```

### 2. Basic Usage Example

```html
<!-- Page header -->
<cus-h1 [text]="'User Management'"></cus-h1>

<!-- Data table with CRUD operations -->
<app-reusable-data-table
  [config]="tableConfig()"
  [data]="userData()"
  [loading]="isLoading()"
  (onCreate)="handleCreate($event)"
  (onEdit)="handleEdit($event)"
  (onDelete)="handleDelete($event)">
</app-reusable-data-table>

<!-- Loading state -->
@if (processing()) {
  <app-loader [loadingText]="'Processing request...'"></app-loader>
}

<!-- Action buttons -->
<div class="actions">
  <cus-btn
    [buttonText]="'Save Changes'"
    [size]="'large'"
    (click)="save()">
  </cus-btn>
  <cus-btn
    [buttonText]="'Cancel'"
    [isOutlined]="true"
    (click)="cancel()">
  </cus-btn>
</div>
```

## 🎨 Theming System

All components use CSS custom properties for consistent theming:

```scss
:root {
  // Colors
  --primary-color: #3b82f6;
  --secondary-color: #6366f1;
  --text-color: #1e293b;
  --white: #ffffff;
  --error-color: #ef4444;
  --success-color: #10b981;

  // Layout
  --card-bg: #ffffff;
  --surface-color: #f8fafc;
  --border-color: #e2e8f0;

  // Gradients
  --gradient-color: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

  // Shadows
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

// Dark mode support
[data-theme='dark'] {
  --card-bg: #1e293b;
  --surface-color: #334155;
  --text-color: #f8fafc;
  --border-color: #475569;
}
```

## 📱 Responsive Design

All components are built with mobile-first responsive design:

- **Mobile** (< 768px): Simplified layouts, touch-friendly interactions
- **Tablet** (768px - 1024px): Optimized spacing and typography
- **Desktop** (> 1024px): Full feature set with hover effects

## 🔧 Component Architecture

### Design Principles

1. **Signal-Based**: All components use Angular 18+ signals for reactive state management
2. **Standalone Ready**: Components can work in both module-based and standalone applications
3. **Accessible**: Built with ARIA labels, semantic HTML, and keyboard navigation
4. **Themeable**: CSS custom properties for consistent theming
5. **Type-Safe**: Full TypeScript support with comprehensive interfaces

### Common Patterns

#### Input/Output Pattern
```typescript
@Component({...})
export class MyComponent {
  // Inputs using signals
  config = input.required<ComponentConfig>();
  data = input<ComponentData[]>([]);
  loading = input<boolean>(false);

  // Outputs for events
  onCreate = output<DataItem>();
  onEdit = output<{ id: any; data: DataItem }>();
  onDelete = output<any>();
}
```

#### Configuration Interface Pattern
```typescript
interface ComponentConfig {
  title: string;
  description?: string;
  options: ComponentOptions;
  customization?: CustomizationOptions;
}
```

## 🧪 Testing

### Component Testing Example
```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyComponent } from './my-component';

describe('MyComponent', () => {
  let component: MyComponent;
  let fixture: ComponentFixture<MyComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MyComponent],
      imports: [ReactiveFormsModule]
    });
    fixture = TestBed.createComponent(MyComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Add specific tests for component functionality
});
```

## 📦 Dependencies

### Required Dependencies
- `@angular/core` ^18.0.0
- `@angular/forms` ^18.0.0 (for form components)
- `primeng` ^17.0.0 (for UI components like modals)
- `primeicons` ^7.0.0 (for icons)

### Optional Dependencies
- `@angular/cdk` (for advanced UI features)
- `@angular/animations` (for animations)

## 🔄 Version Compatibility

- **Angular**: 18.0.0+
- **TypeScript**: 5.0.0+
- **Node.js**: 18.0.0+
- **Browser Support**: All modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

## 📈 Performance Best Practices

1. **Lazy Loading**: Use dynamic imports for large components
2. **OnPush Strategy**: Components use OnPush change detection where applicable
3. **Signal Optimization**: Computed signals for derived state
4. **CSS Efficiency**: Modern CSS with minimal runtime calculations
5. **Bundle Optimization**: Tree-shakeable component architecture

## 🛠️ Development Guidelines

### Adding New Components

1. Create component in appropriate folder (`/shared/components/` or `/shared/ui/`)
2. Follow the signal-based input/output pattern
3. Include comprehensive TypeScript interfaces
4. Add responsive SCSS styling with CSS custom properties
5. Write component documentation following the established format
6. Add unit tests
7. Update this index file

### Component Documentation Template

Each component should have:
- Overview and features
- Installation and setup instructions
- API documentation (inputs, outputs, methods)
- Usage examples with code samples
- Styling and theming information
- Best practices and guidelines
- Testing examples
- Related components

## 🔗 Related Resources

- [Angular Documentation](https://angular.io/docs)
- [PrimeNG Components](https://primeng.org/)
- [Angular Signals Guide](https://angular.io/guide/signals)
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)

## 🐛 Troubleshooting

### Common Issues

1. **Components not displaying**: Check module imports and declarations
2. **Styling not applied**: Verify CSS custom properties are defined
3. **Form components not working**: Ensure ReactiveFormsModule is imported
4. **PrimeNG components not showing**: Import required PrimeNG modules

### Support

For component-specific issues, refer to the individual component documentation. For general questions or bug reports, please check the project's issue tracker.

---

## 📄 License

This component library is part of the PulseCore project and follows the project's licensing terms.

---

**Last Updated:** September 2024
**Component Count:** 7 (6 active + 1 in development)
**Documentation Coverage:** 100% for active components