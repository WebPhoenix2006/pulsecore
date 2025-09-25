# 📋 SpecialH1 Component (cus-h1)

A styled heading component that renders an `<h1>` element with a decorative gradient accent bar. Perfect for page titles and section headers in your Angular application.

## ✨ Features

- **Decorative Styling** - Includes a gradient accent bar on the left side
- **Dynamic Text** - Accepts text content via Angular signals
- **CSS Variables** - Uses CSS custom properties for theming
- **Lightweight** - Minimal footprint with focused functionality
- **Responsive** - Works well across different screen sizes

## 🚀 Installation & Setup

### Component Declaration
```typescript
import { SpecialH1 } from './shared/components/special-h1/special-h1';

@NgModule({
  declarations: [
    SpecialH1,
    // ... other components
  ]
})
export class SharedModule {}
```

## 📦 Basic Usage

### Template Usage
```html
<!-- Simple usage -->
<cus-h1 [text]="'My Page Title'"></cus-h1>

<!-- With dynamic content -->
<cus-h1 [text]="pageTitle()"></cus-h1>

<!-- In forms or sections -->
<div class="page-header">
  <cus-h1 [text]="'User Management'"></cus-h1>
  <p class="description">Manage your application users and permissions</p>
</div>
```

### Component Usage
```typescript
import { Component, signal } from '@angular/core';

@Component({
  template: `
    <div class="container">
      <cus-h1 [text]="title()"></cus-h1>
      <div class="content">
        <!-- Your content here -->
      </div>
    </div>
  `
})
export class MyPageComponent {
  title = signal('Dashboard Overview');

  // Dynamic title updates
  updateTitle(newTitle: string) {
    this.title.set(newTitle);
  }
}
```

## ⚙️ Component API

### Inputs
| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `text` | `string` | ✅ **Required** | The text content to display in the heading |

### Component Structure
```typescript
@Component({
  selector: 'cus-h1',
  standalone: false,
  templateUrl: './special-h1.html',
  styleUrl: './special-h1.scss',
})
export class SpecialH1 {
  text = input.required<string>();
}
```

## 🎨 Styling & Theming

### Default Appearance
The component features:
- **Font Size**: 20px
- **Gradient Accent**: Left-side vertical bar using `--gradient-color`
- **Positioning**: Relative positioning for accent bar placement

### CSS Structure
```scss
.special-h1 {
  font-size: 20px;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    left: -10px;
    top: 0;
    height: 100%;
    width: 10px;
    background: var(--gradient-color);
  }
}
```

### Customization
You can customize the appearance by overriding CSS custom properties:

```scss
:root {
  --gradient-color: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

// Or override specific styles
.my-custom-header {
  .special-h1 {
    font-size: 24px;
    color: #333;

    &::after {
      width: 5px;
      background: #ff6b6b;
    }
  }
}
```

## 💡 Usage Examples

### Page Headers
```html
<!-- Main page header -->
<header class="page-header">
  <cus-h1 [text]="'Products Catalog'"></cus-h1>
  <p class="subtitle">Browse and manage your product inventory</p>
</header>
```

### Section Titles
```html
<!-- Section within a page -->
<section class="user-profile">
  <cus-h1 [text]="'Personal Information'"></cus-h1>
  <form [formGroup]="profileForm">
    <!-- Form fields -->
  </form>
</section>
```

### Dynamic Content
```html
<!-- With dynamic content based on route -->
<cus-h1 [text]="getPageTitle()"></cus-h1>
```

```typescript
export class DynamicPageComponent {
  constructor(private route: ActivatedRoute) {}

  getPageTitle(): string {
    const routeData = this.route.snapshot.data;
    return routeData['title'] || 'Default Title';
  }
}
```

### With Conditional Rendering
```html
<!-- Show title only when data is loaded -->
@if (isLoaded()) {
  <cus-h1 [text]="dataTitle()"></cus-h1>
  <div class="data-content">
    <!-- Content here -->
  </div>
}
```

## 🎯 Best Practices

1. **Use for Main Headings** - Reserve for primary page or section titles
2. **Keep Text Concise** - Avoid overly long titles that may wrap awkwardly
3. **Consistent Hierarchy** - Use consistently throughout your application
4. **Semantic HTML** - The component renders proper `<h1>` tags for accessibility

### Recommended Usage Pattern
```html
<!-- Good: Clear hierarchy -->
<main class="page-content">
  <cus-h1 [text]="'User Dashboard'"></cus-h1>

  <section>
    <h2>Recent Activity</h2>
    <!-- Content -->
  </section>

  <section>
    <h2>Quick Actions</h2>
    <!-- Content -->
  </section>
</main>
```

## 🔧 Integration Tips

### With Router Data
```typescript
// In routing configuration
{
  path: 'users',
  component: UsersComponent,
  data: { title: 'User Management' }
}

// In component
export class UsersComponent implements OnInit {
  pageTitle = signal('');

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    const title = this.route.snapshot.data['title'];
    this.pageTitle.set(title);
  }
}
```

### With Internationalization (i18n)
```html
<cus-h1 [text]="'PAGES.DASHBOARD.TITLE' | translate"></cus-h1>
```

### With Loading States
```html
@if (isLoading()) {
  <div class="skeleton-title"></div>
} @else {
  <cus-h1 [text]="actualTitle()"></cus-h1>
}
```

## 📱 Accessibility

- **Semantic HTML** - Uses proper `<h1>` tag
- **Screen Readers** - Properly announced as a heading
- **Keyboard Navigation** - No interactive elements, so no keyboard concerns
- **Color Contrast** - Ensure sufficient contrast for the gradient accent

## 🧪 Testing

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SpecialH1 } from './special-h1';

describe('SpecialH1', () => {
  let component: SpecialH1;
  let fixture: ComponentFixture<SpecialH1>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SpecialH1]
    });
    fixture = TestBed.createComponent(SpecialH1);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the provided text', () => {
    fixture.componentRef.setInput('text', 'Test Title');
    fixture.detectChanges();

    const h1Element = fixture.nativeElement.querySelector('h1');
    expect(h1Element.textContent).toBe('Test Title');
  });

  it('should have the correct CSS class', () => {
    fixture.componentRef.setInput('text', 'Test');
    fixture.detectChanges();

    const h1Element = fixture.nativeElement.querySelector('h1');
    expect(h1Element).toHaveClass('special-hi');
  });
});
```

## 📝 Notes

- **CSS Class Name**: Note that the CSS class is `.special-hi` (not `.special-h1`) as defined in the template
- **Gradient Dependency**: Ensure `--gradient-color` CSS variable is defined in your global styles
- **Positioning**: The accent bar uses absolute positioning, so ensure parent containers can accommodate it

## 🔄 Version Compatibility

- **Angular**: 18.0.0+
- **TypeScript**: 5.0.0+
- **Browser Support**: All modern browsers supporting CSS custom properties

## 📄 Related Components

- [`FormField`](./form-field.readme.md) - For form input labels
- [`Button`](./button.readme.md) - For action buttons
- [`ReusableDataTable`](./reusable-data-table.readme.md) - Uses this component for table titles