import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function fieldsMatchValidator(
  firstControlName: string,
  secondControlName: string,
  errorKey: string = 'fieldsMismatch'
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const firstValue = control.get(firstControlName)?.value;
    const secondValue = control.get(secondControlName)?.value;

    if (firstValue != null && secondValue != null && firstValue !== secondValue) {
      return { [errorKey]: true };
    }

    return null; // valid
  };
}
