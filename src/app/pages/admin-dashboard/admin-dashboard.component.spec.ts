import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { AdminDashboardComponent } from './admin-dashboard.component';
import { DriverAdminService } from '../../services/driver-admin.service';
import { AuthService } from '../../services/auth.service';
import { ComplianceService } from '../../services/compliance.service';

describe('AdminDashboardComponent', () => {
  let component: AdminDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardComponent>;
  let adminService: DriverAdminService;
  let complianceService: ComplianceService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [AdminDashboardComponent],
      providers: [
        DriverAdminService,
        AuthService,
        ComplianceService,
        provideRouter([]),
        provideNoopAnimations()
      ]
    }).compileComponents();

    adminService = TestBed.inject(DriverAdminService);
    complianceService = TestBed.inject(ComplianceService);
    fixture = TestBed.createComponent(AdminDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create the admin dashboard component', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate metrics on initialization', () => {
    expect(component.metrics.totalApplicants).toBeGreaterThanOrEqual(1);
    expect(component.metrics.approvedDrivers).toBeGreaterThanOrEqual(1);
  });

  it('should filter applications by status and search query', () => {
    component.statusFilter = 'approved';
    component.filterApplications();

    expect(component.filteredApplications.every(a => a.status === 'approved')).toBeTrue();

    component.statusFilter = 'all';
    component.searchQuery = 'Miller';
    component.filterApplications();

    expect(component.filteredApplications.length).toBeGreaterThanOrEqual(1);
    expect(component.filteredApplications[0].personal.lastName).toContain('Miller');
  });

  it('should switch modular sections in the enterprise SaaS console', () => {
    expect(component.activeSection).toBe('overview');

    component.setSection('fleet');
    expect(component.activeSection).toBe('fleet');

    component.setSection('compliance');
    expect(component.activeSection).toBe('compliance');

    component.setSection('settings');
    expect(component.activeSection).toBe('settings');

    component.setSection('pipeline');
    expect(component.activeSection).toBe('pipeline');
  });

  it('should toggle sidebar and mobile drawer states', () => {
    expect(component.sidebarCollapsed).toBeFalse();
    component.toggleSidebar();
    expect(component.sidebarCollapsed).toBeTrue();
    component.toggleSidebar();
    expect(component.sidebarCollapsed).toBeFalse();

    expect(component.mobileSidebarOpen).toBeFalse();
    component.toggleMobileSidebar();
    expect(component.mobileSidebarOpen).toBeTrue();
    component.toggleMobileSidebar();
    expect(component.mobileSidebarOpen).toBeFalse();
  });

  it('should have initial fleet vehicles populated', () => {
    expect(component.fleetVehicles.length).toBeGreaterThanOrEqual(3);
    expect(component.fleetVehicles.some(v => v.type === 'Wheelchair Ramp Van')).toBeTrue();
  });

  it('should execute monthly OIG/SAM scan from compliance action bar', () => {
    spyOn(complianceService, 'runMonthlyOigSamBatchScan').and.callThrough();
    component.runOigScan();
    expect(complianceService.runMonthlyOigSamBatchScan).toHaveBeenCalled();
  });

  it('should evaluate Hard Dispatch Lockout rules for drivers', () => {
    const clearedResult = component.getLockoutStatus('DRV-102', 'VAN-102');
    expect(clearedResult.isEligible).toBeTrue();

    const lockedResult = component.getLockoutStatus('DRV-103', 'VAN-103');
    expect(lockedResult.isEligible).toBeFalse();
    expect(lockedResult.lockoutReasons.length).toBeGreaterThan(0);
  });

  it('should open and close applicant detail dossier slide-over drawer', () => {
    const app = component.applications[0];
    component.viewDetails(app);

    expect(component.selectedApplicant).toBe(app);

    fixture.detectChanges();
    const drawer = fixture.nativeElement.querySelector('.review-slideover-drawer');
    const backdrop = fixture.nativeElement.querySelector('.drawer-backdrop');
    expect(drawer).toBeTruthy();
    expect(backdrop).toBeTruthy();

    const approveBtn = fixture.nativeElement.querySelector('.action-btn-approve');
    const reuploadBtn = fixture.nativeElement.querySelector('.action-btn-reupload');
    expect(approveBtn).toBeTruthy();
    expect(approveBtn.textContent).toContain('Approve Candidate');
    expect(reuploadBtn).toBeTruthy();
    expect(reuploadBtn.textContent).toContain('Request Document Re-upload');

    component.closeDetails();
    fixture.detectChanges();
    expect(component.selectedApplicant).toBeNull();
    expect(fixture.nativeElement.querySelector('.review-slideover-drawer')).toBeNull();
  });

  it('should approve candidate via approveCandidate method', () => {
    const app = component.applications[0];
    component.viewDetails(app);
    fixture.detectChanges();
    spyOn(component, 'approveCandidate').and.callThrough();

    const approveBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.action-btn-approve');
    approveBtn.click();
    fixture.detectChanges();

    expect(component.approveCandidate).toHaveBeenCalledWith(app);
    expect(app.status).toBe('approved');
  });

  it('should request document re-upload via requestDocumentReupload method', () => {
    const app = component.applications[0];
    component.viewDetails(app);
    fixture.detectChanges();
    spyOn(component, 'requestDocumentReupload').and.callThrough();

    const reuploadBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.action-btn-reupload');
    reuploadBtn.click();
    fixture.detectChanges();

    expect(component.requestDocumentReupload).toHaveBeenCalledWith(app);
    expect(app.status).toBe('under_review');
  });

  it('should update applicant status and refresh metrics', () => {
    const app = component.applications[0];
    component.updateStatus(app, 'under_review');

    const updatedApp = adminService.getApplicationByConfirmation(app.confirmationNumber);
    expect(updatedApp?.status).toBe('under_review');
  });
});
