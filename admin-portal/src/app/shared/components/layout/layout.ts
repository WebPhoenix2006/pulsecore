import { CommonModule } from '@angular/common';
import { Component, effect, signal } from '@angular/core';
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

  constructor() {}

  acceptState(state: boolean): void {
    this.sidebarState.set(state);
  }
}
