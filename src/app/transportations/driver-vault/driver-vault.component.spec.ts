import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { DriverVaultComponent } from './driver-vault.component';
import { ComplianceService } from '../../services/compliance.service';

describe('DriverVaultComponent', () => {
  let component: DriverVaultComponent;
  let fixture: ComponentFixture<DriverVaultComponent>;
  let complianceService: ComplianceService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [DriverVaultComponent],
      providers: [
        ComplianceService,
        provideRouter([]),
        provideNoopAnimations()
      ]
    }).compileComponents();

    complianceService = TestBed.inject(ComplianceService);
    fixture = TestBed.createComponent(DriverVaultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create the driver vault component', () => {
    expect(component).toBeTruthy();
  });

  it('should load initial drivers and selected driver DQF', () => {
    expect(component.drivers.length).toBeGreaterThanOrEqual(1);
    expect(component.currentRecord).toBeTruthy();
    expect(component.dispatchEligibility).toBeTruthy();
  });

  it('should calculate days remaining correctly', () => {
    const future = new Date();
    future.setDate(future.getDate() + 15);
    const futureStr = future.toISOString().split('T')[0];
    expect(component.getDaysRemaining(futureStr)).toBeGreaterThanOrEqual(14);

    const past = new Date();
    past.setDate(past.getDate() - 5);
    const pastStr = past.toISOString().split('T')[0];
    expect(component.getDaysRemaining(pastStr)).toBeLessThan(0);
  });

  it('should open and close renewal modal', () => {
    expect(component.showRenewModal).toBeFalse();
    component.openRenewModal('cpr');
    expect(component.showRenewModal).toBeTrue();
    expect(component.renewCredentialType).toBe('cpr');
    expect(component.renewTitle).toContain('CPR');

    component.closeRenewModal();
    expect(component.showRenewModal).toBeFalse();
  });
});
