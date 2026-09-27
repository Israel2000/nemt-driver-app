import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { TripService } from '../../core/services/trip.service';

@Component({
  selector: 'app-driver-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-slate-100 flex flex-col justify-between font-sans">
      <!-- Top Mobile Status Bar -->
      <header class="bg-slate-900 text-white px-4 py-3 sticky top-0 z-40 shadow-sm">
        <div class="max-w-md mx-auto flex items-center justify-between">
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

      <!-- Dismissible Credential Radar Warning Banner -->
      @if (showCredentialWarning && showBottomNav) {
        <div class="bg-amber-500 text-slate-950 px-4 py-2.5 sticky top-[48px] z-30 shadow-md border-b border-amber-600/30">
          <div class="max-w-md mx-auto flex items-center justify-between gap-2 text-xs">
            <a routerLink="/driver/credentials" class="flex-1 flex items-center gap-2 hover:underline">
              <span class="text-sm">⚠️</span>
              <span class="leading-snug">
                <strong>Attention:</strong> Your CPR Card expires in 12 days. <span class="font-bold underline">Tap here to upload your renewal &rarr;</span>
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

      <!-- Mobile Content Area -->
      <main class="flex-1 max-w-md w-full mx-auto p-4" [ngClass]="showBottomNav ? 'pb-24' : 'pb-8'">
        <router-outlet></router-outlet>
      </main>

      <!-- Bottom Mobile Tab Bar (Visible once in trips or credentials) -->
      @if (showBottomNav) {
        <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 shadow-lg">
          <div class="max-w-md mx-auto grid grid-cols-3 h-16">
            <a routerLink="/driver/trips" routerLinkActive="text-blue-600 font-bold border-t-2 border-blue-600" class="flex flex-col items-center justify-center text-xs text-slate-500 hover:text-blue-600 transition">
              <svg class="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
              <span>My Runs</span>
            </a>
            <a routerLink="/driver/credentials" routerLinkActive="text-blue-600 font-bold border-t-2 border-blue-600" class="flex flex-col items-center justify-center text-xs text-slate-500 hover:text-blue-600 transition">
              <svg class="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>Credentials</span>
            </a>
            <a routerLink="/driver/login" class="flex flex-col items-center justify-center text-xs text-slate-500 hover:text-rose-600 transition">
              <svg class="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
              <span>Shift Exit</span>
            </a>
          </div>
        </nav>
      }
    </div>
  `
})
export class DriverLayoutComponent {
  tripService = inject(TripService);
  private router = inject(Router);

  showCredentialWarning = true;

  dismissCredentialWarning() {
    this.showCredentialWarning = false;
  }

  get showBottomNav(): boolean {
    const url = this.router.url;
    return !url.includes('/driver/login') && !url.includes('/driver/verification');
  }
}
