import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';

import { AuthService, User, CompanyWorkspace } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'driver-app';
  currentUser: User | null = null;
  currentWorkspace: CompanyWorkspace | null = null;
  isAuthenticated = false;
  isAdmin = false;
  isSaaSRoute = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.updateRouteStatus(this.router.url);

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.updateRouteStatus(event.urlAfterRedirects || event.url);
    });
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isAdmin = this.authService.hasAdminAccess();
    });

    this.authService.currentWorkspace$.subscribe(ws => {
      this.currentWorkspace = ws;
    });

    this.authService.isAuthenticated$.subscribe(auth => {
      this.isAuthenticated = auth;
      this.isAdmin = this.authService.hasAdminAccess();
    });
  }

  private updateRouteStatus(url: string): void {
    this.isSaaSRoute = !!url && (url.startsWith('/admin') || url.includes('/admin'));
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
