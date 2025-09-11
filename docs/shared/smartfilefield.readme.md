📂 SmartFileField Component

A reusable Angular form field component for handling file uploads with support for image previews, document info display, drag-and-drop upload, validation (file size, type), and full integration with Angular forms (ControlValueAccessor).

✨ Features

Supports images (image/\*) and documents (pdf, doc, etc.).

Live preview for images.

File details (name + size) for documents.

Drag & drop file upload.

Customizable:

label, description, required, accept, maxSize.

Shows error messages and required indicators.

Integrates with Reactive Forms or ngModel.

Change, remove, re-upload files easily.

Accessibility support (for, id, focus/blur handlers).

📦 Installation

Make sure Angular Forms is installed in your project:

npm install @angular/forms

Declare SmartFileField inside your declarations array (since it’s not standalone):

@NgModule({
declarations: [SmartFileField],
imports: [ReactiveFormsModule, FormsModule],
})
export class SharedModule {}

Import SharedModule wherever you want to use it.

🚀 Usage
Basic Example

<form [formGroup]="form">
  <app-smart-file-field
    label="Upload Profile Picture"
    formControlName="profileImage"
    accept="image/*"
    [required]="true"
    description="Upload a clear JPG or PNG (max 5MB)"
    [maxSize]="5 * 1024 * 1024"
  ></app-smart-file-field>
</form>

form = new FormGroup({
profileImage: new FormControl(null),
});

Using with ngModel
<app-smart-file-field
[(ngModel)]="resumeFile"
label="Upload Resume"
accept=".pdf,.doc,.docx"
description="Only PDF or Word documents allowed"

> </app-smart-file-field>

resumeFile: File | null = null;

⚙️ Inputs
Input Type Default Description
label string '' Field label.
required boolean false Marks the field as required (adds _).
disabled boolean false Disables the input.
description string '' Helper text shown under the field.
accept string '_/_' Accepted file types (e.g. image/_, .pdf).
errorMessage string '' Custom error message to show on validation failure.
maxSize number 10 _ 1024 _ 1024 Max file size in bytes (default = 10MB).
🖼️ UI States
Image Upload

Displays a preview of the selected image.

Allows change or remove actions.

Document Upload

Shows file name and size with 📄 icon.

Allows replace or remove actions.

Empty State

Shows drag & drop area with file type hint.

Includes Choose File button.

🛠️ Methods & Internals
Method Purpose
writeValue(value) Sync external form values with component.
registerOnChange(fn) Registers form control change handler.
registerOnTouched(fn) Registers form control touched handler.
setDisabledState(isDisabled) Enables/disables input.
onFileChange(event) Handles file selection from <input>.
onDrop(event) Handles drag-and-drop upload.
removeFile() Clears file + resets preview.
getAcceptHint() Returns a human-readable hint (e.g., "Images only").
formatFileSize(bytes) Converts file size into KB/MB/GB string.
🧪 Validation

Rejects files larger than maxSize.

Emits an error message via errorMessage.

Exposes hasError getter → use in template to style invalid states.

🎨 Styling

Uses BEM-like class structure (.form-field-container, .image-preview, .document-preview).

Error states use .has-error.

Disabled state uses .disabled.

Supports high-contrast and reduced-motion media queries.

📋 Accessibility

Labels use for and id.

Hidden file input is fully keyboard accessible.

Drag-and-drop fallback ensures usability across devices.

📌 Example Preview

Image upload mode → Shows preview thumbnail.

Document upload mode → Shows 📄 + name + size.

No file → Drag and drop + hint text.
