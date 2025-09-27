import { Component, effect, signal } from '@angular/core';

@Component({
  selector: 'app-layout',
  standalone: false,
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
