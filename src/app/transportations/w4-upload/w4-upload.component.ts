import { Component } from '@angular/core';

@Component({
  selector: 'app-w4-upload',
  imports: [],
  templateUrl: './w4-upload.component.html',
  styleUrl: './w4-upload.component.css'
})
export class W4UploadComponent {
  file: File | null = null;

  onFileSelect(event: any) {
    this.file = event.target.files[0];
  }

  upload() {
    if (this.file) {
      console.log('Uploading file:', this.file.name);
    }
  }
}
