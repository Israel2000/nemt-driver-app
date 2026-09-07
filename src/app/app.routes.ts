import { Routes } from '@angular/router';

// Layout Shells
import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';

// Public Surface Components
import { HomeComponent } from './pages/home/home.component';
import { DriverApplicationComponent } from './transportations/driver-forms/driver-forms.component';
import { W4UploadComponent } from './transportations/w4-upload/w4-upload.component';
import { DriverVaultComponent } from './transportations/driver-vault/driver-vault.component';
import { DriverDvirComponent } from './transportations/driver-dvir/driver-dvir.component';
import { LoginComponent } from './pages/login/login.component';
import { AccessDeniedComponent } from './pages/access-denied/access-denied.component';

// Authenticated Admin Surface Components
import { ExecutiveOverviewComponent } from './pages/admin/executive-overview/executive-overview.component';
import { CandidateAtsComponent } from './pages/admin/candidate-ats/candidate-ats.component';
import { AuditShieldComponent } from './pages/admin/audit-shield/audit-shield.component';
import { FleetVehiclesComponent } from './pages/admin/fleet-vehicles/fleet-vehicles.component';
import { WorkspaceBillingComponent } from './pages/admin/workspace-billing/workspace-billing.component';

import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  // --- PUBLIC MARKETING & ONBOARDING SURFACE ---
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'driver', component: DriverApplicationComponent },
      { path: 'w4-upload', component: W4UploadComponent },
      { path: 'w-4-upload', redirectTo: 'w4-upload', pathMatch: 'full' },
      { path: 'driver/vault', component: DriverVaultComponent },
      { path: 'driver/dvir', component: DriverDvirComponent },
      { path: 'login', component: LoginComponent },
      { path: 'access-denied', component: AccessDeniedComponent }
    ]
  },

  // --- AUTHENTICATED SAAS ADMIN DASHBOARD ---
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { path: 'overview', component: ExecutiveOverviewComponent },
      { path: 'candidates', component: CandidateAtsComponent },
      { path: 'audit-shield', component: AuditShieldComponent },
      { path: 'fleet', component: FleetVehiclesComponent },
      { path: 'billing', component: WorkspaceBillingComponent }
    ]
  },

  { path: '**', redirectTo: '' }
];
