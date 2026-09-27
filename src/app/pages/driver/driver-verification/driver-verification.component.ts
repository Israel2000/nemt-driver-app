import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TripService } from '../../../core/services/trip.service';

@Component({
  selector: 'app-driver-verification',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="space-y-5 max-w-sm mx-auto pt-1">
      <!-- Top Title & Driver Session Pill -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-slate-900">Pre-Trip Verification</h1>
          <p class="text-xs text-slate-500">Daily DVIR Safety & Readiness Protocol</p>
        </div>
        <div class="text-right">
          <span class="text-xs font-bold text-blue-600 block">
            {{ tripService.driverSession().vehicleNumber }}
          </span>
          <span class="text-[10px] text-slate-400">
            {{ tripService.driverSession().driverName }}
          </span>
        </div>
      </div>

      <!-- Verification Form -->
      <form (ngSubmit)="onCompleteVerification()" class="space-y-4">
        <!-- Step 1: Starting Odometer Input -->
        <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              <span>1. Starting Odometer (Miles)</span>
            </label>
            <span class="text-[10px] font-semibold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">REQUIRED</span>
          </div>
          
          <div class="relative">
            <input
              type="number"
              [(ngModel)]="odometer"
              name="odometer"
              required
              min="1"
              placeholder="e.g. 124580"
              class="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-300 text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <span class="absolute inset-y-0 right-0 pr-4 flex items-center text-xs font-bold text-slate-400 pointer-events-none">
              MILES
            </span>
          </div>
          <p class="text-[11px] text-slate-500">Logged for Medicaid transit billing verification.</p>
        </div>

        <!-- Step 2: Safety Checklist -->
        <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
          <div class="flex items-center justify-between">
            <label class="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>2. Daily Safety Inspection</span>
            </label>
            <button
              type="button"
              (click)="selectAllChecks()"
              class="text-[11px] font-bold text-blue-600 hover:underline"
            >
              Check All
            </button>
          </div>

          <div class="space-y-2.5 text-xs text-slate-700">
            <!-- Item 1 -->
            <label class="flex items-start gap-3 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition cursor-pointer"
                   [ngClass]="checkLicense ? 'bg-emerald-50/50 border-emerald-200' : ''">
              <input
                type="checkbox"
                [(ngModel)]="checkLicense"
                name="checkLicense"
                class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 mt-0.5"
              />
              <span class="font-medium">Valid Commercial/State Driver's License in physical possession</span>
            </label>

            <!-- Item 2 -->
            <label class="flex items-start gap-3 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition cursor-pointer"
                   [ngClass]="checkLift ? 'bg-emerald-50/50 border-emerald-200' : ''">
              <input
                type="checkbox"
                [(ngModel)]="checkLift"
                name="checkLift"
                class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 mt-0.5"
              />
              <span class="font-medium">Wheelchair lift, ramps, and 4-point tie-downs inspected & operational</span>
            </label>

            <!-- Item 3 -->
            <label class="flex items-start gap-3 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition cursor-pointer"
                   [ngClass]="checkKit ? 'bg-emerald-50/50 border-emerald-200' : ''">
              <input
                type="checkbox"
                [(ngModel)]="checkKit"
                name="checkKit"
                class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 mt-0.5"
              />
              <span class="font-medium">First Aid kit, bloodborne pathogen clean-up, & fire extinguisher present</span>
            </label>

            <!-- Item 4 -->
            <label class="flex items-start gap-3 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition cursor-pointer"
                   [ngClass]="checkTires ? 'bg-emerald-50/50 border-emerald-200' : ''">
              <input
                type="checkbox"
                [(ngModel)]="checkTires"
                name="checkTires"
                class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 mt-0.5"
              />
              <span class="font-medium">Vehicle mirrors, brake lights, turn indicators, & tire tread inspected</span>
            </label>
          </div>
        </div>

        <!-- Step 3: Legal Readiness Attestation -->
        <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-2">
          <label class="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              [(ngModel)]="isCertified"
              name="isCertified"
              class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 mt-0.5"
            />
            <span class="text-xs text-slate-700 leading-relaxed font-semibold">
              I certify that this vehicle is safe and I am legally fit, alert, and drug-free to transport medical passengers today.
            </span>
          </label>
        </div>

        <!-- Error Alert if incomplete -->
        @if (validationError) {
          <div class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
            {{ validationError }}
          </div>
        }

        <!-- Submit Button -->
        <div class="pt-1">
          <button
            type="submit"
            [disabled]="!canSubmit"
            class="w-full py-4 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            [ngClass]="canSubmit ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 cursor-pointer' : 'bg-slate-300 cursor-not-allowed text-slate-500'"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            <span>Complete Verification & Go On-Duty</span>
          </button>
        </div>
      </form>

      <!-- Back to login link -->
      <div class="text-center">
        <a routerLink="/driver/login" class="text-xs font-semibold text-slate-500 hover:text-slate-700">
          &larr; Switch Vehicle or Sign Out
        </a>
      </div>
    </div>
  `
})
export class DriverVerificationComponent {
  private router = inject(Router);
  tripService = inject(TripService);

  odometer: number = 124580;
  checkLicense = true;
  checkLift = true;
  checkKit = true;
  checkTires = true;
  isCertified = true;
  validationError = '';

  get canSubmit(): boolean {
    return !!(
      this.odometer &&
      this.odometer > 0 &&
      this.checkLicense &&
      this.checkLift &&
      this.checkKit &&
      this.checkTires &&
      this.isCertified
    );
  }

  selectAllChecks(): void {
    this.checkLicense = true;
    this.checkLift = true;
    this.checkKit = true;
    this.checkTires = true;
    this.isCertified = true;
  }

  onCompleteVerification(): void {
    if (!this.canSubmit) {
      this.validationError = 'Please complete all inspection checkboxes and enter your starting odometer.';
      return;
    }

    this.validationError = '';
    const nowTimestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Mark driver as verified and ON DUTY in reactive state
    this.tripService.setDriverSession({
      startingOdometer: this.odometer,
      isOnDuty: true,
      verifiedAt: nowTimestamp
    });

    // Navigate to active runs view
    this.router.navigate(['/driver/trips']);
  }
}
