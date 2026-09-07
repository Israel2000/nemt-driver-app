import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { DriverFormsComponent } from './driver-forms.component';

describe('DriverFormsComponent', () => {
  let component: DriverFormsComponent;
  let fixture: ComponentFixture<DriverFormsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DriverFormsComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DriverFormsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the driver forms component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with 1 primary residence and 1 primary employment', () => {
    expect(component.residencesArray.length).toBe(1);
    expect(component.employmentArray.length).toBe(1);
  });

  it('should allow dynamically adding and removing residences', () => {
    component.addResidence();
    expect(component.residencesArray.length).toBe(2);

    component.removeResidence(1);
    expect(component.residencesArray.length).toBe(1);
  });

  it('should allow dynamically adding and removing employment records', () => {
    component.addEmployment();
    expect(component.employmentArray.length).toBe(2);

    component.removeEmployment(1);
    expect(component.employmentArray.length).toBe(1);
  });

  it('should clear signature correctly', () => {
    component.hasSignature = true;
    component.certificationGroup.patchValue({ signatureDataUrl: 'data:image/png;base64,sample' });

    component.clearSignature();

    expect(component.hasSignature).toBeFalse();
    expect(component.certificationGroup.get('signatureDataUrl')?.value).toBe('');
  });

  it('should have a defined stepper orientation', () => {
    expect(['horizontal', 'vertical']).toContain(component.stepperOrientation);
  });

  it('should have 4 distinct application steps matching design specifications', () => {
    expect(component.formSteps.length).toBe(4);
    expect(component.formSteps[0].title).toBe('Personal & Residency');
    expect(component.formSteps[1].title).toBe('Driver License');
    expect(component.formSteps[2].title).toBe('Work & Education');
    expect(component.formSteps[3].title).toBe('W-4 & Signature');
  });

  it('should allow navigating steps via goToStep', () => {
    const mockStepper = { selectedIndex: 0 };
    component.goToStep(2, mockStepper);
    expect(component.currentStepIndex).toBe(2);
    expect(mockStepper.selectedIndex).toBe(2);
  });

  it('should evaluate isStepCompleted correctly for step groups', () => {
    // Initially incomplete
    expect(component.isStepCompleted(0)).toBeFalse();
    expect(component.isStepCompleted(1)).toBeFalse();

    // Populate license group with valid data
    component.licenseGroup.patchValue({
      state: 'CA',
      licenseNumber: 'DL12345678',
      licenseClass: 'Class C (Standard)',
      expirationDate: new Date(2028, 5, 15),
      hasSuspensions: 'no',
      suspensionDetails: ''
    });
    expect(component.isStepCompleted(1)).toBeTrue();
  });

  it('should render 4 step buttons in the desktop stepper header', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const stepButtons = compiled.querySelectorAll('.step-node-btn');
    expect(stepButtons.length).toBe(4);
  });

  it('should include mobile camera capture input for driver license in Step 2', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const cameraInput = compiled.querySelector('input[capture="environment"]') as HTMLInputElement;
    expect(cameraInput).toBeTruthy();
    expect(cameraInput.getAttribute('accept')).toBe('image/*');
  });

  it('should clear license photo properly when removeLicensePhoto is called', () => {
    component.licensePhotoDataUrl = 'data:image/jpeg;base64,samplelicense';
    component.licensePhotoName = 'license.jpg';
    component.licensePhotoSize = 102400;

    component.removeLicensePhoto();

    expect(component.licensePhotoDataUrl).toBe('');
    expect(component.licensePhotoName).toBe('');
    expect(component.licensePhotoSize).toBeNull();
  });

  it('should require statement attestation checkbox for Step 4 completion', () => {
    component.certificationGroup.patchValue({
      certifyTrue: true,
      authorizeInvestigation: true,
      statementAttestation: false,
      printedName: 'John Doe',
      signatureDate: new Date(),
      signatureDataUrl: 'data:image/png;base64,sample'
    });
    component.hasSignature = true;

    // False because statementAttestation is false
    expect(component.isStepCompleted(3)).toBeFalse();

    // Set attestation to true
    component.certificationGroup.patchValue({ statementAttestation: true });
    expect(component.isStepCompleted(3)).toBeTrue();
  });
});
