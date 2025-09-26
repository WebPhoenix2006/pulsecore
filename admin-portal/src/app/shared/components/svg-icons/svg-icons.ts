import { Component, Input } from '@angular/core';

@Component({
  selector: 'svg-icons',
  standalone: false,
  templateUrl: './svg-icons.html',
  styleUrl: './svg-icons.scss',
})
export class SvgIcons {
  @Input() name: string = '';
}
