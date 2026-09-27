import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TripService } from '../../../core/services/trip.service';

@Component({
  selector: 'app-driver-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="space-y-6 max-w-sm mx-auto pt-2">
      <!-- App Header Badge -->
      <div class="text-center space-y-2">
        <div class="w-14 h-14 mx-auto rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
          </svg>
        </div>
        <h1 class="text-xl font-bold text-slate-900 tracking-tight">Driver Shift Sign-In</h1>
        <p class="text-xs text-slate-500">FleetOS Mobile Operations & Trip Stepper</p>
      </div>

      <!-- Main Login Card -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
        <!-- Error Message Banner -->
        @if (errorMessage) {
          <div class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
            <svg class="w-4 h-4 text-rose-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>{{ errorMessage }}</span>
          </div>
        }

        <form (ngSubmit)="onSignIn()" class="space-y-4">
          <!-- Driver ID / Phone -->
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Driver ID or Mobile Phone
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
              </div>
              <input
                type="text"
                [(ngModel)]="driverId"
                name="driverId"
                required
                placeholder="e.g. DRV-1 or (303) 555-0192"
                class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <!-- 4-Digit PIN -->
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              4-Digit Driver Security PIN
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
              </div>
              <input
                [type]="showPin ? 'text' : 'password'"
                [(ngModel)]="pin"
                name="pin"
                maxlength="6"
                required
                placeholder="••••"
                class="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                (click)="showPin = !showPin"
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Assigned Vehicle Selector -->
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Assigned Vehicle For Shift
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                </svg>
              </div>
              <select
                [(ngModel)]="selectedVehicle"
                name="selectedVehicle"
                required
                class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Van #4">Van #4 (Wheelchair Accessible Ramp)</option>
                <option value="Van #8">Van #8 (High-Roof Hydraulic Lift)</option>
                <option value="Wheelchair Transit 2">Wheelchair Transit 2</option>
                <option value="Sedan #1">Sedan #1 (Ambulatory Only)</option>
              </select>
            </div>
          </div>

          <!-- Submit Button -->
          <div class="pt-2">
            <button
              type="submit"
              class="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Sign In to Shift</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
              </svg>
            </button>
          </div>
        </form>

        <!-- Demo Quick Sign-in Button -->
        <div class="pt-2 border-t border-slate-100">
          <button
            type="button"
            (click)="quickDemoLogin()"
            class="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition flex items-center justify-center gap-1.5"
          >
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Demo 1-Click: Marcus Vance (Van #4)</span>
          </button>
        </div>
      </div>

      <!-- Footer Help Support -->
      <div class="text-center space-y-2">
        <p class="text-xs text-slate-500">
          Need dispatch assistance?
          <a href="tel:18005550199" class="text-blue-600 font-bold hover:underline">
            Call Dispatcher (24/7)
          </a>
        </p>
        <p class="text-[11px] text-slate-400">
          FleetOS Driver v2.4 • HIPAA & Medicaid Compliant
        </p>
      </div>
    </div>
  `
})
export class DriverLoginComponent {
  private router = inject(Router);
  private tripService = inject(TripService);

  driverId = 'DRV-1';
  pin = '1234';
  selectedVehicle = 'Van #4';
  showPin = false;
  errorMessage = '';

  onSignIn(): void {
    if (!this.driverId.trim()) {
      this.errorMessage = 'Please enter your Driver ID or registered phone number.';
      return;
    }
    if (!this.pin || this.pin.length < 4) {
      this.errorMessage = 'Please enter your 4-digit security PIN.';
      return;
    }

    this.errorMessage = '';
    // Save driver session into shared reactive TripService
    this.tripService.setDriverSession({
      driverId: this.driverId.trim(),
      driverName: this.driverId.toUpperCase() === 'DRV-1' ? 'Marcus Vance' : 'Marcus Vance',
      vehicleNumber: this.selectedVehicle,
      isOnDuty: false
    });

    // Advance to mandatory pre-trip inspection verification
    this.router.navigate(['/driver/verification']);
  }

  quickDemoLogin(): void {
    this.driverId = 'DRV-1';
    this.pin = '1234';
    this.selectedVehicle = 'Van #4';
    this.onSignIn();
  }
}
