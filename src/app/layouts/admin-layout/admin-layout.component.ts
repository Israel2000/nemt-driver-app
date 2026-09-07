import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
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
    MatMenuModule,
    MatDividerModule,
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
    if (url.includes('/admin/candidates')) {
      this.currentSectionTitle = 'Candidate ATS & Pipeline';
    } else if (url.includes('/admin/audit-shield')) {
      this.currentSectionTitle = 'Medicaid Audit Shield';
    } else if (url.includes('/admin/fleet')) {
      this.currentSectionTitle = 'Fleet & Vehicles';
    } else if (url.includes('/admin/billing')) {
      this.currentSectionTitle = 'Workspace & Billing';
    } else {
      this.currentSectionTitle = 'Executive Overview';
    }
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
    this.router.navigate(['/login']);
  }
}
