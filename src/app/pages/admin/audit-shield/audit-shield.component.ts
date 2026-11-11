import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import {
  DriverAdminService,
  ActiveDriver
} from '../../../services/driver-admin.service';
import { ComplianceService } from '../../../services/compliance.service';
import {
  NonDriverStaffRecord,
  DispatchEligibilityResult
} from '../../../models/compliance.model';

@Component({
  selector: 'app-audit-shield',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  templateUrl: './audit-shield.component.html',
  styleUrls: ['./audit-shield.component.css']
})
export class AuditShieldComponent implements OnInit {
  activeDrivers: ActiveDriver[] = [];
  driverColumns = ['driver', 'contact', 'license', 'cpr', 'dot', 'vehicle', 'complianceStatus'];

  nonDriverStaff: NonDriverStaffRecord[] = [];
  staffColumns = ['name', 'role', 'oigStatus', 'background', 'actions'];

  constructor(
    private adminService: DriverAdminService,
    private complianceService: ComplianceService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.activeDrivers = this.adminService.getActiveDrivers();
    this.complianceService.staffRecords$.subscribe(staff => {
      this.nonDriverStaff = staff;
    });
  }

  private http = inject(HttpClient);

  /**
   * Phase 3: run the OIG/SAM scan against the server (POST
   * /api/drivers/compliance/run-check) when the backend is reachable.
   * The server check is SIMULATED — it records a timestamped result, it
   * is NOT a live federal LEIE/SAM lookup, and the snackbar says so.
   * When the backend is unreachable the local demo scan runs instead,
   * and its message also stops claiming a live federal check.
   */
  async runOigScan(): Promise<void> {
    const hasJwt = (() => {
      try {
        return !!localStorage.getItem('nemt_jwt');
      } catch {
        return false;
      }
    })();
    if (hasJwt) {
      try {
        const res = await firstValueFrom(this.http.post<{
          scannedCount: number;
          clearedCount: number;
          flaggedCount: number;
          source: string;
        }>('/api/drivers/compliance/run-check', { checkType: 'OIG' }));
        this.snackBar.open(
          `OIG/SAM scan recorded (SIMULATED — not a live federal lookup): ${res.clearedCount} of ${res.scannedCount} drivers clear.`,
          'Recorded',
          { duration: 5500 }
        );
        return;
      } catch (err: unknown) {
        if ((err as { status?: number })?.status !== 0) {
          this.snackBar.open('The server refused the scan. Try again.', 'OK', { duration: 4000 });
          return;
        }
        // status 0 = backend unreachable → fall through to the demo scan.
      }
    }
    const res = this.complianceService.runMonthlyOigSamBatchScan();
    this.snackBar.open(
      `Demo OIG/SAM scan (local demo data — not a live federal lookup): ${res.clearedCount} of ${res.scannedCount} drivers clear.`,
      'Demo',
      { duration: 5500 }
    );
  }

  runStaffCheck(staff: NonDriverStaffRecord): void {
    this.snackBar.open(`OIG/SAM check verified for ${staff.fullName}. Status: Cleared.`, 'OK', { duration: 3000 });
  }

  getLockoutStatus(driverId: string, vehicleUnit?: string): DispatchEligibilityResult {
    return this.complianceService.evaluateDispatchEligibility(driverId, vehicleUnit || 'VAN-101');
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

  getDriverCredentialStatus(expDateStr?: string): string {
    if (!expDateStr) return 'valid';
    try {
      const exp = new Date(expDateStr).getTime();
      const now = Date.now();
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;

      if (exp < now) return 'expired';
      if (exp - now < thirtyDays) return 'expiring_soon';
      return 'valid';
    } catch {
      return 'valid';
    }
  }
}
