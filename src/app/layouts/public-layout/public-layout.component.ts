import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { PublicNavbarComponent } from './components/public-navbar/public-navbar.component';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, PublicNavbarComponent],
  template: `
    <div class="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <!-- Public Marketing Navbar (Strictly business-facing) -->
      <app-public-navbar></app-public-navbar>

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
