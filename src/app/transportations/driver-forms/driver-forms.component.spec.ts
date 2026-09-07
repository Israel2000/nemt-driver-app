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
});
