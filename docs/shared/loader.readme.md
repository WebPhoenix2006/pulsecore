# ⏳ Loader Component

A customizable animated loading spinner component for Angular applications. Features a smooth spinning animation with optional loading text display.

## ✨ Features

- **Animated Spinner** - Smooth rotating spinner with CSS animations
- **Optional Text** - Configurable loading text display
- **Themed** - Uses CSS custom properties for consistent styling
- **Lightweight** - Pure CSS animations with minimal footprint
- **Flexible** - Optional text content via Angular signals
- **Responsive** - Works across all screen sizes

## 🚀 Installation & Setup

### Component Declaration
```typescript
import { Loader } from './shared/components/loader/loader';

@NgModule({
  declarations: [
    Loader,
    // ... other components
  ]
})
export class SharedModule {}
```

## 📦 Basic Usage

### Simple Loader
```html
<!-- Basic spinner only -->
<app-loader></app-loader>

<!-- With loading text -->
<app-loader [loadingText]="'Loading data...'"></app-loader>

<!-- With dynamic text -->
<app-loader [loadingText]="loadingMessage()"></app-loader>
```

### Component Integration
```typescript
import { Component, signal } from '@angular/core';

@Component({
  template: `
    <div class="content">
      @if (isLoading()) {
        <app-loader [loadingText]="'Fetching user data...'"></app-loader>
      } @else {
        <div class="data-display">
          <!-- Your content here -->
        </div>
      }
    </div>
  `
})
export class MyComponent {
  isLoading = signal(true);

  async loadData() {
    this.isLoading.set(true);
    try {
      // Your data loading logic
      await this.dataService.fetchData();
    } finally {
      this.isLoading.set(false);
    }
  }
}
```

## ⚙️ Component API

### Inputs
| Input | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `loadingText` | `string \| null` | ❌ Optional | `null` | Text to display below the spinner |

### Component Structure
```typescript
@Component({
  selector: 'app-loader',
  standalone: false,
  templateUrl: './loader.html',
  styleUrl: './loader.scss',
})
export class Loader {
  loadingText = input<string | null>(null);
}
```

## 🎨 Styling & Theming

### Default Appearance
The component features:
- **Spinner Size**: 36px × 36px
- **Border Width**: 4px
- **Animation**: 1 second linear infinite rotation
- **Colors**: Uses `--text-color` CSS variable

### CSS Structure
```scss
.loader {
  border: 4px solid var(--text-color);
  border-left-color: transparent;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  animation: spin89345 1s linear infinite;
}

.loading-text {
  font-size: 16px;
  color: var(--text-color);
}

@keyframes spin89345 {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

### Customization Examples

#### Custom Colors
```scss
.my-custom-loader {
  .loader {
    border-color: #3b82f6; // Blue border
    border-left-color: transparent;
  }

  .loading-text {
    color: #6b7280; // Gray text
  }
}
```

#### Different Sizes
```scss
// Small loader
.loader-small {
  .loader {
    width: 24px;
    height: 24px;
    border-width: 3px;
  }
}

// Large loader
.loader-large {
  .loader {
    width: 48px;
    height: 48px;
    border-width: 5px;
  }
}
```

#### Custom Animation Speed
```scss
.loader-fast {
  .loader {
    animation-duration: 0.5s;
  }
}

.loader-slow {
  .loader {
    animation-duration: 2s;
  }
}
```

## 💡 Usage Examples

### Loading States
```html
<!-- API Loading -->
@if (apiLoading()) {
  <app-loader [loadingText]="'Fetching data from server...'"></app-loader>
}

<!-- File Upload -->
@if (uploadInProgress()) {
  <app-loader [loadingText]="'Uploading file...'"></app-loader>
}

<!-- Form Submission -->
@if (submitting()) {
  <app-loader [loadingText]="'Saving changes...'"></app-loader>
}
```

### Modal Loading
```html
<div class="modal-content">
  @if (modalLoading()) {
    <div class="loading-container">
      <app-loader [loadingText]="'Loading user profile...'"></app-loader>
    </div>
  } @else {
    <div class="user-profile">
      <!-- Profile content -->
    </div>
  }
</div>
```

### Page Level Loading
```html
<!-- Full page loading -->
<div class="page-container">
  @if (pageLoading()) {
    <div class="page-loader">
      <app-loader [loadingText]="'Initializing application...'"></app-loader>
    </div>
  } @else {
    <router-outlet></router-outlet>
  }
</div>

<style>
.page-loader {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  z-index: 9999;
}
</style>
```

### Dynamic Loading Messages
```typescript
export class DataComponent {
  isLoading = signal(false);
  loadingMessage = signal<string | null>(null);

  async performMultiStepOperation() {
    this.isLoading.set(true);

    try {
      this.loadingMessage.set('Validating data...');
      await this.validateData();

      this.loadingMessage.set('Processing request...');
      await this.processData();

      this.loadingMessage.set('Saving results...');
      await this.saveResults();

      this.loadingMessage.set('Finalizing...');
      await this.cleanup();
    } finally {
      this.isLoading.set(false);
      this.loadingMessage.set(null);
    }
  }
}
```

```html
@if (isLoading()) {
  <app-loader [loadingText]="loadingMessage()"></app-loader>
}
```

### Table Loading
```html
<!-- Within data tables -->
<div class="table-container">
  @if (tableLoading()) {
    <div class="table-loading">
      <app-loader [loadingText]="'Loading records...'"></app-loader>
    </div>
  } @else {
    <table class="data-table">
      <!-- Table content -->
    </table>
  }
</div>
```

## 🎯 Best Practices

### 1. Meaningful Loading Messages
```html
<!-- Good: Specific and informative -->
<app-loader [loadingText]="'Uploading profile image...'"></app-loader>

<!-- Avoid: Generic messages -->
<app-loader [loadingText]="'Please wait...'"></app-loader>
```

### 2. Consistent Styling
```scss
// Define loader styles in your theme
:root {
  --loader-color: #3b82f6;
  --loader-text-color: #6b7280;
}

.loader {
  border-color: var(--loader-color);
}

.loading-text {
  color: var(--loader-text-color);
}
```

### 3. Accessibility Considerations
```html
<!-- Add ARIA labels for screen readers -->
<div class="loading-container" role="status" aria-live="polite">
  <app-loader [loadingText]="'Loading content'"></app-loader>
  <span class="sr-only">Loading, please wait...</span>
</div>
```

### 4. Prevent User Interaction During Loading
```scss
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
  z-index: 10;
}
```

## 🔧 Advanced Usage

### Service Integration
```typescript
@Injectable()
export class LoadingService {
  private loadingSubject = new BehaviorSubject(false);
  private messageSubject = new BehaviorSubject<string | null>(null);

  loading$ = this.loadingSubject.asObservable();
  message$ = this.messageSubject.asObservable();

  show(message?: string) {
    this.messageSubject.next(message || null);
    this.loadingSubject.next(true);
  }

  hide() {
    this.loadingSubject.next(false);
    this.messageSubject.next(null);
  }
}

// In component
export class AppComponent {
  loading$ = this.loadingService.loading$;
  message$ = this.loadingService.message$;

  constructor(private loadingService: LoadingService) {}
}
```

```html
@if (loading$ | async) {
  <app-loader [loadingText]="message$ | async"></app-loader>
}
```

### HTTP Interceptor Integration
```typescript
@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  constructor(private loadingService: LoadingService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.loadingService.show('Loading...');

    return next.handle(request).pipe(
      finalize(() => this.loadingService.hide())
    );
  }
}
```

## 📱 Responsive Design

```scss
// Mobile adjustments
@media (max-width: 768px) {
  .loader {
    width: 32px;
    height: 32px;
  }

  .loading-text {
    font-size: 14px;
  }
}

// Touch-friendly spacing
.loading-container {
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1.5rem;
  }
}
```

## 🧪 Testing

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Loader } from './loader';

describe('Loader', () => {
  let component: Loader;
  let fixture: ComponentFixture<Loader>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [Loader]
    });
    fixture = TestBed.createComponent(Loader);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display loading text when provided', () => {
    fixture.componentRef.setInput('loadingText', 'Loading data...');
    fixture.detectChanges();

    const textElement = fixture.nativeElement.querySelector('.loading-text');
    expect(textElement.textContent).toBe('Loading data...');
  });

  it('should not display loading text when null', () => {
    fixture.componentRef.setInput('loadingText', null);
    fixture.detectChanges();

    const textElement = fixture.nativeElement.querySelector('.loading-text');
    expect(textElement).toBeFalsy();
  });

  it('should have spinning animation', () => {
    fixture.detectChanges();

    const loaderElement = fixture.nativeElement.querySelector('.loader');
    const computedStyle = getComputedStyle(loaderElement);
    expect(computedStyle.animation).toContain('spin89345');
  });
});
```

## 🔄 Performance Tips

1. **Use CSS Transforms** - The component uses efficient CSS transforms for animation
2. **Avoid Excessive Re-renders** - Use signals to minimize unnecessary updates
3. **Conditional Rendering** - Only render when actually loading
4. **Memory Management** - Clean up loading states properly

## 🌙 Dark Mode Support

```scss
[data-theme='dark'] {
  .loader {
    border-color: var(--text-color-dark, #f8fafc);
  }

  .loading-text {
    color: var(--text-color-dark, #f8fafc);
  }
}
```

## 📄 Related Components

- [`ReusableDataTable`](./reusable-data-table.readme.md) - Uses loader for table loading states
- [`FormField`](./form-field.readme.md) - Can be used with form submission loading
- [`Button`](./button.readme.md) - Can show loading state on buttons

## 📝 Notes

- **Animation Name**: The animation uses a unique name `spin89345` to avoid conflicts
- **CSS Variables**: Ensure `--text-color` is defined in your global styles
- **Container Class**: Note the container class name has an extra space (`.container-fluid`) in the template