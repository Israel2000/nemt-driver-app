import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

// Angular Material
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService, CompanyWorkspace, User } from '../../../services/auth.service';
import { BillingService, Claim, Cms1500View } from '../../../services/billing.service';

@Component({
  selector: 'app-workspace-billing',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './workspace-billing.component.html',
  styleUrls: ['./workspace-billing.component.css']
})
export class WorkspaceBillingComponent implements OnInit {
  currentWorkspace: CompanyWorkspace | null = null;
  currentUser: User | null = null;
  hardLockoutActive = true;

  /** Structured CMS-1500 data for the claim being inspected (server only). */
  cms1500View: Cms1500View | null = null;
  cms1500For: string | null = null;

  constructor(
    private authService: AuthService,
    private snackBar: MatSnackBar,
    public billingService: BillingService
  ) {}

  claims(): Claim[] {
    return this.billingService.claims();
  }

  serverMode(): boolean {
    return this.billingService.serverMode();
  }

  async submitClaim(claim: Claim): Promise<void> {
    try {
      await this.billingService.submitClaim(claim);
      this.snackBar.open(`Claim ${claim.claimNumber} submitted.`, 'OK', { duration: 3000 });
    } catch {
      this.snackBar.open('Could not submit the claim (server refused it).', 'OK', { duration: 4000 });
    }
  }

  async markPaidClaim(claim: Claim): Promise<void> {
    try {
      await this.billingService.markPaid(claim);
      this.snackBar.open(`Claim ${claim.claimNumber} marked paid.`, 'OK', { duration: 3000 });
    } catch {
      this.snackBar.open('Could not mark the claim paid (server refused it).', 'OK', { duration: 4000 });
    }
  }

  async markDeniedClaim(claim: Claim): Promise<void> {
    const reason = window.prompt('Denial reason:', 'Missing documentation');
    if (reason === null) {
      return;
    }
    try {
      await this.billingService.markDenied(claim, reason || 'No reason given');
      this.snackBar.open(`Claim ${claim.claimNumber} marked denied.`, 'OK', { duration: 3000 });
    } catch {
      this.snackBar.open('Could not deny the claim (server refused it).', 'OK', { duration: 4000 });
    }
  }

  async viewCms1500(claim: Claim): Promise<void> {
    if (this.cms1500For === claim.claimNumber) {
      this.cms1500View = null;
      this.cms1500For = null;
      return;
    }
    const view = await this.billingService.fetchCms1500(claim);
    if (view) {
      this.cms1500View = view;
      this.cms1500For = claim.claimNumber;
    } else {
      this.snackBar.open('CMS-1500 data is only available when the backend is connected.', 'OK', { duration: 4000 });
    }
  }

  ngOnInit(): void {
    this.authService.currentWorkspace$.subscribe(ws => {
      this.currentWorkspace = ws;
    });

    this.authService.currentUser$.subscribe(u => {
      this.currentUser = u;
    });
  }

  toggleLockoutRule(): void {
    this.hardLockoutActive = !this.hardLockoutActive;
    const msg = this.hardLockoutActive
      ? 'Hard Dispatch Lockout is ACTIVE. Drivers with expired credentials will be blocked from trips.'
      : 'Warning: Hard Dispatch Lockout disabled. Non-compliant trips will not be automatically blocked.';
    this.snackBar.open(msg, 'OK', { duration: 4000 });
  }

  manageSubscription(): void {
    this.snackBar.open('Subscription portal: Customer billing settings open in Stripe Customer Portal.', 'Close', { duration: 3500 });
  }
}
