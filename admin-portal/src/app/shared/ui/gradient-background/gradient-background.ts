import { Component, input } from '@angular/core';

@Component({
  selector: 'app-gradient-background',
  standalone: false,
  templateUrl: './gradient-background.html',
  styleUrl: './gradient-background.scss',
})
export class GradientBackground {
  title = input<string>('Default Title');
  body = input<string>(
    'Lorem ipsum dolor sit amet consectetur adipisicing elit. Neque odio modi amet quidem obcaecati hic corporis quaerat, repellat nihil unde.'
  );
}
