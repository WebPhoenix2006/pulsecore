import { Component, input } from '@angular/core';

@Component({
  selector: 'cus-h1',
  standalone: false,
  templateUrl: './special-h1.html',
  styleUrl: './special-h1.scss',
})
export class SpecialH1 {
  // input for the component
  text = input.required<string>();
}
