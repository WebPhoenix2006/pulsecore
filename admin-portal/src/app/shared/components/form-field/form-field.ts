import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FormFieldOption } from '../../../interfaces/form-field-options';

@Component({
  selector: 'app-form-field',
  standalone: false,
  templateUrl: './form-field.html',
  styleUrl: './form-field.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormField),
      multi: true,
    },
  ],
})
export class FormField implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() type:
    | 'text'
    | 'email'
    | 'password'
    | 'number'
    | 'textarea'
    | 'select'
    | 'checkbox'
    | 'date'
    | 'tel'
    | 'file'
    | 'multiselect' = 'text';
  @Input() placeholder: string = '';
  @Input() options: FormFieldOption[] = [];
  @Input() required: boolean = false;
  @Input() description: string = '';
  @Input() min: number | null = null;
  @Input() max: number | null = null;
  @Input() step?: number;
  @Input() minDate?: string;
  @Input() maxDate?: string;
  @Input() accept?: string;
  @Input() multiple?: boolean = false;
  @Input() rows?: number = 4;
  @Input() errorMessage: string = '';

  fieldId = `field_${Math.random().toString(36).substring(2, 11)}`;
  showPassword = false;

  // Internal value managed by CVA
  value: any = '';
  disabled = false;

  private onChange = (value: any) => {};
  private onTouched = () => {};

  // ---- ControlValueAccessor Methods ----
  writeValue(value: any): void {
    this.value = value ?? '';
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

  // ---- Helpers ----
  get isCheckbox(): boolean {
    return this.type === 'checkbox';
  }

  get isMultiselect(): boolean {
    return this.type === 'multiselect';
  }

  get isStandardField(): boolean {
    return !this.isCheckbox && !this.isMultiselect;
  }

  get minValue(): number | null {
    return this.min;
  }

  get maxValue(): number | null {
    return this.max;
  }

  get stepValue(): number | undefined {
    return this.step;
  }

  get hasError(): boolean {
    // Parent form handles validation. This just exposes if an errorMessage was passed in.
    return !!this.errorMessage;
  }

  // ---- Event Handlers ----
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.value = input.value;
    this.onChange(this.value);
  }

  onBlur(): void {
    this.onTouched();
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (!files || files.length === 0) {
      this.value = null;
    } else if (this.multiple) {
      this.value = Array.from(files);
    } else {
      this.value = files[0];
    }

    this.onChange(this.value);
  }

  onCheckboxChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.value = input.checked;
    this.onChange(this.value);
  }

  onSelectChange(event: Event): void {
    const input = event.target as HTMLSelectElement;
    this.value = input.value;
    this.onChange(this.value);
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onMultiSelectChange(optionValue: any, event: Event): void {
    const input = event.target as HTMLInputElement;
    const currentValues: any[] = Array.isArray(this.value) ? this.value : [];

    if (input.checked) {
      this.value = [...currentValues, optionValue];
    } else {
      this.value = currentValues.filter((val) => val !== optionValue);
    }

    this.onChange(this.value);
  }

  isMultiSelectChecked(optionValue: any): boolean {
    return Array.isArray(this.value) && this.value.includes(optionValue);
  }
}
