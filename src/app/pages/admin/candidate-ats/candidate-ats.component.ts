import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import {
  DriverAdminService,
  DriverApplication,
  ApplicationStatus
} from '../../../services/driver-admin.service';

@Component({
  selector: 'app-candidate-ats',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatMenuModule,
    MatDividerModule,
    MatSnackBarModule
  ],
  templateUrl: './candidate-ats.component.html',
  styleUrls: ['./candidate-ats.component.css']
})
export class CandidateAtsComponent implements OnInit {
  applications: DriverApplication[] = [];
  filteredApplications: DriverApplication[] = [];
  displayedColumns = ['ref', 'candidate', 'position', 'license', 'appliedDate', 'w4', 'status', 'actions'];

  searchQuery = '';
  statusFilter = 'all';

  constructor(
    private adminService: DriverAdminService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.adminService.applications$.subscribe(apps => {
      this.applications = apps;
      this.filterApplications();
    });
  }

  filterApplications(): void {
    const q = (this.searchQuery || '').trim().toLowerCase();

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
    this.adminService.openReview(app);
  }

  updateStatus(app: DriverApplication, newStatus: ApplicationStatus): void {
    app.status = newStatus;
    this.adminService.updateStatus(app.confirmationNumber, newStatus);
    const label = this.getStatusLabel(newStatus);
    this.snackBar.open(`Applicant marked as "${label}".`, 'OK', { duration: 3000 });
  }

  deleteApplicant(app: DriverApplication): void {
    if (confirm(`Are you sure you want to remove the application for ${app.personal.firstName} ${app.personal.lastName}?`)) {
      this.adminService.deleteApplication(app.confirmationNumber);
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

  formatDate(dateStr?: string): string {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  getStatusClass(status: ApplicationStatus | string): string {
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

  getStatusLabel(status: ApplicationStatus | string): string {
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
}
