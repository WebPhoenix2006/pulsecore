import { Component, Input, OnInit, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-custom-scrollbar',
  standalone: true,
  templateUrl: './custom-scrollbar.component.html',
  styleUrl: './custom-scrollbar.component.scss'
})
export class CustomScrollbarComponent implements OnInit {
  @Input() maxHeight: string = '400px';
  @Input() showScrollbar: boolean = true;
  @Input() scrollbarWidth: string = '8px';
  @Input() thumbColor: string = 'var(--secondary-color)';
  @Input() trackColor: string = 'var(--surface-color)';
  @Input() borderRadius: string = '8px';

  @ViewChild('scrollContainer', { static: true }) scrollContainer!: ElementRef;

  constructor() {}

  ngOnInit(): void {}

  onScroll(event: Event): void {
    // Optional: Add scroll event handling if needed
  }
}