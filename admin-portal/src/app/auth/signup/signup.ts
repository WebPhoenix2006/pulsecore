import { Component, HostListener, signal } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { FormFieldOption } from '../../interfaces/form-field-options';
import { FormValidation } from '../../shared/services/form-validation.service';

@Component({
  selector: 'app-signup',
  standalone: false,
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
})
export class Signup {
  form: FormGroup;
  screenInnerWidth = signal<number>(window.innerWidth);
  isScreenSmall = signal<boolean>(false);

  // method for listening to window resize
  @HostListener('window:resize')
  resize(): void {
    this.screenInnerWidth.set(window.innerWidth);
    this.isScreenSmall.set(this.screenInnerWidth() <= 500);
  }

  hobbyOptions: FormFieldOption[] = [
    { label: 'Coding', value: 'coding' },
    { label: 'Cooking', value: 'cooking' },
    { label: 'Gaming', value: 'gaming' },
    { label: 'Music', value: 'music' },
    { label: 'Sports', value: 'sports' },
  ];

  restaurantTypes: FormFieldOption[] = [
    { value: 'fast-food', label: 'Fast Food' },
    { value: 'casual', label: 'Casual Dining' },
    { value: 'fine-dining', label: 'Fine Dining' },
    { value: 'cafe', label: 'Cafe' },
    { value: 'bar', label: 'Bar & Grill' },
  ];

  constructor(private fb: FormBuilder, private validationService: FormValidation) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email, Validators.minLength(6)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false], // optional checkbox, no validators
      securityCode: [
        '',
        [Validators.minLength(4), Validators.maxLength(6)], // optional field, simple length validation
      ],
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
