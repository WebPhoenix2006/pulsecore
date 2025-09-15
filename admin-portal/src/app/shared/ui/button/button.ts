import { Component, input } from '@angular/core';

@Component({
  selector: 'cus-btn',
  standalone: false,
  templateUrl: './button.html',
  styleUrl: './button.scss',
})
export class Button {
  type = input<'button' | 'submit'>('button');
  buttonText = input<string | null>(null);
  size = input<'small' | 'large' | 'full' | ''>('');

  isOutlined = input<boolean>(false);
  disabled = input<boolean>(false);
}
