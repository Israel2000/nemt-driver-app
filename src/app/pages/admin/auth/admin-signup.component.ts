import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      <!-- Ambient Glow Behind Form -->
      <div class="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-32 left-1/4 w-[400px] h-[300px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <!-- Top Branding -->
      <div class="sm:mx-auto sm:w-full sm:max-w-lg text-center z-10">
        <a routerLink="/" class="inline-flex items-center gap-2.5 mb-6 group">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <div class="text-left">
            <span class="text-xl font-extrabold tracking-tight text-white block leading-tight">NEMT FleetOS</span>
            <span class="text-[10px] uppercase tracking-widest font-bold text-blue-400">Medicaid Compliance &amp; Dispatch</span>
          </div>
        </a>
        <h2 class="text-2xl sm:text-3xl font-bold text-white tracking-tight">Create your Fleet Workspace</h2>
        <p class="mt-2 text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
          Start your 14-day zero-risk trial. Deploy dispatch and mobile trip execution in under 15 minutes.
        </p>
      </div>

      <!-- Signup Card Container -->
      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0 z-10">
        <div class="bg-slate-900/90 backdrop-blur-md border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6">
          
          <!-- Trust Badge Header Strip -->
          <div class="grid grid-cols-3 gap-2 py-2 px-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-center text-[10px] text-slate-400 font-medium">
            <span class="flex items-center justify-center gap-1">
              <span class="text-emerald-400">✓</span> 14-Day Free Trial
            </span>
            <span class="flex items-center justify-center gap-1 border-x border-slate-800">
              <span class="text-emerald-400">✓</span> No Credit Card
            </span>
            <span class="flex items-center justify-center gap-1">
              <span class="text-emerald-400">✓</span> Medicaid Ready
            </span>
          </div>

          <!-- Main Signup Form -->
          <form (ngSubmit)="onSubmit()" class="space-y-4">
            
            <!-- Fleet Company Name -->
            <div class="space-y-1.5">
              <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider">Fleet Company Name *</label>
              <input
                type="text"
                name="companyName"
                [(ngModel)]="companyName"
                required
                placeholder="e.g. Metro Care Transit LLC"
                class="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <!-- DOT / Medicaid Provider ID & Fleet Size (2-Column) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- DOT / Medicaid Provider ID -->
              <div class="space-y-1.5">
                <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider">DOT / Medicaid ID</label>
                <input
                  type="text"
                  name="providerId"
                  [(ngModel)]="providerId"
                  placeholder="e.g. CO-88419 or DOT-94820"
                  class="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              <!-- Fleet Size Dropdown -->
              <div class="space-y-1.5">
                <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider">Active Fleet Size *</label>
                <select
                  name="fleetSize"
                  [(ngModel)]="fleetSize"
                  class="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition cursor-pointer"
                >
                  <option value="1-5 vehicles">1–5 Vehicles (Starter)</option>
                  <option value="6-15 vehicles">6–15 Vehicles (Growth)</option>
                  <option value="16-30 vehicles">16–30 Vehicles (Fleet Pro)</option>
                  <option value="30+ vehicles">30+ Vehicles (Enterprise)</option>
                </select>
              </div>
            </div>

            <!-- Work Email -->
            <div class="space-y-1.5">
              <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider">Work Email Address *</label>
              <input
                type="email"
                name="email"
                [(ngModel)]="email"
                required
                placeholder="director@metrocare.example"
                class="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <!-- Password -->
            <div class="space-y-1.5">
              <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider">Create Master Password *</label>
              <input
                type="password"
                name="password"
                [(ngModel)]="password"
                required
                placeholder="At least 8 characters"
                class="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <!-- Error Message Alert -->
            @if (errorMessage) {
              <div class="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-medium">
                {{ errorMessage }}
              </div>
            }

            <!-- CTA Submit Button -->
            <div class="pt-2">
              <button
                type="submit"
                class="w-full py-4 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Create Fleet Workspace &amp; Start Free Trial</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                </svg>
              </button>
            </div>
          </form>

          <!-- Footer Links: Already have an account -->
          <div class="pt-4 border-t border-slate-800 text-center space-y-3">
            <p class="text-xs text-slate-400">
              Already have a fleet workspace?
              <a routerLink="/admin/login" class="text-blue-400 font-bold hover:underline ml-1">
                Sign in to console &rarr;
              </a>
            </p>
            <p class="text-[11px] text-slate-500">
              By creating a workspace, you agree to HIPAA compliance protocols and terms of service.
            </p>
          </div>

        </div>
      </div>
    </div>
  `
})
export class AdminSignupComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  companyName = '';
  providerId = '';
  fleetSize = '6-15 vehicles';
  email = '';
  password = '';
  errorMessage = '';

  onSubmit() {
    if (!this.companyName.trim()) {
      this.errorMessage = 'Please enter your Fleet Company Name.';
      return;
    }

    if (!this.email.trim() || !this.email.includes('@')) {
      this.errorMessage = 'Please enter a valid work email address.';
      return;
    }

    if (!this.password || this.password.length < 4) {
      this.errorMessage = 'Password must be at least 4 characters.';
      return;
    }

    // Register account and immediately sign in
    const success = this.authService.register(
      this.companyName.trim(),
      this.email.trim(),
      this.fleetSize,
      'growth',
      'admin'
    );

    if (success) {
      this.router.navigate(['/admin/dispatch']);
    } else {
      this.errorMessage = 'Could not create workspace. Please check your information and try again.';
    }
  }
}
