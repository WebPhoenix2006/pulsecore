# 🎨 SvgIcons Component

A placeholder component for SVG icon management and display. Currently in development state, designed to provide a centralized way to manage and display SVG icons throughout the application.

## ✨ Current Status

⚠️ **Development Component** - This component is currently in its initial state and displays a placeholder message "svg-icons works!"

## 🔮 Intended Features

Based on the component structure, this component is designed to provide:

- **Centralized Icon Management** - Single place to manage all SVG icons
- **Dynamic Icon Loading** - Load icons dynamically based on name/type
- **Icon Library** - Comprehensive icon library for the application
- **Customizable Styling** - Theming and sizing options
- **Performance Optimized** - Efficient icon loading and caching

## 🚀 Current Structure

### Component Declaration
```typescript
import { SvgIcons } from './shared/components/svg-icons/svg-icons';

@NgModule({
  declarations: [
    SvgIcons,
    // ... other components
  ]
})
export class SharedModule {}
```

### Component Definition
```typescript
@Component({
  selector: 'app-svg-icons',
  standalone: false,
  templateUrl: './svg-icons.html',
  styleUrl: './svg-icons.scss'
})
export class SvgIcons {
  // Component logic to be implemented
}
```

## 📦 Future Usage (Planned)

### Expected API Design
```typescript
// Planned component interface
export class SvgIcons {
  // Icon identification
  name = input.required<string>();

  // Styling options
  size = input<string>('24px');
  color = input<string>('currentColor');

  // Additional properties
  customClass = input<string>('');
  ariaLabel = input<string>('');
}
```

### Anticipated Template Usage
```html
<!-- Basic icon -->
<app-svg-icons [name]="'user'"></app-svg-icons>

<!-- Styled icon -->
<app-svg-icons
  [name]="'settings'"
  [size]="'32px'"
  [color]="'#3b82f6'"
  [customClass]="'icon-button'">
</app-svg-icons>

<!-- With accessibility -->
<app-svg-icons
  [name]="'delete'"
  [ariaLabel]="'Delete item'">
</app-svg-icons>
```

## 🎯 Recommended Implementation Approach

### 1. Icon Registry Service
```typescript
@Injectable({
  providedIn: 'root'
})
export class IconRegistryService {
  private icons = new Map<string, string>();

  registerIcon(name: string, svgContent: string) {
    this.icons.set(name, svgContent);
  }

  getIcon(name: string): string | undefined {
    return this.icons.get(name);
  }

  // Pre-register common icons
  constructor() {
    this.registerCommonIcons();
  }

  private registerCommonIcons() {
    this.registerIcon('user', '<svg>...</svg>');
    this.registerIcon('settings', '<svg>...</svg>');
    // ... more icons
  }
}
```

### 2. Enhanced Component
```typescript
@Component({
  selector: 'app-svg-icons',
  template: `
    <div
      class="svg-icon-container"
      [style.width]="size()"
      [style.height]="size()"
      [style.color]="color()"
      [class]="customClass()"
      [attr.aria-label]="ariaLabel()"
      [innerHTML]="iconContent()">
    </div>
  `,
  standalone: false
})
export class SvgIcons {
  name = input.required<string>();
  size = input<string>('24px');
  color = input<string>('currentColor');
  customClass = input<string>('');
  ariaLabel = input<string>('');

  iconContent = computed(() => {
    return this.iconRegistry.getIcon(this.name()) || '';
  });

  constructor(private iconRegistry: IconRegistryService) {}
}
```

### 3. Icon Library Integration
```typescript
// icons.config.ts
export const ICON_LIBRARY = {
  // Navigation icons
  'home': '<svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>',
  'menu': '<svg viewBox="0 0 24 24"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>',

  // Action icons
  'edit': '<svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"/></svg>',
  'delete': '<svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12z"/></svg>',

  // Status icons
  'success': '<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>',
  'error': '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
};
```

## 🎨 Styling Recommendations

### CSS Structure
```scss
.svg-icon-container {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 100%;
    height: 100%;
    fill: currentColor;
    transition: all 0.2s ease;
  }

  // Size variants
  &.small {
    width: 16px;
    height: 16px;
  }

  &.medium {
    width: 24px;
    height: 24px;
  }

  &.large {
    width: 32px;
    height: 32px;
  }

  // Interactive states
  &.clickable {
    cursor: pointer;

    &:hover svg {
      transform: scale(1.1);
    }
  }

  // Color themes
  &.primary {
    color: var(--primary-color);
  }

  &.secondary {
    color: var(--secondary-color);
  }

  &.danger {
    color: var(--error-color);
  }
}
```

## 🔧 Integration Examples

### With Buttons
```html
<cus-btn>
  <app-svg-icons [name]="'save'" [size]="'18px'"></app-svg-icons>
  Save Changes
</cus-btn>
```

### With Menu Items
```html
<nav class="sidebar">
  <a href="/dashboard" class="nav-link">
    <app-svg-icons [name]="'dashboard'"></app-svg-icons>
    <span>Dashboard</span>
  </a>
  <a href="/users" class="nav-link">
    <app-svg-icons [name]="'users'"></app-svg-icons>
    <span>Users</span>
  </a>
</nav>
```

### With Status Indicators
```html
<div class="status-indicator">
  <app-svg-icons
    [name]="getStatusIcon(item.status)"
    [color]="getStatusColor(item.status)">
  </app-svg-icons>
  <span>{{ item.status }}</span>
</div>
```

## 🎯 Best Practices for Implementation

### 1. Icon Naming Convention
```typescript
// Use descriptive, consistent names
const ICON_NAMES = {
  // Actions
  'add', 'edit', 'delete', 'save', 'cancel', 'submit',

  // Navigation
  'home', 'back', 'forward', 'menu', 'close',

  // Status
  'success', 'error', 'warning', 'info', 'loading',

  // Objects
  'user', 'file', 'folder', 'image', 'document'
};
```

### 2. Accessibility
```html
<!-- Always provide meaningful labels -->
<app-svg-icons
  [name]="'delete'"
  [ariaLabel]="'Delete user account'">
</app-svg-icons>

<!-- For decorative icons -->
<app-svg-icons
  [name]="'decoration'"
  [ariaLabel]="''"
  role="presentation">
</app-svg-icons>
```

### 3. Performance Optimization
```typescript
// Lazy load icons
const lazyLoadIcon = (name: string) => {
  return import(`../assets/icons/${name}.svg`).then(icon => icon.default);
};

// Cache frequently used icons
const iconCache = new Map<string, string>();
```

## 🔄 Migration Path

When implementing the full functionality:

1. **Phase 1**: Create icon registry service
2. **Phase 2**: Update component with inputs and rendering logic
3. **Phase 3**: Add icon library and common icons
4. **Phase 4**: Integrate throughout the application
5. **Phase 5**: Add advanced features (themes, animations, etc.)

## 📚 Related Components

- [`Button`](./button.readme.md) - Can integrate icons within buttons
- [`SpecialH1`](./special-h1.readme.md) - Can use icons for decorative elements
- [`ReusableDataTable`](./reusable-data-table.readme.md) - Can use icons for actions

## 📝 Development Notes

- Currently displays placeholder content
- Component shell is ready for implementation
- Follow Angular best practices for icon management
- Consider using Angular Material's icon approach as reference
- Ensure SVG optimization for performance

## 🎨 Icon Resources

For implementation, consider these icon libraries:
- **Heroicons** - Clean, modern SVG icons
- **Feather Icons** - Minimalist icon set
- **Lucide Icons** - Beautiful & consistent icons
- **Phosphor Icons** - Flexible icon family
- **Custom Icons** - Brand-specific iconography

## 📄 License

This component is part of the PulseCore project and follows the project's licensing terms.