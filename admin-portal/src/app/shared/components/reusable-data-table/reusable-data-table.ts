import { Component, input } from '@angular/core';

@Component({
  selector: 'app-reusable-data-table',
  standalone: false,
  templateUrl: './reusable-data-table.html',
  styleUrl: './reusable-data-table.scss',
})
export class ReusableDataTable {
  title = input.required<string>();
  text = input<string>('default text');
}
