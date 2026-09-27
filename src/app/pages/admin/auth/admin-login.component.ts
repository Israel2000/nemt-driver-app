import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      <!-- Ambient Glow Behind Login Card -->
      <div class="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-32 right-1/4 w-[400px] h-[300px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <!-- Top Branding -->
      <div class="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <a routerLink="/" class="inline-flex items-center gap-2.5 mb-6 group">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <div class="text-left">
            <span class="text-xl font-extrabold tracking-tight text-white block leading-tight">NEMT FleetOS</span>
            <span class="text-[10px] uppercase tracking-widest font-bold text-blue-400">Desktop Dispatch Console</span>
          </div>
        </a>
        <h2 class="text-2xl font-bold text-white tracking-tight">Sign in to your Fleet Workspace</h2>
        <p class="mt-2 text-xs text-slate-400">
          Enter your authorized operator credentials to access real-time dispatch and audit tools.
        </p>
      </div>

      <!-- Login Card Container -->
      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0 z-10">
        <div class="bg-slate-900/90 backdrop-blur-md border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6">
          
          <!-- One-Click Demo Sign In Pill -->
          <div class="p-3.5 rounded-2xl bg-blue-950/60 border border-blue-500/30 flex items-center justify-between gap-3">
            <div class="text-left">
              <span class="text-[10px] font-bold uppercase tracking-wider text-blue-400 block">Fleet Review Mode</span>
              <p class="text-xs text-slate-300 font-medium">Test credentials pre-configured</p>
            </div>
            <button
              type="button"
              (click)="onDemoLogin()"
              class="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition cursor-pointer flex items-center gap-1.5"
            >
              <span>⚡ One-Click Sign In</span>
            </button>
          </div>

          <div class="relative flex py-1 items-center">
            <div class="flex-grow border-t border-slate-800"></div>
            <span class="flex-shrink mx-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">or enter credentials</span>
            <div class="flex-grow border-t border-slate-800"></div>
          </div>

          <!-- Main Login Form -->
          <form (ngSubmit)="onSubmit()" class="space-y-4">
            
            <!-- Work Email -->
            <div class="space-y-1.5">
              <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider">Work Email Address</label>
              <div class="relative">
                <input
                  type="email"
                  name="email"
                  [(ngModel)]="email"
                  required
                  placeholder="dispatcher@metrotransit.com"
                  class="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <!-- Password -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider">Password</label>
                <a href="javascript:void(0)" (click)="onForgotPassword()" class="text-[11px] text-blue-400 hover:underline">Forgot password?</a>
              </div>
              <div class="relative">
                <input
                  type="password"
                  name="password"
                  [(ngModel)]="password"
                  required
                  placeholder="••••••••••••"
                  class="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <!-- Remember Workstation Checkbox -->
            <div class="flex items-center justify-between pt-1">
              <label class="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="rememberMe"
                  [(ngModel)]="rememberMe"
                  class="w-4 h-4 rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span class="text-xs text-slate-400">Remember this workstation</span>
              </label>
              <span class="text-[10px] text-slate-500 font-mono">TLS 256-Bit</span>
            </div>

            <!-- Error Message Alert -->
            @if (errorMessage) {
              <div class="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-medium">
                {{ errorMessage }}
              </div>
            }

            <!-- Submit Button -->
            <button
              type="submit"
              class="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Sign In to Dispatch Console</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
              </svg>
            </button>
          </form>

          <!-- Footer Links: Don't have an account -->
          <div class="pt-4 border-t border-slate-800 text-center space-y-3">
            <p class="text-xs text-slate-400">
              Don't have an account?
              <a routerLink="/admin/signup" class="text-blue-400 font-bold hover:underline ml-1">
                Start 14-day free trial &rarr;
              </a>
            </p>
            <div class="pt-1">
              <a routerLink="/driver/login" class="text-[11px] text-slate-500 hover:text-slate-300 transition">
                Are you a field driver? Switch to Mobile Driver Portal &rarr;
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  `
})
export class AdminLoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = 'admin@nemtos.com';
  password = 'admin';
  rememberMe = true;
  errorMessage = '';

  onSubmit() {
    if (!this.email || !this.email.includes('@')) {
      this.errorMessage = 'Please enter a valid work email address.';
      return;
    }

    const success = this.authService.login(this.email, this.password);
    if (success) {
      this.router.navigate(['/admin/dispatch']);
    } else {
      this.errorMessage = 'Authentication failed. Please verify credentials or use One-Click Sign In.';
    }
  }

  onDemoLogin() {
    this.authService.quickAdminDemoLogin();
    this.router.navigate(['/admin/dispatch']);
  }

  onForgotPassword() {
    alert('Demo Password: "admin" or click "⚡ One-Click Sign In" to access the dispatch console immediately.');
  }
}
