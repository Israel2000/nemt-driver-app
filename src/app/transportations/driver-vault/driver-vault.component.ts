import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule } from '@angular/material/dialog';

import { ComplianceService } from '../../services/compliance.service';
import { DQFRecord, DispatchEligibilityResult } from '../../models/compliance.model';

@Component({
  selector: 'app-driver-vault',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatDividerModule,
    MatDialogModule
  ],
  templateUrl: './driver-vault.component.html',
  styleUrls: ['./driver-vault.component.css']
})
export class DriverVaultComponent implements OnInit {
  drivers: DQFRecord[] = [];
  selectedDriverId = 'DRV-101';
  currentRecord: DQFRecord | null = null;
  dispatchEligibility: DispatchEligibilityResult | null = null;

  // Renewal Modal State
  showRenewModal = false;
  renewCredentialType: 'cpr' | 'license' | 'medical' | 'pass' | 'defensive' = 'cpr';
  renewTitle = 'Renew CPR / First Aid Card';
  newExpirationDate = '';
  selectedFileName = '';
  isUploading = false;

  constructor(
    private complianceService: ComplianceService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.complianceService.dqfRecords$.subscribe(records => {
      this.drivers = records;
      this.loadSelectedDriver();
    });
  }

  onDriverChange(): void {
    this.loadSelectedDriver();
  }

  loadSelectedDriver(): void {
    const found = this.complianceService.getDQFById(this.selectedDriverId);
    this.currentRecord = found || (this.drivers.length > 0 ? this.drivers[0] : null);

    if (this.currentRecord) {
      this.selectedDriverId = this.currentRecord.driverId;
      const assignedUnit = this.currentRecord.assignedVehicleUnit || 'VAN-101';
      this.dispatchEligibility = this.complianceService.evaluateDispatchEligibility(
        this.currentRecord.driverId,
        assignedUnit
      );
    }
  }

  getDaysRemaining(dateStr?: string): number {
    if (!dateStr) return 0;
    const exp = new Date(dateStr).getTime();
    const now = new Date().getTime();
    return Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
  }

  getDaysRemainingText(dateStr?: string): string {
    const days = this.getDaysRemaining(dateStr);
    if (days < 0) return `Expired ${Math.abs(days)} days ago`;
    if (days === 0) return 'Expires today';
    return `${days} days remaining`;
  }

  openRenewModal(type: 'cpr' | 'license' | 'medical' | 'pass' | 'defensive'): void {
    this.renewCredentialType = type;
    this.selectedFileName = '';
    this.newExpirationDate = '';

    switch (type) {
      case 'cpr':
        this.renewTitle = 'Renew CPR & First Aid Card';
        break;
      case 'license':
        this.renewTitle = 'Upload Renewed State Driver License';
        break;
      case 'medical':
        this.renewTitle = 'Upload New DOT Medical Examiner Certificate (MCSA-5876)';
        break;
      case 'pass':
        this.renewTitle = 'Upload PASS 7.0 Passenger Assistance Certificate';
        break;
      case 'defensive':
        this.renewTitle = 'Upload Defensive Driving Course Certificate';
        break;
    }

    this.showRenewModal = true;
  }

  closeRenewModal(): void {
    this.showRenewModal = false;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFileName = input.files[0].name;
    }
  }

  submitRenewal(): void {
    if (!this.newExpirationDate) {
      this.snackBar.open('Please select the new expiration date', 'Close', { duration: 3000 });
      return;
    }

    this.isUploading = true;
    setTimeout(() => {
      const fileName = this.selectedFileName || `${this.renewCredentialType}_renewed_${Date.now()}.pdf`;
      this.complianceService.renewCredential(
        this.selectedDriverId,
        this.renewCredentialType,
        this.newExpirationDate,
        fileName
      );

      this.isUploading = false;
      this.showRenewModal = false;
      this.snackBar.open('Document verified and DQF file updated successfully!', 'Great', {
        duration: 4000
      });
      this.loadSelectedDriver();
    }, 600);
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
}
