import { Component, OnInit, signal, Renderer2, Inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SharedModule } from './shared/shared-module';
import { ToastService } from './shared/services/toast.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SharedModule, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  protected readonly title = signal('admin-portal');
  protected isDarkMode = signal(false);

  constructor(
    private toastService: ToastService,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {}

  showMessage() {
    this.toastService.success('Data saved successfully!');
    setTimeout(() => {
      this.toastService.error('Something went wrong...');
    }, 1000);
    setTimeout(() => {
      this.toastService.warning('Please check your input!');
    }, 2000);
    setTimeout(() => {
      this.toastService.info('Processing your request...');
    }, 3000);
  }

  toggleDarkMode() {
    this.isDarkMode.set(!this.isDarkMode());

    if (this.isDarkMode()) {
      this.renderer.setAttribute(this.document.documentElement, 'data-theme', 'dark');
    } else {
      this.renderer.removeAttribute(this.document.documentElement, 'data-theme');
    }
  }

  ngOnInit(): void {
    // Initialize theme from localStorage or system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);

    if (shouldBeDark) {
      this.isDarkMode.set(true);
      this.renderer.setAttribute(this.document.documentElement, 'data-theme', 'dark');
    }

    this.showMessage();
  }
}
