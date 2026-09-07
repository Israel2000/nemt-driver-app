import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService, CompanyWorkspace, User } from '../../../services/auth.service';

@Component({
  selector: 'app-workspace-billing',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatSnackBarModule
  ],
  templateUrl: './workspace-billing.component.html',
  styleUrls: ['./workspace-billing.component.css']
})
export class WorkspaceBillingComponent implements OnInit {
  currentWorkspace: CompanyWorkspace | null = null;
  currentUser: User | null = null;
  hardLockoutActive = true;

  constructor(
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

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
