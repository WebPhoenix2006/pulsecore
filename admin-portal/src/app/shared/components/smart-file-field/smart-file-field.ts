// smart-file-field.component.ts

import { Component, Input, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormControl } from '@angular/forms';

type FilePreviewType = 'image' | 'document' | 'none';

@Component({
  selector: 'app-smart-file-field',
  standalone: false,
  templateUrl: './smart-file-field.html',
  styleUrl: './smart-file-field.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SmartFileField),
      multi: true,
    },
  ],
})
export class SmartFileField implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() description: string = '';
  @Input() accept: string = '*/*';
  @Input() errorMessage: string = '';
  @Input() maxSize: number = 10 * 1024 * 1024; // 10MB default
  @Input() fileUploadClass?: string = '';

  // Independent state for each instance
  previewUrl = signal<string | null>(null);
  previewType = signal<FilePreviewType>('none');
  fileName = signal<string>('');
  fileSize = signal<number>(0);
  control = new FormControl();
  fieldId = `file_field_${Math.random().toString(36).substring(2, 11)}`;

  private onChange = (value: any) => {};
  private onTouched = () => {};

  writeValue(value: any): void {
    this.control.setValue(value, { emitEvent: false });
    if (!value) {
      this.clearPreview();
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  get hasError(): boolean {
    return this.control.invalid && this.control.touched;
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      this.clearPreview();
      return;
    }

    // Validate file size
    if (file.size > this.maxSize) {
      this.errorMessage = `File size must be less than ${this.formatFileSize(this.maxSize)}`;
      this.clearPreview();
      return;
    }

    this.processFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) {
      this.processFile(file);
    }
  }

  private processFile(file: File): void {
    // Update basic file info
    this.fileName.set(file.name);
    this.fileSize.set(file.size);

    // Determine preview type based on file type
    if (file.type.startsWith('image/')) {
      this.previewType.set('image');
      this.generateImagePreview(file);
    } else {
      this.previewType.set('document');
      this.previewUrl.set(null); // Documents don't need URL preview
    }

    // Update form control
    this.control.setValue(file);
    this.onChange(file);
  }

  private generateImagePreview(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl.set(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  private clearPreview(): void {
    this.previewUrl.set(null);
    this.previewType.set('none');
    this.fileName.set('');
    this.fileSize.set(0);
    this.control.setValue(null);
    this.onChange(null);
  }

  removeFile(): void {
    this.clearPreview();
  }

  onBlur(): void {
    this.onTouched();
  }

  getAcceptHint(): string {
    if (this.accept === 'image/*') return 'Images only';
    if (this.accept.includes('pdf')) return 'PDF files';
    if (this.accept.includes('doc')) return 'Word documents';
    return 'Any file type';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
