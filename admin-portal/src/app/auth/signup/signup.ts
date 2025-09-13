import { Component, HostListener, signal } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { FormFieldOption } from '../../interfaces/form-field-options';
import { FormValidation } from '../../shared/services/form-validation.service';
import { fieldsMatchValidator } from '../../validators/validator';
import { SignupService } from '../../services/signup';
import { RegisterRequestInterface } from '../../interfaces/auth/register-request.interface';

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
  isLoading = signal<boolean>(false);

  // method for listening to window resize
  @HostListener('window:resize')
  resize(): void {
    this.screenInnerWidth.set(window.innerWidth);
    this.isScreenSmall.set(this.screenInnerWidth() <= 500);
  }

  constructor(
    private fb: FormBuilder,
    private validationService: FormValidation,
    private signupService: SignupService
  ) {
    this.form = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email, Validators.minLength(6)]],
        username: ['', [Validators.required, Validators.minLength(3)]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirm_password: ['', [Validators.required, Validators.minLength(6)]],
        first_name: ['', [Validators.required]],
        last_name: ['', [Validators.required]],
        phone_number: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
        rememberMe: [false], // optional checkbox
      },
      {
        validators: fieldsMatchValidator('password', 'confirm_password', 'passwordMisMatch'),
      }
    );
  }

  onSubmit() {
    this.isLoading.set(true);
    const data: RegisterRequestInterface = this.form.value as RegisterRequestInterface;

    this.signupService.registerUser(data).subscribe({
      next: (value) => {
        console.log(value);
        this.isLoading.set(false);
      },

      error: (err) => {
        console.log(err.message || 'failed to fetch data');
        this.isLoading.set(false);
      },
    });
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
