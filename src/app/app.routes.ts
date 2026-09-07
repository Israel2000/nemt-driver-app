import { Routes } from '@angular/router';
import { MarketingHomeComponent } from './pages/marketing-home/marketing-home.component';
import { LoginComponent } from './pages/login/login.component';
import { DriverFormsComponent } from './transportations/driver-forms/driver-forms.component';
import { W4UploadComponent } from './transportations/w4-upload/w4-upload.component';
import { DriverVaultComponent } from './transportations/driver-vault/driver-vault.component';
import { DriverDvirComponent } from './transportations/driver-dvir/driver-dvir.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { AccessDeniedComponent } from './pages/access-denied/access-denied.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: MarketingHomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'driver', component: DriverFormsComponent },
  { path: 'driver/vault', component: DriverVaultComponent },
  { path: 'driver/dvir', component: DriverDvirComponent },
  { path: 'w4-upload', component: W4UploadComponent },
  { path: 'w-4-upload', redirectTo: 'w4-upload', pathMatch: 'full' },
  { path: 'admin', component: AdminDashboardComponent, canActivate: [authGuard] },
  { path: 'access-denied', component: AccessDeniedComponent },
  { path: '**', redirectTo: '' }
];

