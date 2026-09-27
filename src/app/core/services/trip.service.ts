import { Injectable, signal, computed } from '@angular/core';
import { Trip, TripStatus } from '../models/trip.model';

@Injectable({
  providedIn: 'root'
})
export class TripService {
  private tripsSignal = signal<Trip[]>([
    {
      id: 'TRP-100',
      patientName: 'Robert Chen',
      patientPhone: '(303) 555-0199',
      mobility: 'ambulatory',
      pickupAddress: '1000 Speer Blvd, Denver, CO',
      pickupLat: 39.7340,
      pickupLng: -104.9975,
      dropoffAddress: '8300 E 9th Ave, Denver, CO',
      dropoffLat: 39.7301,
      dropoffLng: -104.8900,
      scheduledTime: '08:00 AM',
      status: 'completed',
      driverId: 'DRV-1',
      driverName: 'Marcus Vance',
      vehicleNumber: 'Van #4',
      startOdometer: 124568,
      endOdometer: 124579,
      completedAt: '08:42 AM',
      signeeType: 'patient',
      signeeName: 'Robert Chen',
      signatureDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="120" viewBox="0 0 300 120"><path d="M 20 70 Q 60 20 100 60 T 180 50 T 260 80" stroke="%231e40af" stroke-width="3" fill="none" stroke-linecap="round"/><text x="180" y="105" font-family="sans-serif" font-size="12" fill="%2364748b">Digital Verification</text></svg>',
      lifecycleTimestamps: {
        scheduled: '08:00 AM',
        enRoute: '08:05 AM',
        arrivedPickup: '08:18 AM',
        boarded: '08:24 AM',
        completed: '08:42 AM'
      },
      currentLat: 39.7392,
      currentLng: -104.9903
    },
    {
      id: 'TRP-101',
      patientName: 'Eleanor Vance',
      patientPhone: '(720) 555-0142',
      mobility: 'wheelchair',
      pickupAddress: '500 E Hampden Ave, Englewood, CO',
      pickupLat: 39.6536,
      pickupLng: -104.9878,
      dropoffAddress: '1420 S Pearl St, Denver, CO',
      dropoffLat: 39.6912,
      dropoffLng: -104.9801,
      scheduledTime: '09:30 AM',
      status: 'en_route_pickup',
      driverId: 'DRV-1',
      driverName: 'Marcus Vance',
      vehicleNumber: 'Van #4',
      startOdometer: 124580,
      lifecycleTimestamps: {
        scheduled: '09:00 AM',
        enRoute: '09:12 AM'
      },
      currentLat: 39.6536,
      currentLng: -104.9878
    },
    {
      id: 'TRP-102',
      patientName: 'James Miller',
      patientPhone: '(303) 555-0187',
      mobility: 'ambulatory',
      pickupAddress: '700 Delaware St, Denver, CO',
      pickupLat: 39.7282,
      pickupLng: -104.9930,
      dropoffAddress: '1601 E 19th Ave, Denver, CO',
      dropoffLat: 39.7465,
      dropoffLng: -104.9664,
      scheduledTime: '10:15 AM',
      status: 'scheduled',
      driverId: 'DRV-1',
      driverName: 'Marcus Vance',
      vehicleNumber: 'Van #4',
      startOdometer: 124595,
      lifecycleTimestamps: {
        scheduled: '10:00 AM'
      },
      currentLat: 39.7282,
      currentLng: -104.9930
    }
  ]);

  readonly trips = this.tripsSignal.asReadonly();
  readonly activeDriverTrips = computed(() => 
    this.tripsSignal().filter(t => t.status !== 'completed' && t.status !== 'cancelled')
  );

  readonly driverSession = signal({
    driverId: 'DRV-1',
    driverName: 'Marcus Vance',
    vehicleNumber: 'Van #4',
    startingOdometer: 124580,
    isOnDuty: false,
    verifiedAt: null as string | null
  });

  setDriverSession(session: Partial<{
    driverId: string;
    driverName: string;
    vehicleNumber: string;
    startingOdometer: number;
    isOnDuty: boolean;
    verifiedAt: string | null;
  }>) {
    this.driverSession.update(s => ({ ...s, ...session }));
    // Also update any active trips to match the assigned vehicle/driver if changed
    if (session.vehicleNumber || session.driverName) {
      this.tripsSignal.update(trips =>
        trips.map(t => ({
          ...t,
          driverName: session.driverName || t.driverName,
          vehicleNumber: session.vehicleNumber || t.vehicleNumber
        }))
      );
    }
  }

  addTrip(tripData: Omit<Trip, 'id'> & { id?: string }): Trip {
    const nextId = tripData.id || `TRP-${Math.floor(103 + Math.random() * 896)}`;
    const newTrip: Trip = {
      ...tripData,
      id: nextId,
      status: tripData.status || 'scheduled',
      lifecycleTimestamps: tripData.lifecycleTimestamps || {
        scheduled: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      }
    };
    this.tripsSignal.update(trips => [newTrip, ...trips]);
    return newTrip;
  }

  updateTripStatus(tripId: string, status: TripStatus, metadata?: Partial<Trip>) {
    const timeNow = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    this.tripsSignal.update(trips =>
      trips.map(t => {
        if (t.id !== tripId) return t;

        const timestamps = { ...t.lifecycleTimestamps };
        if (status === 'en_route_pickup' && !timestamps.enRoute) timestamps.enRoute = timeNow;
        if (status === 'arrived_pickup' && !timestamps.arrivedPickup) timestamps.arrivedPickup = timeNow;
        if (status === 'in_transit' && !timestamps.boarded) timestamps.boarded = timeNow;
        if (status === 'completed' && !timestamps.completed) timestamps.completed = timeNow;

        return {
          ...t,
          status,
          lifecycleTimestamps: timestamps,
          completedAt: status === 'completed' ? (metadata?.completedAt || timeNow) : t.completedAt,
          ...metadata
        };
      })
    );
  }
}
