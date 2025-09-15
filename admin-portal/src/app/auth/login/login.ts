import { Component, effect, HostListener, signal } from '@angular/core';
import { FormFieldOption } from '../../interfaces/form-field-options';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormValidation } from '../../shared/services/form-validation.service'; // Import the service

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  form: FormGroup;
  screenInnerWidth = signal<number>(window.innerWidth);
  isScreenSmall = signal<boolean>(false);

  get isBtnDisabled(): boolean {
    return this.form.valid;
  }

  @HostListener('window:resize')
  resize(): void {
    this.screenInnerWidth.set(window.innerWidth);
    this.isScreenSmall.set(this.screenInnerWidth() <= 500);
  }

  constructor(
    private fb: FormBuilder,
    private validationService: FormValidation // Inject the service
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email, Validators.minLength(6)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    effect(() => {
      console.log(`form is valid state  :`, this.isBtnDisabled);
    });
  }

  onSubmit() {
    if (this.form.valid) {
      console.log('Form Data:', this.form.value);
    } else {
      console.log('Form is invalid');
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.form.controls).forEach((key) => {
      const control = this.form.get(key);
      control?.markAsTouched();
    });
  }

  // Now this method just delegates to the service
  getErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);
    return this.validationService.getErrorMessage(control, fieldName);
  }
}
