import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { TripService } from '../core/services/trip.service';

/**
 * Driver-area guard (frontend demo).
 *
 * A driver reaches the protected driver screens (trips, credentials, vault,
 * DVIR) only after completing the shift flow: driver login -> pre-trip
 * verification. Verification marks the driver session verified + on duty in
 * TripService (persisted to localStorage so a refresh or a new tab keeps the
 * shift — demo storage only, replaced by a real session/token in the backend
 * phase). Anything else is sent back to driver login with a returnUrl.
 */
export const driverGuard: CanActivateFn = (route, state) => {
  const tripService = inject(TripService);
  const router = inject(Router);

  const session = tripService.driverSession();
  const verified = !!session.verifiedAt || session.isOnDuty;

  if (!verified) {
    return router.createUrlTree(['/driver/login'], {
      queryParams: { returnUrl: state.url }
    });
  }

  return true;
};
