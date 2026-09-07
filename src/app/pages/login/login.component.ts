import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatRadioModule } from '@angular/material/radio';

import { AuthService, SubscriptionTier, UserRole } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatSelectModule,
    MatSnackBarModule,
    MatRadioModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  selectedTabIndex = 0;
  returnUrl = '/admin';

  // Login form
  loginEmail = '';
  loginPassword = '';
  hidePassword = true;

  // Register form
  regFullName = '';
  regCompanyName = '';
  regEmail = '';
  regPassword = '';
  regRole: UserRole = 'admin';
  regFleetSize = '6-20 vehicles';
  regPlan: SubscriptionTier = 'growth';

  fleetSizes = [
    '1-5 vehicles (Small Fleet)',
    '6-20 vehicles (Growing Fleet)',
    '21-50 vehicles (Mid-Size)',
    '50+ vehicles (Enterprise)'
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/admin';

    // If already logged in, redirect immediately based on role
    if (this.authService.isAuthenticated()) {
      if (this.authService.hasAdminAccess()) {
        this.router.navigateByUrl(this.returnUrl);
      } else {
        this.router.navigateByUrl('/access-denied');
      }
    }
  }

  onLogin(): void {
    if (!this.loginEmail) {
      this.snackBar.open('Please enter your email address.', 'Close', { duration: 3000 });
      return;
    }

    const success = this.authService.login(this.loginEmail, this.loginPassword);
    if (success) {
      if (this.authService.hasAdminAccess()) {
        this.snackBar.open('Welcome Administrator! Access granted to NEMT SaaS OS.', 'Great', { duration: 2500 });
        this.router.navigateByUrl(this.returnUrl);
      } else {
        this.snackBar.open('Signed in as standard user (Non-Admin). Directing to status page...', 'Notice', { duration: 3000 });
        this.router.navigateByUrl('/access-denied');
      }
    } else {
      this.snackBar.open('Please enter a valid email address.', 'Close', { duration: 3000 });
    }
  }

  onRegister(): void {
    if (!this.regCompanyName || !this.regEmail) {
      this.snackBar.open('Please provide your company name and email address.', 'Close', { duration: 3500 });
      return;
    }

    const success = this.authService.registerAccount(
      this.regCompanyName,
      this.regEmail,
      this.regPassword || 'password123',
      this.regRole,
      this.regFullName,
      this.regFleetSize,
      this.regPlan
    );

    if (success) {
      this.snackBar.open(`Account created for ${this.regEmail}! Please sign in to access the portal.`, 'OK', {
        duration: 5000
      });

      // Pre-fill email and password in login tab
      this.loginEmail = this.regEmail;
      this.loginPassword = this.regPassword;

      // Switch to Login Tab!
      this.selectedTabIndex = 0;
    }
  }

  quickAdminDemoLogin(): void {
    this.authService.quickAdminDemoLogin();
    this.snackBar.open('Signed in as Fleet Administrator (Full SaaS Access).', 'OK', {
      duration: 3000
    });
    this.router.navigateByUrl(this.returnUrl);
  }

  quickUserDemoLogin(): void {
    this.authService.quickUserDemoLogin();
    this.snackBar.open('Signed in as Standard Driver / Staff (Non-Admin).', 'OK', {
      duration: 3000
    });
    this.router.navigateByUrl('/access-denied');
  }

  quickDemoLogin(): void {
    this.quickAdminDemoLogin();
  }
}
