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
