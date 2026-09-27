import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { DriverLayoutComponent } from './layouts/driver-layout/driver-layout.component';

export const routes: Routes = [
  // Public Marketing Surface
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
      { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
      { path: 'apply', loadComponent: () => import('./transportations/driver-forms/driver-forms.component').then(m => m.DriverApplicationComponent) },
      { path: 'w4-upload', loadComponent: () => import('./transportations/w4-upload/w4-upload.component').then(m => m.W4UploadComponent) },
      { path: 'access-denied', loadComponent: () => import('./pages/access-denied/access-denied.component').then(m => m.AccessDeniedComponent) }
    ]
  },

  // Standalone Admin Auth Pages
  {
    path: 'admin/login',
    loadComponent: () => import('./pages/admin/auth/admin-login.component').then(m => m.AdminLoginComponent)
  },
  {
    path: 'admin/signup',
    loadComponent: () => import('./pages/admin/auth/admin-signup.component').then(m => m.AdminSignupComponent)
  },

  // Desktop Admin & Dispatch Operations
  {
    path: 'admin',
    component: AdminLayoutComponent,
    children: [
      { path: '', redirectTo: 'dispatch', pathMatch: 'full' },
      { path: 'dispatch', loadComponent: () => import('./pages/admin/dispatch-console/dispatch-console.component').then(m => m.DispatchConsoleComponent) },
      { path: 'overview', loadComponent: () => import('./pages/admin/executive-overview/executive-overview.component').then(m => m.ExecutiveOverviewComponent) },
      { path: 'candidates', loadComponent: () => import('./pages/admin/candidate-ats/candidate-ats.component').then(m => m.CandidateAtsComponent) },
      { path: 'audit-shield', loadComponent: () => import('./pages/admin/audit-shield/audit-shield.component').then(m => m.AuditShieldComponent) },
      { path: 'fleet', loadComponent: () => import('./pages/admin/fleet-vehicles/fleet-vehicles.component').then(m => m.FleetVehiclesComponent) },
      { path: 'billing', loadComponent: () => import('./pages/admin/workspace-billing/workspace-billing.component').then(m => m.WorkspaceBillingComponent) }
    ]
  },

  // Mobile Driver Experience
  {
    path: 'driver',
    component: DriverLayoutComponent,
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { path: 'login', loadComponent: () => import('./pages/driver/driver-login/driver-login.component').then(m => m.DriverLoginComponent) },
      { path: 'verification', loadComponent: () => import('./pages/driver/driver-verification/driver-verification.component').then(m => m.DriverVerificationComponent) },
      { path: 'trips', loadComponent: () => import('./pages/driver/driver-runs/driver-runs.component').then(m => m.DriverRunsComponent) },
      { path: 'credentials', loadComponent: () => import('./pages/driver/driver-credentials/driver-credentials.component').then(m => m.DriverCredentialsComponent) }
    ]
  },

  { path: '**', redirectTo: '' }
];
