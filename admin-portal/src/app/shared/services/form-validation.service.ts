import { Injectable } from '@angular/core';
import { AbstractControl } from '@angular/forms';

@Injectable({
  providedIn: 'root',
})
export class FormValidation {
  getErrorMessage(control: AbstractControl | null, fieldName: string): string {
    if (!control?.errors || !control.touched) {
      return '';
    }

    const errors = control.errors;

    // Required validation
    if (errors['required']) {
      return `${this.capitalizeFieldName(fieldName)} is required`;
    }

    // Minimum length validation
    if (errors['minlength']) {
      return `${this.capitalizeFieldName(fieldName)} must be at least ${
        errors['minlength'].requiredLength
      } characters`;
    }

    // Maximum length validation
    if (errors['maxlength']) {
      return `${this.capitalizeFieldName(fieldName)} cannot exceed ${
        errors['maxlength'].requiredLength
      } characters`;
    }

    // Email validation
    if (errors['email']) {
      return 'Please enter a valid email address';
    }

    // Pattern validation
    if (errors['pattern']) {
      return `${this.capitalizeFieldName(fieldName)} format is invalid`;
    }

    // Min value validation
    if (errors['min']) {
      return `${this.capitalizeFieldName(fieldName)} must be at least ${errors['min'].min}`;
    }

    // Max value validation
    if (errors['max']) {
      return `${this.capitalizeFieldName(fieldName)} cannot exceed ${errors['max'].max}`;
    }

    // Custom validation messages
    if (errors['passwordMismatch']) {
      return 'Passwords do not match';
    }

    // Default fallback
    return `${this.capitalizeFieldName(fieldName)} is invalid`;
  }

  private capitalizeFieldName(fieldName: string): string {
    // Convert camelCase to readable format
    // e.g., "firstName" becomes "First Name"
    return fieldName
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
      .trim();
  }
}
