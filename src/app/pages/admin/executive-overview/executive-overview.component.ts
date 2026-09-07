import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import {
  DriverAdminService,
  DriverApplication,
  ActiveDriver,
  ComplianceMetrics
} from '../../../services/driver-admin.service';

@Component({
  selector: 'app-executive-overview',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './executive-overview.component.html',
  styleUrls: ['./executive-overview.component.css']
})
export class ExecutiveOverviewComponent implements OnInit {
  applications: DriverApplication[] = [];
  activeDrivers: ActiveDriver[] = [];
  metrics: ComplianceMetrics = {
    totalApplicants: 0,
    pendingReview: 0,
    approvedDrivers: 0,
    expiringCredentialsCount: 0
  };

  fleetVehiclesCount = 4;

  constructor(
    private adminService: DriverAdminService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.adminService.applications$.subscribe(apps => {
      this.applications = apps;
      this.metrics = this.adminService.getComplianceMetrics();
    });

    this.activeDrivers = this.adminService.getActiveDrivers();
    this.metrics = this.adminService.getComplianceMetrics();
  }

  viewDetails(app: DriverApplication): void {
    this.adminService.openReview(app);
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

  getStatusClass(status: string): string {
    switch (status) {
      case 'new': return 'status-new';
      case 'under_review': return 'status-review';
      case 'mvr_pending': return 'status-pending';
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      default: return 'status-default';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'new': return 'New Application';
      case 'under_review': return 'Under Review';
      case 'mvr_pending': return 'MVR / Drug Test Pending';
      case 'approved': return 'Approved & Hired';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  }
}
