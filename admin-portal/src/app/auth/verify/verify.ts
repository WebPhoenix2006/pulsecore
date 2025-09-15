import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VerifyEmailService } from '../../shared/services/verify-email.service';
import { RegisterRequestInterface } from '../../interfaces/auth/register-request.interface';
import { ToastService } from '../../shared/services/toast.service';
import { AuthResponseInterface } from '../../interfaces/auth/register-response.interface';

@Component({
  selector: 'app-verify',
  standalone: false,
  templateUrl: './verify.html',
  styleUrl: './verify.scss',
})
export class Verify implements OnInit {
  emailValue = signal<string | null>('example@gmail.com');
  token = signal<string | null>(null);
  isLoading = signal<boolean>(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private verifyService: VerifyEmailService,
    private toastService: ToastService
  ) {}

  //  function for getting the email value
  getEmailValue(): void {
    const value = localStorage.getItem('email_value');
    this.emailValue.set(value);
  }

  // ng on init methods
  ngOnInit(): void {
    this.getEmailValue();
    this.route.queryParamMap.subscribe((params) => {
      this.token.set(params.get('token'));
      // console.log(this.token());
    });
  }

  verifyEmail(token: string | null): void {
    this.isLoading.set(true);
    this.verifyService.verifyEmail(token).subscribe({
      next: (data: AuthResponseInterface | null) => {
        this.isLoading.set(false);
        this.toastService.showSuccess('Email verified successfully', 2000);
        console.log(data);
        localStorage.setItem('token', data!.token);
        localStorage.setItem('refresh-token', data!.refresh);
      },

      error: (error) => {
        this.isLoading.set(false);
        this.toastService.showError(error.message || 'error verifying email pls try again later');
      },
    });
  }
}
