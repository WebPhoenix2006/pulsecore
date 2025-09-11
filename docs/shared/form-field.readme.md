📑 FormField Component

A reusable Angular form field component that supports multiple input types, integrates with Angular forms via ControlValueAccessor, and handles validation, errors, and dynamic rendering.

✨ Features

Works with Angular Reactive Forms (FormControl)

Supports multiple field types: text, email, password, number, textarea, select, checkbox, date, tel, file, multiselect

Handles disabled, required, min/max/step, placeholder, and descriptions

Built-in error handling

Password visibility toggle

File upload (single or multiple)

Multi-select checkbox groups

🧩 Inputs (Properties)
Input Type Default Description
label string '' The label text displayed above/next to the field.
type 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'date' | 'tel' | 'file' | 'multiselect' 'text' Field type determines rendering and behavior.
placeholder string '' Placeholder text (if supported by field type).
options FormFieldOption[] [] Options for select and multiselect. { label: string, value: any }.
required boolean false Marks field as required.
disabled boolean false Disables field interaction.
description string '' Optional help/description text below the field.
min number | null null Minimum value (for number inputs).
max number | null null Maximum value (for number inputs).
step number | undefined undefined Step size (for number inputs).
minDate string undefined Minimum date (for date inputs).
maxDate string undefined Maximum date (for date inputs).
accept string undefined Accepted file types (for file inputs).
multiple boolean false Allow multiple files for file input.
rows number 4 Rows for textarea.
errorMessage string '' Custom error message displayed when validation fails.
🔄 Lifecycle

ngOnInit()
Subscribes to FormControl.valueChanges and updates the ControlValueAccessor state via onChange.

🛠️ Methods
Method Parameters Description
writeValue(value) any Sets the value programmatically (without emitting).
registerOnChange(fn) (value: any) => void Registers callback when value changes.
registerOnTouched(fn) () => void Registers callback when control is touched.
setDisabledState() isDisabled: boolean Enables/disables the field and FormControl.
onInput(event) event: InputEvent Handles standard input fields.
onBlur() — Marks field as touched.
onFileChange(event) event: Event Handles file uploads (single/multiple).
onCheckboxChange(ev) event: Event Handles checkbox toggling.
onSelectChange(ev) event: Event Handles dropdown select changes.
togglePassword() — Toggles password visibility (showPassword).
onMultiSelectChange() (optionValue: any, event: Event) Updates values for multiselect checkboxes.
isMultiSelectChecked() (optionValue: any): boolean Returns true if the option is currently selected.
🧮 Getters
Getter Type Description
isCheckbox boolean Returns true if field is a checkbox.
isMultiselect boolean Returns true if field is a multiselect.
isStandardField boolean Returns true if field is not checkbox/multiselect.
minValue number Returns min value (for numbers).
maxValue number Returns max value (for numbers).
stepValue number Returns step value (for numbers).
hasError boolean Returns true if field is invalid & touched.
📦 Usage Example

<!-- Standard text input -->

<app-form-field
label="Full Name"
type="text"
placeholder="Enter your name"
[required]="true"
[errorMessage]="'Name is required'"
[formControl]="nameControl">
</app-form-field>

<!-- Password input -->

<app-form-field
label="Password"
type="password"
placeholder="••••••••"
[required]="true"
[errorMessage]="'Password is required'"
[formControl]="passwordControl">
</app-form-field>

<!-- Select dropdown -->

<app-form-field
label="Country"
type="select"
[options]="countryOptions"
placeholder="Select your country"
[formControl]="countryControl">
</app-form-field>

<!-- Multi-select checkboxes -->

<app-form-field
label="Interests"
type="multiselect"
[options]="interestOptions"
[formControl]="interestsControl">
</app-form-field>

📋 Example Option Structure
export interface FormFieldOption {
label: string;
value: any;
disabled?: boolean;
}

🧭 Best Practices

Always pass a FormControl for reactive forms.

Use errorMessage for custom validation feedback.

For file inputs, handle upload/preview logic externally (this component only returns files).

Use multiselect when multiple checkboxes are needed.

Keep placeholder meaningful for better UX.
