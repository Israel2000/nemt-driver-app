import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <!-- Top Marketing Navigation Bar -->
      <header class="sticky top-0 z-50 w-full bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <!-- Logo & Brand -->
          <a routerLink="/" class="flex items-center gap-2.5 text-blue-600 font-bold text-xl tracking-tight">
            <div class="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            </div>
            <span>NEMT <span class="text-slate-900 font-extrabold">FleetOS</span></span>
          </a>

          <!-- Middle Navigation Links -->
          <nav class="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a routerLink="/" routerLinkActive="text-blue-600 font-semibold" [routerLinkActiveOptions]="{ exact: true }" class="hover:text-blue-600 transition-colors">
              Home
            </a>
            <a routerLink="/driver" routerLinkActive="text-blue-600 font-semibold" class="hover:text-blue-600 transition-colors flex items-center gap-1.5">
              <span>Driver Application</span>
              <span class="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 rounded-full border border-blue-200">Apply</span>
            </a>
            <a routerLink="/w4-upload" routerLinkActive="text-blue-600 font-semibold" class="hover:text-blue-600 transition-colors">
              W-4 Upload
            </a>
          </nav>

          <!-- Right Action & Sign In CTAs -->
          <div class="flex items-center gap-3">
            <a routerLink="/admin" class="text-sm font-semibold text-slate-700 hover:text-blue-600 px-3.5 py-2 transition-colors">
              Sign In
            </a>
            <a routerLink="/admin" class="text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm transition-all shadow-blue-500/20">
              Start Free Trial
            </a>
          </div>

        </div>
      </header>

      <!-- Main Page Surface -->
      <main class="flex-1">
        <router-outlet></router-outlet>
      </main>

      <!-- Clean Public Footer -->
      <footer class="bg-white border-t border-slate-200 py-8 text-center text-xs text-slate-500">
        <p>&copy; 2026 NEMT FleetOS. Digital Driver Onboarding & Medicaid Audit Shield. All rights reserved.</p>
      </footer>
    </div>
  `
})
export class PublicLayoutComponent {}
