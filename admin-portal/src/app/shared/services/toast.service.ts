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
  private _toasts = new BehaviorSubject<ToastInterface[]>([]);
  toasts$ = this._toasts.asObservable();
  private counter = 0;

  // This will be called by the component to enable smooth animations
  private onToastRemove?: (id: number) => void;

  // Register the component's remove handler
  setRemoveHandler(handler: (id: number) => void) {
    this.onToastRemove = handler;
  }

  show(message: string, type: ToastType = 'info', duration = 3000) {
    const id = ++this.counter;
    const newToast: ToastInterface = { text: message, type, id, duration };
    this._toasts.next([...this._toasts.value, newToast]);

    // No timeout needed - the component will handle removal via animation events
  }

  success(message: string, duration?: number) {
    this.show(message, 'success', duration);
  }

  error(message: string, duration?: number) {
    this.show(message, 'error', duration);
  }

  info(message: string, duration?: number) {
    this.show(message, 'info', duration);
  }

  warning(message: string, duration?: number) {
    this.show(message, 'warning', duration);
  }

  // This is called by the component after animation completes
  forceRemove(id: number) {
    // Actually remove from the array
    this._toasts.next(this._toasts.value.filter((t) => t.id !== id));
  }

  // For manual removal (like clicking the X button)
  remove(id: number) {
    if (this.onToastRemove) {
      this.onToastRemove(id);
    } else {
      this.forceRemove(id);
    }
  }
}
