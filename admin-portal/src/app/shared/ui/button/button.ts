import { Component, input } from '@angular/core';

@Component({
  selector: 'cus-btn',
  standalone: false,
  templateUrl: './button.html',
  styleUrl: './button.scss',
})
export class Button {
  type = input<'button' | 'submit'>('button');
  buttonText = input<string>('Default text');
  size = input<'small' | 'large' | ''>('');

  isOutlined = input<boolean>(false);
  disabled = input<boolean>(false);
}
