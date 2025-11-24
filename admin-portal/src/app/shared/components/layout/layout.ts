import { CommonModule } from '@angular/common';
import { Component, effect, HostListener, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { SharedModule } from '../../shared-module';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SharedModule],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class Layout {
  sidebarState = signal<boolean>(false);

  constructor() {
    // Initialize sidebar state based on screen size
    if (typeof window !== 'undefined') {
      this.sidebarState.set(window.innerWidth <= 768);
    }
  }

  // Handle window resize
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (event.target.innerWidth > 768) {
      this.sidebarState.set(false);
    } else {
      this.sidebarState.set(true);
    }
  }

  acceptState(state: boolean): void {
    this.sidebarState.set(state);
  }

  toggleMobileSidebar(): void {
    this.sidebarState.set(!this.sidebarState());
  }

  closeMobileSidebar(): void {
    if (window.innerWidth <= 768) {
      this.sidebarState.set(true);
    }
  }
}
