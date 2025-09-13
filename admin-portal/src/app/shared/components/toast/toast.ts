import { ToastInterface } from './../../services/toast.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ToastService } from '../../services/toast.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-toast',
  standalone: false,
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
})
export class Toast implements OnInit, OnDestroy {
  toasts: ToastInterface[] = [];
  private destroy$ = new Subject<void>();
  private removingToasts = new Set<number>();

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    // Register this component's remove handler with the service
    this.toastService.setRemoveHandler((id) => this.remove(id));

    this.toastService.toasts$.pipe(takeUntil(this.destroy$)).subscribe((ts) => (this.toasts = ts));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // This is called when progress bar animation completes
  onProgressComplete(id: number) {
    // Only auto-remove if not already being removed manually
    if (!this.removingToasts.has(id)) {
      this.remove(id);
    }
  }

  // This handles both manual clicks and programmatic removal
  remove(id: number) {
    // Prevent double-removal
    if (this.removingToasts.has(id)) {
      return;
    }

    // Add removing class for smooth exit animation
    this.removingToasts.add(id);

    // Wait for animation to complete before actually removing
    setTimeout(() => {
      this.toastService.forceRemove(id);
      this.removingToasts.delete(id);
    }, 300); // Match the slideOutRight animation duration
  }

  isRemoving(id: number): boolean {
    return this.removingToasts.has(id);
  }

  // Get the progress animation duration for each toast
  getProgressDuration(toast: ToastInterface): string {
    return `${toast.duration || 3000}ms`;
  }
}
