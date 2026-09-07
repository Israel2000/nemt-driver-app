import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  HostListener,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { RouterModule } from '@angular/router';

// Angular Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatStepperModule, StepperOrientation } from '@angular/material/stepper';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BreakpointObserver } from '@angular/cdk/layout';

import { W4UploadComponent, UploadedDoc } from '../w4-upload/w4-upload.component';

@Component({
  selector: 'app-driver-forms',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatRadioModule,
    MatCheckboxModule,
    MatStepperModule,
    MatSelectModule,
    MatDividerModule,
    MatSnackBarModule,
    W4UploadComponent
  ],
  templateUrl: './driver-forms.component.html',
  styleUrls: ['./driver-forms.component.css']
})
export class DriverFormsComponent implements OnInit, AfterViewInit {
  @ViewChild('signatureCanvas') signatureCanvasRef?: ElementRef<HTMLCanvasElement>;

  driverForm!: FormGroup;
  isSubmitted = false;
  confirmationNumber = '';
  submittedData: any = null;
  stepperOrientation: StepperOrientation = 'horizontal';
  currentStepIndex = 0;

  readonly formSteps = [
    { title: 'Personal & Residency', subtitle: 'Identity & Address History' },
    { title: 'Driver License', subtitle: 'Credentials & MVR History' },
    { title: 'Work & Education', subtitle: 'Work History & Education' },
    { title: 'W-4 & Signature', subtitle: 'Tax Withholding & Sign-off' }
  ];

  // Signature drawing state
  private isDrawing = false;
  private ctx: CanvasRenderingContext2D | null = null;
  hasSignature = false;

  // License photo capture state
  licensePhotoDataUrl = '';
  licensePhotoName = '';
  licensePhotoSize: number | null = null;

  usStates: string[] = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
  ];

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private breakpointObserver: BreakpointObserver
  ) {}

  ngOnInit() {
    this.initForm();
    this.breakpointObserver.observe(['(max-width: 768px)']).subscribe(result => {
      this.stepperOrientation = result.matches ? 'vertical' : 'horizontal';
      setTimeout(() => this.setupCanvas(), 100);
    });
  }

  ngAfterViewInit() {
    setTimeout(() => this.setupCanvas(), 100);
  }

  private initForm() {
    const today = new Date();

    this.driverForm = this.fb.group({
      personal: this.fb.group({
        firstName: ['', [Validators.required, Validators.minLength(2)]],
        middleName: [''],
        lastName: ['', [Validators.required, Validators.minLength(2)]],
        phone: ['', [Validators.required, Validators.pattern(/^[0-9+() -]{10,18}$/)]],
        email: ['', [Validators.required, Validators.email]],
        dob: ['', Validators.required],
        ssn: ['', [Validators.required, Validators.pattern(/^(\d{3}-?\d{2}-?\d{4}|\d{9})$/)]],
        dateOfApplication: [today, Validators.required],
        positionAppliedFor: ['NEMT Driver', Validators.required],
        availableStartDate: ['', Validators.required],
        legalRightToWork: ['yes', Validators.required]
      }),

      residences: this.fb.array([this.createResidenceGroup(true)]),

      license: this.fb.group({
        state: ['', Validators.required],
        licenseNumber: ['', [Validators.required, Validators.minLength(4)]],
        licenseClass: ['Class C (Standard)', Validators.required],
        expirationDate: ['', Validators.required],
        hasSuspensions: ['no', Validators.required],
        suspensionDetails: [''],
        licensePhotoDataUrl: [''],
        licensePhotoName: ['']
      }),

      employment: this.fb.array([this.createEmploymentGroup(true)]),

      education: this.fb.group({
        highSchoolName: [''],
        highSchoolCourse: ['General / High School Diploma'],
        highSchoolYears: ['4'],
        highSchoolGraduated: ['yes'],

        collegeName: [''],
        collegeCourse: [''],
        collegeYears: [''],
        collegeGraduated: ['no'],

        otherSchoolName: [''],
        otherSchoolCourse: [''],
        otherSchoolYears: [''],
        otherSchoolGraduated: ['no']
      }),

      documents: this.fb.group({
        w4FileName: [''],
        w4FileSize: [null],
        w4FileData: [''],
        licensePhotoDataUrl: [''],
        licensePhotoName: ['']
      }),

      certification: this.fb.group({
        certifyTrue: [false, Validators.requiredTrue],
        authorizeInvestigation: [false, Validators.requiredTrue],
        statementAttestation: [false, Validators.requiredTrue],
        printedName: ['', [Validators.required, Validators.minLength(2)]],
        signatureDate: [today, Validators.required],
        signatureDataUrl: ['', Validators.required]
      })
    });
  }

  // Getters for form groups and arrays
  get personalGroup(): FormGroup {
    return this.driverForm.get('personal') as FormGroup;
  }

  get residencesArray(): FormArray {
    return this.driverForm.get('residences') as FormArray;
  }

  get licenseGroup(): FormGroup {
    return this.driverForm.get('license') as FormGroup;
  }

  get employmentArray(): FormArray {
    return this.driverForm.get('employment') as FormArray;
  }

  get educationGroup(): FormGroup {
    return this.driverForm.get('education') as FormGroup;
  }

  get documentsGroup(): FormGroup {
    return this.driverForm.get('documents') as FormGroup;
  }

  get certificationGroup(): FormGroup {
    return this.driverForm.get('certification') as FormGroup;
  }

  // Residence management
  createResidenceGroup(isPrimary = false): FormGroup {
    return this.fb.group({
      street: ['', isPrimary ? [Validators.required] : []],
      city: ['', isPrimary ? [Validators.required] : []],
      state: ['', isPrimary ? [Validators.required] : []],
      zipCode: ['', isPrimary ? [Validators.required, Validators.pattern(/^\d{5}(-\d{4})?$/)] : [Validators.pattern(/^\d{5}(-\d{4})?$/)]],
      yearsAtAddress: ['', isPrimary ? [Validators.required] : []]
    });
  }

  addResidence() {
    this.residencesArray.push(this.createResidenceGroup(false));
    this.snackBar.open('Added new residence entry.', 'Dismiss', { duration: 2500 });
  }

  removeResidence(index: number) {
    if (this.residencesArray.length > 1) {
      this.residencesArray.removeAt(index);
      this.snackBar.open('Removed residence entry.', 'Dismiss', { duration: 2500 });
    }
  }

  // Employment management
  createEmploymentGroup(isPrimary = false): FormGroup {
    return this.fb.group({
      companyName: ['', isPrimary ? [Validators.required] : []],
      address: [''],
      phone: [''],
      fromDate: ['', isPrimary ? [Validators.required] : []],
      toDate: ['', isPrimary ? [Validators.required] : []],
      position: ['', isPrimary ? [Validators.required] : []],
      reasonForLeaving: ['']
    });
  }

  addEmployment() {
    this.employmentArray.push(this.createEmploymentGroup(false));
    this.snackBar.open('Added new employment record.', 'Dismiss', { duration: 2500 });
  }

  removeEmployment(index: number) {
    if (this.employmentArray.length > 1) {
      this.employmentArray.removeAt(index);
      this.snackBar.open('Removed employment record.', 'Dismiss', { duration: 2500 });
    }
  }

  // W-4 Document Handlers
  onW4Uploaded(doc: UploadedDoc) {
    this.documentsGroup.patchValue({
      w4FileName: doc.name,
      w4FileSize: doc.size,
      w4FileData: doc.dataUrl || ''
    });
    this.snackBar.open(`W-4 Document "${doc.name}" attached successfully!`, 'OK', {
      duration: 3000
    });
  }

  onW4Removed() {
    this.documentsGroup.patchValue({
      w4FileName: '',
      w4FileSize: null,
      w4FileData: ''
    });
    this.snackBar.open('W-4 Document detached.', 'Dismiss', { duration: 2000 });
  }

  // License Photo Upload & Camera Capture Handlers
  onLicensePhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    this.licensePhotoName = file.name;
    this.licensePhotoSize = file.size;

    const reader = new FileReader();
    reader.onload = () => {
      this.licensePhotoDataUrl = reader.result as string;
      this.licenseGroup.patchValue({
        licensePhotoDataUrl: this.licensePhotoDataUrl,
        licensePhotoName: this.licensePhotoName
      });
      this.documentsGroup.patchValue({
        licensePhotoDataUrl: this.licensePhotoDataUrl,
        licensePhotoName: this.licensePhotoName
      });
      this.snackBar.open(`Driver license photo "${file.name}" attached successfully!`, 'OK', {
        duration: 3000
      });
    };
    reader.readAsDataURL(file);
  }

  removeLicensePhoto(fileInput?: HTMLInputElement): void {
    this.licensePhotoDataUrl = '';
    this.licensePhotoName = '';
    this.licensePhotoSize = null;
    if (fileInput) {
      fileInput.value = '';
    }
    this.licenseGroup.patchValue({
      licensePhotoDataUrl: '',
      licensePhotoName: ''
    });
    this.documentsGroup.patchValue({
      licensePhotoDataUrl: '',
      licensePhotoName: ''
    });
    this.snackBar.open('Driver license photo removed.', 'Dismiss', { duration: 2000 });
  }

  formatFileSize(bytes?: number | null): string {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  onStepChange(event: any) {
    this.currentStepIndex = event.selectedIndex;
    // When navigating to Step 4 (W-4 & Signature)
    if (event.selectedIndex === 3) {
      setTimeout(() => {
        this.setupCanvas();
        if (this.hasSignature) {
          const savedData = this.certificationGroup.get('signatureDataUrl')?.value;
          if (savedData && this.ctx) {
            const img = new Image();
            img.onload = () => this.ctx?.drawImage(img, 0, 0);
            img.src = savedData;
          }
        }
      }, 80);
    }
  }

  goToStep(index: number, stepper: any) {
    if (stepper) {
      stepper.selectedIndex = index;
      this.currentStepIndex = index;
      if (index === 3) {
        setTimeout(() => {
          this.setupCanvas();
          if (this.hasSignature) {
            const savedData = this.certificationGroup.get('signatureDataUrl')?.value;
            if (savedData && this.ctx) {
              const img = new Image();
              img.onload = () => this.ctx?.drawImage(img, 0, 0);
              img.src = savedData;
            }
          }
        }, 80);
      }
    }
  }

  isStepCompleted(index: number): boolean {
    switch (index) {
      case 0:
        return this.personalGroup ? this.personalGroup.valid && this.residencesArray.valid : false;
      case 1:
        return this.licenseGroup ? this.licenseGroup.valid : false;
      case 2:
        return this.employmentArray && this.educationGroup ? this.employmentArray.valid && this.educationGroup.valid : false;
      case 3:
        return this.certificationGroup
          ? this.certificationGroup.valid && this.hasSignature && !!this.certificationGroup.get('statementAttestation')?.value
          : false;
      default:
        return false;
    }
  }

  // Signature Pad Logic
  private setupCanvas() {
    if (!this.signatureCanvasRef) return;
    const canvas = this.signatureCanvasRef.nativeElement;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) return;

    const rect = canvas.getBoundingClientRect();
    const parentWidth = canvas.parentElement?.clientWidth || 320;
    const actualWidth = rect.width > 0 ? rect.width : parentWidth;
    const actualHeight = rect.height > 0 ? rect.height : 160;

    // Retina / High-DPI scaling
    const dpr = window.devicePixelRatio || 1;
    canvas.width = actualWidth * dpr;
    canvas.height = actualHeight * dpr;
    this.ctx.scale(dpr, dpr);

    this.ctx.strokeStyle = '#0f172a';
    this.ctx.lineWidth = 2.5;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  @HostListener('window:resize')
  onWindowResize() {
    // Retain drawn signature if window resizes
    if (this.hasSignature && this.signatureCanvasRef) {
      const savedData = this.certificationGroup.get('signatureDataUrl')?.value;
      this.setupCanvas();
      if (savedData) {
        const img = new Image();
        img.onload = () => this.ctx?.drawImage(img, 0, 0);
        img.src = savedData;
      }
    } else {
      this.setupCanvas();
    }
  }

  startDrawing(event: MouseEvent | TouchEvent) {
    event.preventDefault();
    if (!this.signatureCanvasRef) return;
    const canvas = this.signatureCanvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Re-verify canvas internal resolution matches rendered size
    if (rect.width > 0 && Math.abs(canvas.width - Math.round(rect.width * dpr)) > 4) {
      this.setupCanvas();
    }

    if (!this.ctx) return;
    this.isDrawing = true;
    const pos = this.getPointerPos(event);
    this.ctx.beginPath();
    this.ctx.moveTo(pos.x, pos.y);
  }

  draw(event: MouseEvent | TouchEvent) {
    if (!this.isDrawing || !this.ctx || !this.signatureCanvasRef) return;
    event.preventDefault();
    const pos = this.getPointerPos(event);
    this.ctx.lineTo(pos.x, pos.y);
    this.ctx.stroke();
    this.hasSignature = true;
  }

  stopDrawing() {
    if (!this.isDrawing || !this.signatureCanvasRef) return;
    this.isDrawing = false;
    const canvas = this.signatureCanvasRef.nativeElement;
    const dataUrl = canvas.toDataURL('image/png');
    this.certificationGroup.patchValue({
      signatureDataUrl: dataUrl
    });
    this.certificationGroup.get('signatureDataUrl')?.markAsTouched();
  }

  clearSignature() {
    if (this.signatureCanvasRef && this.ctx) {
      const canvas = this.signatureCanvasRef.nativeElement;
      this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    this.hasSignature = false;
    this.certificationGroup.patchValue({
      signatureDataUrl: ''
    });
    this.certificationGroup.get('signatureDataUrl')?.markAsTouched();
    this.snackBar.open('Signature cleared. Please sign again.', 'OK', { duration: 2500 });
  }

  private getPointerPos(event: MouseEvent | TouchEvent): { x: number; y: number } {
    const canvas = this.signatureCanvasRef!.nativeElement;
    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if (window.TouchEvent && event instanceof TouchEvent && event.touches.length > 0) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      const mouseEvent = event as MouseEvent;
      clientX = mouseEvent.clientX;
      clientY = mouseEvent.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  // Form Submission
  onSubmit() {
    if (this.driverForm.invalid || !this.hasSignature || !this.certificationGroup.get('statementAttestation')?.value) {
      this.driverForm.markAllAsTouched();
      this.snackBar.open('Please complete all required fields, draw your signature, and check the attestation.', 'Close', {
        duration: 4500
      });
      return;
    }

    const formValue = this.driverForm.value;
    this.confirmationNumber = 'NEMT-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    this.submittedData = {
      confirmationNumber: this.confirmationNumber,
      submittedAt: new Date().toISOString(),
      licensePhotoDataUrl: this.licensePhotoDataUrl,
      licensePhotoName: this.licensePhotoName,
      ...formValue
    };

    // Save to localStorage
    try {
      const existing = JSON.parse(localStorage.getItem('nemt_driver_applications') || '[]');
      existing.push(this.submittedData);
      localStorage.setItem('nemt_driver_applications', JSON.stringify(existing));
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }

    this.isSubmitted = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.snackBar.open('Application submitted successfully!', 'Great!', { duration: 4000 });
  }

  downloadApplicationSummary() {
    if (!this.submittedData) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.submittedData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${this.confirmationNumber}-application.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  printApplication() {
    window.print();
  }

  startNewApplication() {
    this.isSubmitted = false;
    this.confirmationNumber = '';
    this.submittedData = null;
    this.hasSignature = false;
    this.currentStepIndex = 0;
    this.licensePhotoDataUrl = '';
    this.licensePhotoName = '';
    this.licensePhotoSize = null;
    this.initForm();
    setTimeout(() => {
      this.setupCanvas();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  }
}

export { DriverFormsComponent as DriverApplicationComponent };
