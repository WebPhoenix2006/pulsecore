import { Component, computed, effect, HostListener, OnInit, signal } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { FormFieldOption } from '../../interfaces/form-field-options';
import { FormValidation } from '../../shared/services/form-validation.service';
import { fieldsMatchValidator } from '../../validators/validator';
import { SignupService } from '../../services/signup';
import { RegisterRequestInterface } from '../../interfaces/auth/register-request.interface';
import { ToastService } from '../../shared/services/toast.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  standalone: false,
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
})
export class Signup implements OnInit {
  form: FormGroup;
  screenInnerWidth = signal<number>(window.innerWidth);
  isScreenSmall = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  buttonText: string = 'Sign Up';

  // Add this property
  formValid = signal<boolean>(false);

  // Update your computed to use the signal
  isDisabled = computed(() => !this.formValid() || this.isLoading());

  // method for listening to window resize
  @HostListener('window:resize')
  resize(): void {
    this.screenInnerWidth.set(window.innerWidth);
    this.isScreenSmall.set(this.screenInnerWidth() <= 500);
  }

  ngOnInit(): void {
    this.form.statusChanges.subscribe(() => {
      // Update the signal whenever form status changes
      this.formValid.set(this.form.valid);

      console.log('Form status:', this.form.status);
      Object.keys(this.form.controls).forEach((key) => {
        const control = this.form.get(key);
        console.log(
          key,
          '=> value:',
          control?.value,
          'valid?',
          control?.valid,
          'errors:',
          control?.errors
        );
      });
    });
  }

  constructor(
    private fb: FormBuilder,
    private validationService: FormValidation,
    private signupService: SignupService,
    private toastService: ToastService,
    private router: Router
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
        // rememberMe: [false], // optional checkbox
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
        localStorage.setItem('email_value', this.form.get('email')?.value);
        this.toastService.show('request submitted pls verify your account');
        this.isLoading.set(false);
        this.router.navigate(['/auth/verify'], {
          queryParams: { token: value.verification_token },
        });
      },

      error: (err) => {
        console.log(err.message || 'failed to fetch data');
        this.toastService.show(
          err.error?.message || err.message || 'Something went wrong',
          'error',
          3000
        );

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
