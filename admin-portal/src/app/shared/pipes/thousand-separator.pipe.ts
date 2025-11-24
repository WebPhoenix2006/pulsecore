import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'thousandSep',
  standalone: true,
})
export class ThousandSeparatorPipe implements PipeTransform {
  transform(value: number | string | null | undefined, decimals = 0): string {
    if (value === null || value === undefined || value === '') return '';
    const num = Number(value);
    if (isNaN(num)) return String(value);
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  }
}
