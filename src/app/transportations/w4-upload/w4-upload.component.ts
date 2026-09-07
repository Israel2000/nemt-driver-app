import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

export interface UploadedDoc {
  name: string;
  size: number;
  type: string;
  dataUrl?: string;
}

@Component({
  selector: 'app-w4-upload',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule
  ],
  templateUrl: './w4-upload.component.html',
  styleUrl: './w4-upload.component.css'
})
export class W4UploadComponent {
  @Input() standaloneMode = true;
  @Input() existingFileName?: string;
  @Output() fileUploaded = new EventEmitter<UploadedDoc>();
  @Output() fileRemoved = new EventEmitter<void>();

  selectedFile: File | null = null;
  uploadedDoc: UploadedDoc | null = null;
  isDragging = false;
  uploadProgress = 0;
  isUploading = false;
  uploadSuccess = false;
  errorMessage = '';

  allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg'
  ];
  maxSizeBytes = 10 * 1024 * 1024; // 10 MB

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.processFile(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFile(input.files[0]);
    }
  }

  private processFile(file: File) {
    this.errorMessage = '';
    this.uploadSuccess = false;

    // Validate type
    if (!this.allowedTypes.includes(file.type) && !file.name.endsWith('.pdf')) {
      this.errorMessage = 'Invalid file type. Please upload a PDF, PNG, or JPG document.';
      return;
    }

    // Validate size
    if (file.size > this.maxSizeBytes) {
      this.errorMessage = 'File exceeds maximum size limit of 10MB.';
      return;
    }

    this.selectedFile = file;
    this.simulateUpload(file);
  }

  private simulateUpload(file: File) {
    this.isUploading = true;
    this.uploadProgress = 0;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;

      const interval = setInterval(() => {
        this.uploadProgress += 25;
        if (this.uploadProgress >= 100) {
          clearInterval(interval);
          this.isUploading = false;
          this.uploadSuccess = true;
          this.uploadedDoc = {
            name: file.name,
            size: file.size,
            type: file.type || 'application/pdf',
            dataUrl
          };
          this.fileUploaded.emit(this.uploadedDoc);
        }
      }, 100);
    };

    reader.readAsDataURL(file);
  }

  removeFile() {
    this.selectedFile = null;
    this.uploadedDoc = null;
    this.uploadProgress = 0;
    this.isUploading = false;
    this.uploadSuccess = false;
    this.errorMessage = '';
    this.fileRemoved.emit();
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}
