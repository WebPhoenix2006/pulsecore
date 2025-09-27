import { Component, EventEmitter, Input, Output, HostListener, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-dropdown',
  standalone: false,
  templateUrl: './dropdown.html',
  styleUrl: './dropdown.scss',
})
export class Dropdown implements AfterViewInit, OnDestroy {
  @Input() options: {
    label: string;
    value: any;
    icon: string;
    iconPosition: string;
    action?: () => void;
  }[] = [];
  @Input() ellipsis: boolean = false;
  @Input() placeholder: string = '';

  @Output() selected = new EventEmitter<any>();

  isOpen = false;
  dropdownPosition: { top: number; left: number; right?: number } = { top: 0, left: 0 };

  constructor(private elementRef: ElementRef) {}

  ngAfterViewInit() {
    // Ensure proper positioning after view initialization
    this.calculatePosition();
  }

  ngOnDestroy() {
    // Clean up any document event listeners if needed
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    // Close dropdown when clicking outside
    const target = event.target as Node;
    if (!this.elementRef.nativeElement.contains(target)) {
      this.isOpen = false;
    }
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    // Close dropdown on scroll instead of repositioning to avoid hover issues
    if (this.isOpen) {
      this.isOpen = false;
    }
  }

  @HostListener('window:resize')
  onWindowResize() {
    // Close dropdown on resize to avoid positioning issues
    if (this.isOpen) {
      this.isOpen = false;
    }
  }

  toggleDropdown(event?: Event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    // Always calculate position before toggling to ensure it's ready
    this.calculatePosition();
    this.isOpen = !this.isOpen;

    if (this.isOpen) {
      // Recalculate position after the DOM update
      setTimeout(() => this.calculatePosition(), 10);
    }
  }

  selectOption(option: any, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    this.selected.emit(option);
    if (option.action && typeof option.action === 'function') {
      option.action();
    }
    this.isOpen = false;
  }

  closeDropdown() {
    this.isOpen = false;
  }

  private calculatePosition() {
    const dropdownElement = this.elementRef.nativeElement.querySelector('.dropdown');

    if (!dropdownElement) {
      // Set default position if element not found
      this.dropdownPosition = { top: 0, left: 0 };
      return;
    }

    const rect = dropdownElement.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    // Use fixed dimensions instead of getBoundingClientRect to avoid layout shifts
    const menuWidth = 200; // Fixed width from CSS
    const menuHeight = Math.min(300, this.options.length * 50 + 20); // Estimate height, max 300px

    // Calculate top position
    let top = rect.bottom + 8; // 8px gap

    // Check if dropdown would overflow bottom of viewport
    if (top + menuHeight > viewport.height - 20) {
      // Position above the trigger instead
      top = rect.top - menuHeight - 8;

      // If still overflows at top, clamp to viewport
      if (top < 20) {
        top = 20;
      }
    }

    // Calculate horizontal position
    let left = rect.left;

    // For ellipsis dropdowns, align to the right edge
    if (this.ellipsis) {
      left = rect.right - menuWidth;
    }

    // Ensure dropdown doesn't overflow viewport horizontally
    if (left < 20) {
      left = 20;
    } else if (left + menuWidth > viewport.width - 20) {
      left = viewport.width - menuWidth - 20;
    }

    // Ensure values are within safe bounds to prevent overflow
    this.dropdownPosition = {
      top: Math.max(20, Math.min(top, viewport.height - menuHeight - 20)),
      left: Math.max(20, Math.min(left, viewport.width - menuWidth - 20))
    };
  }
}
