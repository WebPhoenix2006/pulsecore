import { Component, computed, effect, HostListener, OnInit, signal } from '@angular/core';
import { FormFieldOption } from '../../interfaces/form-field-options';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormValidation } from '../../shared/services/form-validation.service'; // Import the service
import { LoginService } from '../../services/login.service';
import { LoginRequestInterface } from '../../interfaces/auth/login.interface';
import { ToastService } from '../../shared/services/toast.service';
import { RegisterRequestInterface } from '../../interfaces/auth/register-request.interface';
import { SlowNetworkService } from '../../shared/services/slow-network.service';
import {
  AuthResponseInterface,
  RegisterResponseInterface,
} from '../../interfaces/auth/register-response.interface';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  form: FormGroup;
  screenInnerWidth = signal<number>(window.innerWidth);
  isScreenSmall = signal<boolean>(false);
  formValid = signal<boolean>(false);
  isLoading = signal<boolean>(false);

  isFormValid = computed(() => !this.formValid() || this.isLoading());

  ngOnInit(): void {
    this.form.statusChanges.subscribe(() => {
      this.formValid.set(this.form.valid);
    });
  }

  @HostListener('window:resize')
  resize(): void {
    this.screenInnerWidth.set(window.innerWidth);
    this.isScreenSmall.set(this.screenInnerWidth() <= 500);
  }

  constructor(
    private fb: FormBuilder,
    private validationService: FormValidation,
    private loginService: LoginService,
    private toastService: ToastService,
    private slowNetwork: SlowNetworkService,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email, Validators.minLength(6)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit() {
    this.isLoading.set(true);
    const data: LoginRequestInterface = this.form.value as LoginRequestInterface;
    this.slowNetwork.start(() => {
      if (this.isLoading()) {
        this.toastService.showWarning('hmm this is taking longer than usual');
      }
    });

    this.loginService.loginUser(data).subscribe({
      next: (data: AuthResponseInterface) => {
        this.toastService.showSuccess('Logged in successfully');
        this.authService.setAuth(data.access, data.refresh, data.tenant_id);
        this.isLoading.set(false);
        this.router.navigateByUrl('catalog');
      },
      error: (error) => {
        this.toastService.showError(error.message || 'Something went wrong. Please try again.');
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
