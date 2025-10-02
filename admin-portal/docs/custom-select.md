# Custom Select Component

A flexible, customizable dropdown select component with search functionality and form integration.

## Features

- ✅ Fully reactive forms compatible (implements `ControlValueAccessor`)
- ✅ Search/filter functionality
- ✅ Clearable selections
- ✅ Option count display
- ✅ Keyboard navigation support
- ✅ Custom styling with CSS variables
- ✅ Metadata support for additional data
- ✅ Disabled state support
- ✅ Loading states and empty states

## Installation

The component is located in `src/app/shared/components/custom-select/`.

Import it in your module:

```typescript
import { CustomSelectComponent } from '../shared/components/custom-select/custom-select.component';

@NgModule({
  imports: [
    // ... other imports
    CustomSelectComponent,
  ],
})
export class YourModule {}
```

## Basic Usage

### 1. Define Options

```typescript
import { SelectOption } from '../shared/components/custom-select/custom-select.component';

export class YourComponent {
  options: SelectOption[] = [
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' },
    { value: '3', label: 'Option 3' },
  ];
}
```

### 2. Use in Template

```html
<app-custom-select
  [options]="options"
  placeholder="Select an option"
  [(ngModel)]="selectedValue">
</app-custom-select>
```

## With Reactive Forms

```typescript
export class YourComponent {
  form = this.fb.group({
    country: ['', Validators.required]
  });

  countryOptions: SelectOption[] = [
    { value: 'ng', label: 'Nigeria' },
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
  ];
}
```

```html
<form [formGroup]="form">
  <app-custom-select
    [options]="countryOptions"
    placeholder="Select country"
    formControlName="country">
  </app-custom-select>
</form>
```

## Advanced Usage

### With Search and Clear

```html
<app-custom-select
  [options]="productOptions"
  placeholder="Search products..."
  [searchable]="true"
  [clearable]="true"
  formControlName="productId">
</app-custom-select>
```

### With Metadata

Use metadata to pass additional information with each option:

```typescript
interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

productOptions: SelectOption[] = this.products.map(product => ({
  value: product.id,
  label: `${product.name} - $${product.price} (${product.stock} in stock)`,
  metadata: product // Entire product object
}));
```

```html
<app-custom-select
  [options]="productOptions"
  formControlName="productId"
  (selectionChange)="onProductChange($event)">
</app-custom-select>
```

```typescript
onProductChange(option: SelectOption | null) {
  if (option?.metadata) {
    const product = option.metadata as Product;
    console.log('Selected product:', product);
    // Access full product data: product.price, product.stock, etc.
  }
}
```

### With Option Count Display

```html
<app-custom-select
  [options]="options"
  placeholder="Select an option"
  [showCount]="true"
  formControlName="selection">
</app-custom-select>
```

This will show: "Select an option (5 available)" if there are 5 options.

### Disabled Options

```typescript
options: SelectOption[] = [
  { value: '1', label: 'Available Option' },
  { value: '2', label: 'Disabled Option', disabled: true },
  { value: '3', label: 'Another Available' },
];
```

### Disabled Component

```html
<app-custom-select
  [options]="options"
  [disabled]="true"
  formControlName="field">
</app-custom-select>
```

Or with reactive forms:

```typescript
this.form.get('field')?.disable();
```

## API Reference

### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `options` | `SelectOption[]` | `[]` | Array of options to display |
| `placeholder` | `string` | `'Select an option'` | Placeholder text |
| `disabled` | `boolean` | `false` | Whether the select is disabled |
| `searchable` | `boolean` | `false` | Enable search/filter functionality |
| `clearable` | `boolean` | `false` | Show clear button when value is selected |
| `showCount` | `boolean` | `false` | Show option count in placeholder |

### Outputs

| Output | Type | Description |
|--------|------|-------------|
| `selectionChange` | `EventEmitter<SelectOption \| null>` | Emits when selection changes, includes full option with metadata |

### SelectOption Interface

```typescript
interface SelectOption {
  value: any;           // The value to be stored in form control
  label: string;        // Display text for the option
  disabled?: boolean;   // Optional: disable this option
  metadata?: any;       // Optional: additional data to pass with option
}
```

## Styling

The component uses CSS variables for easy customization. Override these in your global styles or component styles:

```scss
app-custom-select {
  --background-primary: #ffffff;
  --background-secondary: #f5f5f5;
  --border-color: #ddd;
  --text-primary: #333;
  --text-secondary: #999;
  --primary-color: #007bff;
  --primary-light: rgba(0, 123, 255, 0.1);
}
```

## Examples

### Product Selection with Price and Stock

```typescript
export class OrderComponent {
  products = signal<Product[]>([]);

  productOptions = computed<SelectOption[]>(() => {
    return this.products().map(product => ({
      value: product.id,
      label: `${product.name} - ${this.formatCurrency(product.price)} (${product.stock_quantity} available)`,
      metadata: product,
      disabled: product.stock_quantity === 0
    }));
  });

  onProductSelect(option: SelectOption | null) {
    if (option?.metadata) {
      const product = option.metadata as Product;
      // Update form with product details
      this.form.patchValue({
        unitPrice: product.price,
        maxQuantity: product.stock_quantity
      });
    }
  }
}
```

```html
<app-custom-select
  [options]="productOptions()"
  placeholder="Select product"
  [searchable]="true"
  [showCount]="true"
  formControlName="productId"
  (selectionChange)="onProductSelect($event)">
</app-custom-select>
```

### Customer Selection with Auto-fill

```typescript
export class OrderComponent {
  customers = signal<Customer[]>([]);

  customerOptions = computed<SelectOption[]>(() => {
    return this.customers().map(customer => ({
      value: customer.id,
      label: `${customer.name} - ${customer.email}`,
      metadata: customer
    }));
  });

  onCustomerSelect(option: SelectOption | null) {
    if (option?.metadata) {
      const customer = option.metadata as Customer;
      // Auto-fill customer information
      this.form.patchValue({
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone
      });
    }
  }
}
```

```html
<app-custom-select
  [options]="customerOptions()"
  placeholder="Select customer"
  [searchable]="true"
  [clearable]="true"
  formControlName="customerId"
  (selectionChange)="onCustomerSelect($event)">
</app-custom-select>
```

## Best Practices

1. **Use Signals for Dynamic Options**: When options depend on data that changes, use Angular signals with `computed()` to create reactive option arrays.

2. **Add Metadata for Complex Objects**: Instead of just storing IDs, use metadata to access full object data without additional lookups.

3. **Enable Search for Long Lists**: For lists with more than 10 options, enable the `searchable` feature.

4. **Show Counts for Inventory**: Use `showCount` when displaying items with limited availability.

5. **Disable Out-of-Stock Items**: Set `disabled: true` for options that shouldn't be selectable (e.g., out-of-stock products).

6. **Use selectionChange for Side Effects**: Listen to `selectionChange` instead of form value changes when you need to access the full option object and metadata.

## Accessibility

The component includes:
- Keyboard navigation (Tab, Enter, Arrow keys)
- Focus states
- ARIA attributes (coming soon)
- Screen reader support (coming soon)

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Troubleshooting

### Options not showing

Make sure you're passing an array of `SelectOption` objects with `value` and `label` properties:

```typescript
// ✅ Correct
options: SelectOption[] = [
  { value: '1', label: 'Option 1' }
];

// ❌ Wrong
options = [
  { id: '1', name: 'Option 1' } // Wrong property names
];
```

### Form control not updating

Ensure the component is properly registered with form control:

```html
<!-- With ngModel -->
<app-custom-select [(ngModel)]="value"></app-custom-select>

<!-- With reactive forms -->
<app-custom-select formControlName="fieldName"></app-custom-select>
```

### Dropdown not closing

The dropdown automatically closes when clicking outside. If it's not working, check for:
- CSS z-index conflicts
- Event propagation stoppage in parent components

## License

Internal use only - PulseCore Admin Portal
