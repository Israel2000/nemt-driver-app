import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import {
  DriverAdminService,
  DriverApplication,
  ApplicationStatus,
  ActiveDriver,
  ComplianceMetrics
} from '../../services/driver-admin.service';
import { AuthService, User, CompanyWorkspace } from '../../services/auth.service';
import { ComplianceService } from '../../services/compliance.service';
import {
  DQFRecord,
  NonDriverStaffRecord,
  VehicleComplianceRecord,
  DVIRChecklist,
  DispatchEligibilityResult
} from '../../models/compliance.model';

export type AdminSection = 'overview' | 'pipeline' | 'compliance' | 'fleet' | 'settings';

export interface FleetVehicle {
  unitNumber: string;
  type: 'Wheelchair Ramp Van' | 'Bariatric Stretcher Van' | 'Ambulatory Sedan';
  makeModel: string;
  vin: string;
  licensePlate: string;
  status: 'In Service' | 'Inspection Due' | 'In Maintenance';
  dotInspectionDue: string;
  assignedDriver: string;
  mileage: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatTabsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    MatBadgeModule,
    MatSnackBarModule
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  activeSection: AdminSection = 'overview';
  sidebarCollapsed = false;
  mobileSidebarOpen = false;

  currentUser: User | null = null;
  currentWorkspace: CompanyWorkspace | null = null;

  applications: DriverApplication[] = [];
  filteredApplications: DriverApplication[] = [];
  activeDrivers: ActiveDriver[] = [];
  metrics: ComplianceMetrics = {
    totalApplicants: 0,
    pendingReview: 0,
    approvedDrivers: 0,
    expiringCredentialsCount: 0
  };

  searchQuery = '';
  statusFilter = 'all';
  selectedApplicant: DriverApplication | null = null;
  applicantNotes = '';

  displayedColumns: string[] = [
    'ref',
    'candidate',
    'position',
    'license',
    'appliedDate',
    'w4',
    'status',
    'actions'
  ];

  driverColumns: string[] = [
    'driver',
    'contact',
    'license',
    'cpr',
    'dot',
    'vehicle',
    'complianceStatus'
  ];

  fleetColumns: string[] = [
    'unitNumber',
    'vehicle',
    'type',
    'assignedDriver',
    'dotInspection',
    'dvirToday',
    'insurance',
    'status'
  ];

  staffColumns: string[] = [
    'staffName',
    'role',
    'background',
    'hipaa',
    'osha',
    'status'
  ];

  dqfRecords: DQFRecord[] = [];
  staffRecords: NonDriverStaffRecord[] = [];
  complianceVehicles: VehicleComplianceRecord[] = [];
  dvirLogs: DVIRChecklist[] = [];

  fleetVehicles: FleetVehicle[] = [
    {
      unitNumber: 'VAN-101',
      type: 'Wheelchair Ramp Van',
      makeModel: '2023 Ford Transit 350 High Roof',
      vin: '1FTBR1Y85KPA91024',
      licensePlate: 'MED-8910',
      status: 'In Service',
      dotInspectionDue: '2026-11-15',
      assignedDriver: 'Marcus Vance',
      mileage: 42350
    },
    {
      unitNumber: 'VAN-102',
      type: 'Bariatric Stretcher Van',
      makeModel: '2022 Ram ProMaster 2500 Lift',
      vin: '3C6TRVDG2NE681023',
      licensePlate: 'MED-9122',
      status: 'In Service',
      dotInspectionDue: '2026-10-01',
      assignedDriver: 'Carlos Mendez',
      mileage: 58900
    },
    {
      unitNumber: 'VAN-103',
      type: 'Wheelchair Ramp Van',
      makeModel: '2021 Dodge Grand Caravan ADA',
      vin: '2C4RDGBG8MR104812',
      licensePlate: 'MED-4419',
      status: 'Inspection Due',
      dotInspectionDue: '2026-09-28',
      assignedDriver: 'Elena Rostova',
      mileage: 84120
    },
    {
      unitNumber: 'SED-104',
      type: 'Ambulatory Sedan',
      makeModel: '2024 Toyota Camry Hybrid LE',
      vin: '4T1B11HK5RU901284',
      licensePlate: 'MED-2033',
      status: 'In Service',
      dotInspectionDue: '2027-01-20',
      assignedDriver: 'Unassigned (Reserve)',
      mileage: 31400
    }
  ];

  constructor(
    private adminService: DriverAdminService,
    private authService: AuthService,
    private complianceService: ComplianceService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    this.currentWorkspace = this.authService.currentWorkspaceValue;

    this.authService.currentUser$.subscribe(user => this.currentUser = user);
    this.authService.currentWorkspace$.subscribe(ws => this.currentWorkspace = ws);

    this.adminService.applications$.subscribe(apps => {
      this.applications = apps;
      this.activeDrivers = this.adminService.getActiveDrivers();
      this.metrics = this.adminService.getComplianceMetrics();
      this.filterApplications();
    });

    this.complianceService.dqfRecords$.subscribe(records => this.dqfRecords = records);
    this.complianceService.staffRecords$.subscribe(records => this.staffRecords = records);
    this.complianceService.vehicleRecords$.subscribe(records => this.complianceVehicles = records);
    this.complianceService.dvirLogs$.subscribe(logs => this.dvirLogs = logs);
  }

  setSection(section: AdminSection): void {
    this.activeSection = section;
    this.mobileSidebarOpen = false;
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  toggleMobileSidebar(): void {
    this.mobileSidebarOpen = !this.mobileSidebarOpen;
  }

  filterApplications(): void {
    const q = this.searchQuery.toLowerCase().trim();

    this.filteredApplications = this.applications.filter(app => {
      const matchesStatus =
        this.statusFilter === 'all' || app.status === this.statusFilter;

      const fullName = `${app.personal.firstName} ${app.personal.lastName}`.toLowerCase();
      const email = (app.personal.email || '').toLowerCase();
      const phone = (app.personal.phone || '').toLowerCase();
      const ref = (app.confirmationNumber || '').toLowerCase();
      const licenseNum = (app.license?.licenseNumber || '').toLowerCase();

      const matchesSearch =
        !q ||
        fullName.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        ref.includes(q) ||
        licenseNum.includes(q);

      return matchesStatus && matchesSearch;
    });
  }

  onSearchChange(): void {
    this.filterApplications();
  }

  onStatusFilterChange(): void {
    this.filterApplications();
  }

  viewDetails(app: DriverApplication): void {
    this.selectedApplicant = app;
    this.applicantNotes = app.notes || '';
  }

  closeDetails(): void {
    this.selectedApplicant = null;
    this.applicantNotes = '';
  }

  updateStatus(app: DriverApplication, newStatus: ApplicationStatus): void {
    this.adminService.updateStatus(app.confirmationNumber, newStatus, this.applicantNotes);
    if (this.selectedApplicant && this.selectedApplicant.confirmationNumber === app.confirmationNumber) {
      this.selectedApplicant = {
        ...this.selectedApplicant,
        status: newStatus,
        notes: this.applicantNotes
      };
    }
    const label = this.getStatusLabel(newStatus);
    this.snackBar.open(`Applicant marked as "${label}".`, 'OK', { duration: 3000 });
  }

  saveApplicantNotes(): void {
    if (!this.selectedApplicant) return;
    this.adminService.updateStatus(
      this.selectedApplicant.confirmationNumber,
      this.selectedApplicant.status,
      this.applicantNotes
    );
    this.snackBar.open('Hiring notes saved.', 'OK', { duration: 2500 });
  }

  deleteApplicant(app: DriverApplication): void {
    if (confirm(`Are you sure you want to remove the application for ${app.personal.firstName} ${app.personal.lastName}?`)) {
      this.adminService.deleteApplication(app.confirmationNumber);
      if (this.selectedApplicant?.confirmationNumber === app.confirmationNumber) {
        this.closeDetails();
      }
      this.snackBar.open('Application deleted.', 'OK', { duration: 3000 });
    }
  }

  copyApplicationLink(): void {
    const applyUrl = `${window.location.origin}/driver`;
    navigator.clipboard.writeText(applyUrl).then(() => {
      this.snackBar.open('Public Driver Application link copied to clipboard!', 'Great', {
        duration: 3500
      });
    }).catch(() => {
      this.snackBar.open(`Application URL: ${applyUrl}`, 'Dismiss', { duration: 5000 });
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getStatusClass(status: ApplicationStatus): string {
    switch (status) {
      case 'new':
        return 'status-new';
      case 'under_review':
        return 'status-review';
      case 'mvr_pending':
        return 'status-pending';
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      default:
        return 'status-default';
    }
  }

  getStatusLabel(status: ApplicationStatus): string {
    switch (status) {
      case 'new':
        return 'New Application';
      case 'under_review':
        return 'Under Review';
      case 'mvr_pending':
        return 'MVR / Drug Test Pending';
      case 'approved':
        return 'Approved & Hired';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  getDriverCredentialStatus(dateStr?: string): 'valid' | 'expiring_soon' | 'expired' {
    if (!dateStr) return 'valid';
    const now = new Date();
    const exp = new Date(dateStr);
    if (isNaN(exp.getTime())) return 'valid';
    if (exp < now) return 'expired';
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);
    if (exp <= thirtyDaysFromNow) return 'expiring_soon';
    return 'valid';
  }

  runOigScan(): void {
    const res = this.complianceService.runMonthlyOigSamBatchScan();
    this.snackBar.open(
      `Monthly OIG/SAM Exclusion Scan Complete: ${res.clearedCount} of ${res.scannedCount} drivers verified cleared in federal LEIE database for Medicaid reimbursement.`,
      'Verified',
      { duration: 5500 }
    );
  }

  getLockoutStatus(driverId: string, unitNumber?: string): DispatchEligibilityResult {
    return this.complianceService.evaluateDispatchEligibility(driverId, unitNumber || 'VAN-101');
  }

  getVehicleComplianceRecord(unitNumber: string): VehicleComplianceRecord | undefined {
    return this.complianceService.getVehicleByUnit(unitNumber);
  }
}
