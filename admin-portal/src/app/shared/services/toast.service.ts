import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastInterface {
  text: string;
  type: ToastType;
  id: number;
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private getIcon(type: string): string {
    const icons: any = {
      success: '<i class="fa-solid fa-check-circle text-success"></i>',
      info: '<i class="fa-solid fa-circle-info text-primary"></i>',
      warning: '<i class="fa-solid fa-triangle-exclamation text-warning"></i>',
      danger: '<i class="fa-solid fa-circle-xmark text-danger"></i>',
      primary: '<i class="fa-solid fa-bell text-primary"></i>',
    };
    return icons[type] || icons['primary'];
  }

  private getProgressBarColor(type: string): string {
    const colors: any = {
      success: '#28a745',
      danger: '#dc3545',
      warning: '#ffc107',
      primary: '#0d6efd',
      info: '#0d6efd',
    };
    return colors[type] || colors['primary'];
  }

  showToast(
    message: string,
    type: 'primary' | 'success' | 'danger' | 'warning' | 'info' = 'primary',
    duration: number = 3000
  ) {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return null;

    const toastEl = document.createElement('div');
    // Start with hidden state - NO Bootstrap toast class initially
    toastEl.className = `custom-toast border-${type}`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');

    const progressBarColor = this.getProgressBarColor(type);

    toastEl.innerHTML = `
      <div class="toast-body d-flex align-items-start gap-2">
        <div class="toast-icon">${this.getIcon(type)}</div>
        <div class="flex-grow-1">
          <strong class="text-capitalize">${type}</strong>
          <div>${message}</div>
        </div>
        <button type="button" class="btn-close ms-2" aria-label="Close"></button>
      </div>
      <div class="toast-progress" style="color: ${progressBarColor}; animation-duration: ${duration}ms;"></div>
    `;

    // Add to container in hidden state
    toastContainer.appendChild(toastEl);

    // Handle close button click
    const closeBtn = toastEl.querySelector('.btn-close');
    closeBtn?.addEventListener('click', () => {
      this.hideToast(toastEl);
    });

    // Force reflow to ensure initial state is rendered
    toastEl.offsetHeight;

    // Trigger slide-in animation after a tiny delay
    setTimeout(() => {
      toastEl.classList.add('show');
    }, 10);

    // Auto-hide after duration
    const hideTimeout = setTimeout(() => {
      if (toastEl.parentNode && toastEl.classList.contains('show')) {
        this.hideToast(toastEl);
      }
    }, duration);

    // Store timeout ID so we can cancel it if manually closed
    (toastEl as any).hideTimeout = hideTimeout;

    // Clean up after hiding animation completes
    toastEl.addEventListener('transitionend', (e) => {
      if (e.propertyName === 'transform' && toastEl.classList.contains('hide')) {
        if ((toastEl as any).hideTimeout) {
          clearTimeout((toastEl as any).hideTimeout);
        }
        toastEl.remove();
      }
    });

    return toastEl;
  }

  private hideToast(toastEl: HTMLElement) {
    toastEl.classList.remove('show');
    toastEl.classList.add('hide');

    // Backup removal in case transition doesn't fire
    setTimeout(() => {
      if (toastEl.parentNode) {
        toastEl.remove();
      }
    }, 300);
  }

  // Convenience methods for different toast types
  showSuccess(message: string, duration?: number) {
    return this.showToast(message, 'success', duration);
  }

  showError(message: string, duration?: number) {
    return this.showToast(message, 'danger', duration);
  }

  showWarning(message: string, duration?: number) {
    return this.showToast(message, 'warning', duration);
  }

  showInfo(message: string, duration?: number) {
    return this.showToast(message, 'info', duration);
  }

  // Clear all toasts
  clearAll() {
    const toastContainer = document.getElementById('toast-container');
    if (toastContainer) {
      const toasts = toastContainer.querySelectorAll('.toast');
      toasts.forEach((toast) => {
        this.hideToast(toast as HTMLElement);
      });
    }
  }
}
