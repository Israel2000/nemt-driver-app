import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { TripService, DQF_ID_BY_SESSION_ID } from '../../core/services/trip.service';
import { ComplianceService } from '../../services/compliance.service';

@Component({
  selector: 'app-driver-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-slate-100 flex flex-col justify-between font-sans">
      <!-- Top Mobile Status Bar -->
      <header class="bg-slate-900 text-white px-4 py-3 sticky top-0 z-40 shadow-sm">
        <div class="mx-auto flex items-center justify-between" [ngClass]="isWide ? 'max-w-5xl' : 'max-w-md'">
          <div class="flex items-center gap-2">
            @if (tripService.driverSession().isOnDuty) {
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span class="text-xs font-semibold tracking-wide">
                {{ tripService.driverSession().vehicleNumber }} • {{ tripService.driverSession().driverName }}
              </span>
            } @else {
              <span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span class="text-xs font-semibold tracking-wide">
                {{ tripService.driverSession().vehicleNumber }} • Shift Setup
              </span>
            }
          </div>

          @if (tripService.driverSession().isOnDuty) {
            <span class="text-[10px] bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
              ON DUTY
            </span>
          } @else {
            <span class="text-[10px] bg-amber-900/60 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium">
              PRE-SHIFT
            </span>
          }
        </div>
      </header>

      <!-- Dismissible Credential Radar Warning Banner (real DQF dates, not hardcoded) -->
      @if (showCredentialWarning && showBottomNav && !isWide && cprDaysLeft() !== null && cprDaysLeft()! <= 30) {
        <div class="bg-amber-500 text-slate-950 px-4 py-2.5 sticky top-[48px] z-30 shadow-md border-b border-amber-600/30">
          <div class="max-w-md mx-auto flex items-center justify-between gap-2 text-xs">
            <a routerLink="/driver/credentials" class="flex-1 flex items-center gap-2 hover:underline">
              <span class="text-sm">⚠️</span>
              <span class="leading-snug">
                <strong>Attention:</strong> Your CPR Card {{ cprDaysLeft()! < 0 ? 'expired ' + (-cprDaysLeft()!) + ' days ago' : 'expires in ' + cprDaysLeft() + ' days' }}. <span class="font-bold underline">Tap here to upload your renewal &rarr;</span>
              </span>
            </a>
            <button
              type="button"
              (click)="dismissCredentialWarning()"
              class="w-6 h-6 rounded-full hover:bg-amber-600/40 flex items-center justify-center text-slate-950 font-bold text-xs cursor-pointer transition shrink-0"
              title="Dismiss warning"
            >
              ✕
            </button>
          </div>
        </div>
      }

      <!-- Content Area: narrow phone shell for trips/credentials, wide for vault/DVIR -->
      <main class="flex-1 w-full mx-auto p-4" [ngClass]="[isWide ? 'max-w-5xl' : 'max-w-md', showBottomNav ? 'pb-24' : 'pb-8']">
        <router-outlet></router-outlet>
      </main>

      <!-- Bottom Tab Bar (Visible once past login/verification) -->
      @if (showBottomNav) {
        <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 shadow-lg">
          <div class="mx-auto grid grid-cols-5 h-16" [ngClass]="isWide ? 'max-w-5xl' : 'max-w-md'">
            <a routerLink="/driver/trips" routerLinkActive="text-blue-600 font-bold border-t-2 border-blue-600" class="flex flex-col items-center justify-center text-xs text-slate-500 hover:text-blue-600 transition">
              <svg class="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
              <span>My Runs</span>
            </a>
            <a routerLink="/driver/vault" routerLinkActive="text-blue-600 font-bold border-t-2 border-blue-600" class="flex flex-col items-center justify-center text-xs text-slate-500 hover:text-blue-600 transition">
              <svg class="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v12a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
              </svg>
              <span>Vault</span>
            </a>
            <a routerLink="/driver/dvir" routerLinkActive="text-blue-600 font-bold border-t-2 border-blue-600" class="flex flex-col items-center justify-center text-xs text-slate-500 hover:text-blue-600 transition">
              <svg class="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
              <span>DVIR</span>
            </a>
            <a routerLink="/driver/credentials" routerLinkActive="text-blue-600 font-bold border-t-2 border-blue-600" class="flex flex-col items-center justify-center text-xs text-slate-500 hover:text-blue-600 transition">
              <svg class="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>Credentials</span>
            </a>
            <button type="button" (click)="endShift()" class="flex flex-col items-center justify-center text-xs text-slate-500 hover:text-rose-600 transition cursor-pointer">
              <svg class="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
              <span>Shift Exit</span>
            </button>
          </div>
        </nav>
      }
    </div>
  `
})
export class DriverLayoutComponent {
  tripService = inject(TripService);
  private compliance = inject(ComplianceService);
  private router = inject(Router);

  showCredentialWarning = true;

  /** Days until the signed-in driver's CPR card expires (DQF file). */
  cprDaysLeft(): number | null {
    const sessionId = this.tripService.driverSession().driverId;
    const dqf = this.compliance.getDQFById(DQF_ID_BY_SESSION_ID[sessionId] ?? sessionId);
    if (!dqf) return null;
    const exp = new Date(dqf.certifications.cprFirstAid.expirationDate);
    if (isNaN(exp.getTime())) return null;
    return Math.ceil((exp.getTime() - Date.now()) / 86400000);
  }

  dismissCredentialWarning() {
    this.showCredentialWarning = false;
  }

  get showBottomNav(): boolean {
    const url = this.router.url;
    return !url.includes('/driver/login') && !url.includes('/driver/verification');
  }

  /**
   * Vault and DVIR are wide desktop-style screens (tables, forms) — they get
   * the full-width shell. Trips / credentials stay in the narrow phone shell.
   */
  get isWide(): boolean {
    const url = this.router.url;
    return url.includes('/driver/vault') || url.includes('/driver/dvir');
  }

  /** End the shift for real (clears the verified driver session), then sign in again. */
  endShift(): void {
    this.tripService.endShift();
    this.showCredentialWarning = true;
    this.router.navigate(['/driver/login']);
  }
}
