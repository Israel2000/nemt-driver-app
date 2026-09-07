import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { DriverDvirComponent } from './driver-dvir.component';
import { ComplianceService } from '../../services/compliance.service';

describe('DriverDvirComponent', () => {
  let component: DriverDvirComponent;
  let fixture: ComponentFixture<DriverDvirComponent>;
  let complianceService: ComplianceService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [DriverDvirComponent],
      providers: [
        ComplianceService,
        provideRouter([]),
        provideNoopAnimations()
      ]
    }).compileComponents();

    complianceService = TestBed.inject(ComplianceService);
    fixture = TestBed.createComponent(DriverDvirComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create the DVIR component', () => {
    expect(component).toBeTruthy();
  });

  it('should load fleet vehicles and default to pre-trip', () => {
    expect(component.vehicles.length).toBeGreaterThanOrEqual(1);
    expect(component.inspectionType).toBe('pre_trip');
    expect(component.selectedUnitNumber).toBe('VAN-101');
  });

  it('should detect defects when critical NEMT item is toggled off', () => {
    expect(component.defectsIdentified).toBeFalse();

    // Toggle wheelchair lift off
    component.wheelchairLiftDeploymentCycle = false;
    component.onChecklistToggle();

    expect(component.defectsIdentified).toBeTrue();
    expect(component.vehicleSafeToOperate).toBeFalse();
  });

  it('should submit DVIR checklist when signed', () => {
    component.hasSignature = true;
    component.driverName = 'Marcus Vance';
    component.odometer = 42500;

    component.submitInspection();

    expect(component.submissionSuccess).toBeTrue();
    expect(component.submittedDvirId).toContain('DVIR-');

    const vehicle = complianceService.getVehicleByUnit('VAN-101');
    expect(vehicle?.todayDvirStatus).toBe('passed');
  });
});
