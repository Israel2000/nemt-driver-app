import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { PublicNavbarComponent } from './components/public-navbar/public-navbar.component';
import { PublicFooterComponent } from './components/public-footer/public-footer.component';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RouterOutlet,
    PublicNavbarComponent,
    PublicFooterComponent
  ],
  template: `
    <div class="public-layout min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <!-- Public Marketing Navbar (Strictly business-facing) -->
      <app-public-navbar></app-public-navbar>

      <!-- Sticky Start Free Trial bar — lives in the layout, NOT in the navbar.
           Sticks under the navbar while scrolling so the trial CTA is always
           one tap away on every marketing page. -->
      <div class="sticky-trial-bar">
        <div class="sticky-trial-inner">
          <span class="sticky-trial-text">14-day free trial &middot; No setup fees &middot; No hardware to install</span>
          <a routerLink="/admin/signup" class="sticky-trial-btn">Start Free Trial <span aria-hidden="true">&rarr;</span></a>
        </div>
      </div>

      <!-- Main Page Surface -->
      <main class="flex-1">
        <router-outlet></router-outlet>
      </main>

      <!-- Enterprise SaaS Footer -->
      <app-public-footer></app-public-footer>
    </div>
  `
})
export class PublicLayoutComponent {}
