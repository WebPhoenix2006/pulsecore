import { Component, Input, Output, EventEmitter, forwardRef, signal, computed } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SelectOption {
  value: any;
  label: string;
  disabled?: boolean;
  metadata?: any; // Additional data to pass along
}

@Component({
  selector: 'app-custom-select',
  standalone: false,
  templateUrl: './custom-select.component.html',
  styleUrls: ['./custom-select.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomSelectComponent),
      multi: true
    }
  ]
})
export class CustomSelectComponent implements ControlValueAccessor {
  @Input() options: SelectOption[] = [];
  @Input() placeholder: string = 'Select an option';
  @Input() disabled: boolean = false;
  @Input() searchable: boolean = false;
  @Input() clearable: boolean = false;
  @Input() showCount: boolean = false;
  @Output() selectionChange = new EventEmitter<SelectOption | null>();

  value = signal<any>(null);
  isOpen = signal<boolean>(false);
  searchTerm = signal<string>('');
  isFocused = signal<boolean>(false);

  filteredOptions = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.options;
    return this.options.filter(opt =>
      opt.label.toLowerCase().includes(term)
    );
  });

  selectedOption = computed(() => {
    const val = this.value();
    return this.options.find(opt => opt.value === val) || null;
  });

  displayText = computed(() => {
    const selected = this.selectedOption();
    if (selected) return selected.label;
    if (this.showCount && this.options.length > 0) {
      return `${this.placeholder} (${this.options.length} available)`;
    }
    return this.placeholder;
  });

  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: any): void {
    this.value.set(value);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  toggleDropdown(): void {
    if (this.disabled) return;
    this.isOpen.set(!this.isOpen());
    if (this.isOpen()) {
      this.searchTerm.set('');
    }
  }

  selectOption(option: SelectOption): void {
    if (option.disabled) return;
    this.value.set(option.value);
    this.onChange(option.value);
    this.selectionChange.emit(option);
    this.isOpen.set(false);
    this.searchTerm.set('');
    this.onTouched();
  }

  clearSelection(event: Event): void {
    event.stopPropagation();
    this.value.set(null);
    this.onChange(null);
    this.selectionChange.emit(null);
    this.onTouched();
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  closeDropdown(): void {
    setTimeout(() => {
      if (!this.isFocused()) {
        this.isOpen.set(false);
        this.searchTerm.set('');
      }
    }, 200);
  }

  onFocus(): void {
    this.isFocused.set(true);
  }

  onBlur(): void {
    this.isFocused.set(false);
    this.closeDropdown();
  }
}
