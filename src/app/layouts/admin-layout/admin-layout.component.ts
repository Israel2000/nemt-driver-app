import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import {
  DriverAdminService,
  DriverApplication,
  ApplicationStatus,
  ComplianceMetrics
} from '../../services/driver-admin.service';
import { AuthService, User, CompanyWorkspace } from '../../services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule
  ],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  sidebarCollapsed = false;
  mobileSidebarOpen = false;

  currentUser: User | null = null;
  currentWorkspace: CompanyWorkspace | null = null;
  metrics: ComplianceMetrics = {
    totalApplicants: 0,
    pendingReview: 0,
    approvedDrivers: 0,
    expiringCredentialsCount: 0
  };

  currentSectionTitle = 'Executive Overview';
  currentSectionSubtitle = 'Real-time driver acquisition metrics, credential tracking, and compliance shield health.';
  selectedApplicant: DriverApplication | null = null;
  applicantNotes = '';

  private subs = new Subscription();

  constructor(
    private adminService: DriverAdminService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.updateSectionTitle(this.router.url);

    this.subs.add(
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe((event: any) => {
        this.updateSectionTitle(event.urlAfterRedirects || event.url);
        this.mobileSidebarOpen = false;
      })
    );

    this.subs.add(
      this.authService.currentUser$.subscribe(user => {
        this.currentUser = user;
      })
    );

    this.subs.add(
      this.authService.currentWorkspace$.subscribe(ws => {
        this.currentWorkspace = ws;
      })
    );

    this.subs.add(
      this.adminService.applications$.subscribe(() => {
        this.metrics = this.adminService.getComplianceMetrics();
      })
    );

    this.subs.add(
      this.adminService.selectedApplicant$.subscribe(app => {
        this.selectedApplicant = app;
        this.applicantNotes = app?.notes || '';
      })
    );

    this.metrics = this.adminService.getComplianceMetrics();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private updateSectionTitle(url: string): void {
    if (url.includes('/admin/dispatch')) {
      this.currentSectionTitle = 'Live Dispatch & Fleet Tracking';
      this.currentSectionSubtitle = 'Real-time trip manifest, live fleet map, and driver messaging.';
    } else if (url.includes('/admin/candidates')) {
      this.currentSectionTitle = 'Candidate ATS & Pipeline';
      this.currentSectionSubtitle = 'Review incoming applications, inspect digital signatures and W-4s, and execute Medicaid background clearance.';
    } else if (url.includes('/admin/audit-shield')) {
      this.currentSectionTitle = 'Medicaid Audit Shield';
      this.currentSectionSubtitle = 'Continuous automated monitoring of state driver licenses, CPR/First Aid certifications, DOT physicals, and monthly federal OIG/SAM exclusion checks.';
    } else if (url.includes('/admin/fleet')) {
      this.currentSectionTitle = 'Fleet & Vehicles';
      this.currentSectionSubtitle = 'Wheelchair ramp vans, bariatric stretchers, and ambulatory vehicles tracked for annual DOT inspection compliance.';
    } else if (url.includes('/admin/billing')) {
      this.currentSectionTitle = 'Workspace Configuration & Medicaid Billing';
      this.currentSectionSubtitle = 'Multi-tenant fleet management, broker billing credentials, and subscription status.';
    } else {
      this.currentSectionTitle = 'Executive Overview';
      this.currentSectionSubtitle = 'Real-time driver acquisition metrics, credential tracking, and compliance shield health.';
    }
  }

  /** Sidebar profile: demo user is "Sarah Jenkins (Fleet Director)" — split it
      into the mockup's name + role lines. Falls back gracefully for other users. */
  get userDisplayName(): string {
    const full = this.currentUser?.fullName || 'Sarah Jenkins';
    return full.replace(/\s*\([^)]*\)\s*$/, '').trim() || full;
  }

  get userRoleLabel(): string {
    const full = this.currentUser?.fullName || '';
    const m = full.match(/\(([^)]+)\)/);
    if (m) return m[1];
    return this.currentUser?.role ? this.currentUser.role.toUpperCase() + ' CLEARANCE' : 'Fleet Director';
  }

  get userInitials(): string {
    return this.userDisplayName.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  toggleMobileSidebar(): void {
    this.mobileSidebarOpen = !this.mobileSidebarOpen;
  }

  closeMobileSidebar(): void {
    this.mobileSidebarOpen = false;
  }

  closeDetails(): void {
    this.adminService.closeReview();
  }

  approveCandidate(app: DriverApplication): void {
    app.status = 'approved';
    this.adminService.updateStatus(app.confirmationNumber, 'approved', this.applicantNotes);
    this.snackBar.open(`Candidate ${app.personal.firstName} ${app.personal.lastName} Approved & Hired!`, 'OK', { duration: 3500 });
  }

  requestDocumentReupload(app: DriverApplication): void {
    const timestamp = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const noteEntry = `[${timestamp}] Document re-upload requested: Candidate prompted for clear driver license and/or Form W-4.`;
    this.applicantNotes = this.applicantNotes ? `${this.applicantNotes}\n${noteEntry}` : noteEntry;
    app.status = 'under_review';
    app.notes = this.applicantNotes;
    this.adminService.updateStatus(app.confirmationNumber, 'under_review', this.applicantNotes);
    this.snackBar.open(`Document re-upload request sent to ${app.personal.firstName} ${app.personal.lastName}.`, 'Sent', { duration: 4000 });
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

  updateStatus(app: DriverApplication, newStatus: ApplicationStatus): void {
    app.status = newStatus;
    this.adminService.updateStatus(app.confirmationNumber, newStatus, this.applicantNotes);
    const label = this.getStatusLabel(newStatus);
    this.snackBar.open(`Applicant marked as "${label}".`, 'OK', { duration: 3000 });
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) return '0 KB';
    if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + ' KB';
    }
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'new': return 'status-new';
      case 'under_review': return 'status-review bg-amber-50 text-amber-700 border border-amber-200';
      case 'mvr_pending': return 'status-pending';
      case 'approved': return 'status-approved bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'rejected':
      case 'urgent':
      case 'expiring':
        return 'status-rejected bg-rose-50 text-rose-700 border border-rose-200';
      default: return 'status-default';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'new': return 'New Application';
      case 'under_review': return 'Under Review';
      case 'mvr_pending': return 'MVR / Drug Test Pending';
      case 'approved': return 'Approved & Hired';
      case 'rejected':
      case 'urgent':
      case 'expiring':
        return 'Urgent Attention / Expiring';
      default: return status;
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/admin/login']);
  }
}
