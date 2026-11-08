import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TripService, DQF_ID_BY_SESSION_ID } from '../../../core/services/trip.service';
import { ComplianceService } from '../../../services/compliance.service';

/**
 * Driver Credentials — now reads the driver's real DQF file
 * (ComplianceService) instead of hardcoded cards, so expiry alerts here
 * match what dispatch sees in the lockout engine. The driver-session id
 * (DRV-1) maps to the DQF roster id (DRV-101); see DQF_ID_BY_SESSION_ID.
 */
@Component({
  selector: 'app-driver-credentials',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-bold text-slate-900">Driver Credentials</h1>
        <span class="px-2 py-0.5 rounded-full text-xs font-bold"
              [ngClass]="overallExpired() ? 'bg-rose-100 text-rose-800' : overallWarning() ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'">
          {{ overallExpired() ? 'Action needed' : overallWarning() ? 'Expiring soon' : 'Compliant' }}
        </span>
      </div>

      @if (dqf) {
        <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">MV</div>
            <div>
              <h2 class="text-sm font-bold text-slate-900">{{ dqf.fullName }}</h2>
              <p class="text-xs text-slate-500">ID: {{ dqf.driverId }} • Assigned: {{ dqf.assignedVehicleUnit }} • {{ dqf.employmentType }}</p>
            </div>
          </div>
          @if (expiringSoon().length > 0) {
            <div class="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800">
              ⚠ Expiring soon: {{ expiringSoon().join(', ') }} — upload your renewal in the Vault before dispatch locks you out.
            </div>
          }
          @if (expired().length > 0) {
            <div class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800">
              ⛔ Expired: {{ expired().join(', ') }} — you cannot be dispatched until these are renewed.
            </div>
          }
        </div>

        <div class="space-y-3">
          @for (cred of credentials(); track cred.name) {
            <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
              <div class="space-y-1">
                <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">{{ cred.name }}</span>
                <p class="text-sm font-bold text-slate-800">{{ cred.detail }}</p>
                <p class="text-xs text-slate-500">Expires: {{ cred.expires }}</p>
              </div>
              <span class="text-xs font-bold px-2.5 py-1 rounded-full"
                    [ngClass]="cred.status === 'expired' ? 'bg-rose-100 text-rose-800' : cred.status === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'">
                {{ cred.status === 'expired' ? 'Expired' : cred.status === 'warning' ? cred.daysLeft + ' days left' : 'Verified' }}
              </span>
            </div>
          }
        </div>
      } @else {
        <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-sm text-slate-600">
          No qualification file found for this driver yet. Ask dispatch to create your DQF file.
        </div>
      }

      <a routerLink="/driver/dvir" class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between hover:border-blue-400 hover:shadow-md transition block">
        <div class="space-y-1">
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Daily Pre-Trip DVIR</span>
          <p class="text-sm font-bold text-slate-800">Van #4 Inspection</p>
          <p class="text-xs text-slate-500">Completed today 07:45 AM — tap to run a new inspection</p>
        </div>
        <span class="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">Passed →</span>
      </a>

      <!-- Document vault + shift actions -->
      <div class="grid grid-cols-2 gap-3">
        <a routerLink="/driver/vault" class="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-4 shadow-sm transition block">
          <p class="text-xs font-bold uppercase tracking-wider text-blue-200">My DQF Vault</p>
          <p class="text-sm font-bold mt-1">Documents &amp; renewals →</p>
        </a>
        <a routerLink="/driver/trips" class="bg-white hover:bg-slate-50 text-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 transition block">
          <p class="text-xs font-bold uppercase tracking-wider text-slate-400">My Runs</p>
          <p class="text-sm font-bold mt-1">Back to trips →</p>
        </a>
      </div>

      <button type="button" (click)="endShift()"
        class="w-full py-3 rounded-xl bg-white hover:bg-rose-50 text-rose-600 font-bold text-sm border border-slate-200 hover:border-rose-300 shadow-sm transition cursor-pointer">
        End Shift &amp; Sign Out
      </button>
    </div>
  `
})
export class DriverCredentialsComponent {
  private tripService = inject(TripService);
  private compliance = inject(ComplianceService);
  private router = inject(Router);

  get dqf() {
    const sessionId = this.tripService.driverSession().driverId;
    const dqfId = DQF_ID_BY_SESSION_ID[sessionId] ?? sessionId;
    return this.compliance.getDQFById(dqfId);
  }

  private daysLeft(dateStr: string): number {
    const exp = new Date(dateStr);
    if (isNaN(exp.getTime())) return 999;
    return Math.ceil((exp.getTime() - Date.now()) / 86400000);
  }

  private statusOf(dateStr: string): 'valid' | 'warning' | 'expired' {
    const d = this.daysLeft(dateStr);
    if (d < 0) return 'expired';
    if (d <= 30) return 'warning';
    return 'valid';
  }

  private fmt(dateStr: string): string {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  }

  credentials(): { name: string; detail: string; expires: string; status: 'valid' | 'warning' | 'expired'; daysLeft: number }[] {
    const d = this.dqf;
    if (!d) return [];
    return [
      { name: 'Driver License', detail: `CO ${d.license.licenseClass} #${d.license.licenseNumber}`, expires: this.fmt(d.license.expirationDate), status: this.statusOf(d.license.expirationDate), daysLeft: this.daysLeft(d.license.expirationDate) },
      { name: 'DOT Medical Card', detail: `${d.medicalFitness.certificateType} — ${d.medicalFitness.examinerName}`, expires: this.fmt(d.medicalFitness.expirationDate), status: this.statusOf(d.medicalFitness.expirationDate), daysLeft: this.daysLeft(d.medicalFitness.expirationDate) },
      { name: 'First Aid / CPR', detail: `${d.certifications.cprFirstAid.credentialName} — ${d.certifications.cprFirstAid.issuer}`, expires: this.fmt(d.certifications.cprFirstAid.expirationDate), status: this.statusOf(d.certifications.cprFirstAid.expirationDate), daysLeft: this.daysLeft(d.certifications.cprFirstAid.expirationDate) },
      { name: 'PASS / CTAA', detail: `${d.certifications.passOrCtaa.credentialName} — ${d.certifications.passOrCtaa.issuer}`, expires: this.fmt(d.certifications.passOrCtaa.expirationDate), status: this.statusOf(d.certifications.passOrCtaa.expirationDate), daysLeft: this.daysLeft(d.certifications.passOrCtaa.expirationDate) },
      { name: 'Defensive Driving', detail: `${d.certifications.defensiveDriving.credentialName}`, expires: this.fmt(d.certifications.defensiveDriving.expirationDate), status: this.statusOf(d.certifications.defensiveDriving.expirationDate), daysLeft: this.daysLeft(d.certifications.defensiveDriving.expirationDate) },
    ];
  }

  expiringSoon(): string[] {
    return this.credentials().filter(c => c.status === 'warning').map(c => `${c.name} (${c.daysLeft}d)`);
  }

  expired(): string[] {
    return this.credentials().filter(c => c.status === 'expired').map(c => c.name);
  }

  overallWarning(): boolean {
    return this.expiringSoon().length > 0;
  }

  overallExpired(): boolean {
    return this.expired().length > 0;
  }

  endShift(): void {
    this.tripService.endShift();
    this.router.navigate(['/driver/login']);
  }
}
