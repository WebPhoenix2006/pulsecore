import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SlowNetworkService {
  private timeoutRef: any;

  constructor() {}

  start(callback: () => void, delay: number = 15000): void {
    this.clear(); // Prevent overlapping
    this.timeoutRef = setTimeout(callback, delay);
  }

  clear(): void {
    if (this.timeoutRef) {
      clearTimeout(this.timeoutRef);
      this.timeoutRef = null;
    }
  }
}
