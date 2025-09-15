Button Component (app-button)

A reusable, customizable button component for Angular 20 using signals. It supports different types, sizes, and an optional outlined style.

Features

Supports standard HTML button types: button and submit.

Adjustable text content via buttonText.

Size variants: small and large.

Optional outlined style with hover effects.

Disabled state handling.

Fully compatible with Angular 20 standalone components.

Easy to style via CSS classes and global styles.

Installation

Copy button.ts, button.html, and button.scss into your Angular project.

Import the component into your module (or use standalone import if your app supports it):

import { Button } from './components/button/button';

@Component({
standalone: true,
imports: [Button],
})
export class SomeComponent {}

Usage
<app-button
[type]="'submit'"
[buttonText]="'Save Changes'"
[size]="'large'"
[isOutlined]="true"
[disabled]="false"

> </app-button>

Inputs
Input Type Default Description
type `'button'	'submit'` 'button'
buttonText string 'Default text' Text displayed inside the button.
size `'small'	'large'	null`
isOutlined boolean false Applies outlined variant styling.
disabled boolean false Disables the button.
Styling

The button uses SCSS with the following class structure:

Base class: .btn-custom-primary

Size classes: .small, .large

Outline variant: .outline

Disabled state is automatically applied with reduced opacity.

Example SCSS snippet:

.btn-custom-primary {
display: inline-flex;
align-items: center;
justify-content: center;
border-radius: 8px;
padding: 10px 16px;
font-weight: 600;
cursor: pointer;
transition: all 0.2s ease-in-out;

&.small { padding: 6px 12px; font-size: 0.875rem; }
&.large { padding: 14px 24px; font-size: 1.125rem; }
&.outline { background: transparent; border: 2px solid var(--secondary-color); }
&:disabled { opacity: 0.6; cursor: not-allowed; }
}

Notes

The component uses Angular signals for input handling.

The [class] and [ngClass] bindings are used to dynamically apply size and outline styles.

Works with reactive forms or standard Angular templates.

Example with Reactive Forms

<form [formGroup]="form" (ngSubmit)="onSubmit()">
  <app-button
    type="submit"
    buttonText="Submit"
    size="large"
    [disabled]="!form.valid"
  ></app-button>
</form>
