import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { W4UploadComponent } from './w4-upload.component';

describe('W4UploadComponent', () => {
  let component: W4UploadComponent;
  let fixture: ComponentFixture<W4UploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [W4UploadComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(W4UploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the W4UploadComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should format file sizes correctly', () => {
    expect(component.formatSize(500)).toBe('500 B');
    expect(component.formatSize(2048)).toBe('2.0 KB');
    expect(component.formatSize(1048576 * 3.5)).toBe('3.50 MB');
  });

  it('should reset file state when removeFile() is called', () => {
    component.selectedFile = new File(['test content'], 'sample.pdf', { type: 'application/pdf' });
    component.uploadedDoc = { name: 'sample.pdf', size: 1200, type: 'application/pdf' };
    component.uploadSuccess = true;

    component.removeFile();

    expect(component.selectedFile).toBeNull();
    expect(component.uploadedDoc).toBeNull();
    expect(component.uploadSuccess).toBeFalse();
  });
});
