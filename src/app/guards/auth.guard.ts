import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    // Not authenticated, redirect to the admin sign-in page with returnUrl
    return router.createUrlTree(['/admin/login'], {
      queryParams: { returnUrl: state.url }
    });
  }

  // Authenticated: verify administrator clearance for NEMT Operator SaaS
  if (!authService.hasAdminAccess()) {
    return router.createUrlTree(['/access-denied']);
  }

  return true;
};
