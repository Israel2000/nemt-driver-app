import { Injectable, signal, computed, inject } from '@angular/core';
import { Trip, TripStatus, TripStatusEvent, WheelchairSecurement, haversineMiles, etaMinutesForMiles } from '../models/trip.model';
import { SyncService } from './sync.service';

/**
 * TripService — the ONE shared trip record for driver and dispatch.
 *
 * Driver taps and dispatch actions both go through here, so a status change
 * on the driver screen shows up on the dispatch board in the same tab
 * (signals), in another tab (localStorage + BroadcastChannel/storage
 * events), and after a refresh (trips persist to localStorage). This is the
 * frontend stand-in for the backend's single trip record + WebSocket sync;
 * the backend phase swaps persistence + broadcast for API calls, the
 * component code stays the same.
 *
 * GPS: captured with the Geolocation API on every status transition
 * (best-effort, 5s timeout). If the browser denies GPS or it times out, the
 * event is stamped with the stop's known coordinates and gpsSource
 * 'estimated' — never silently faked as a live fix. True background GPS
 * (tracking while the tab is backgrounded) is NOT possible in a browser and
 * is not claimed here; live position updates only while the driver tab is
 * open, and the UI says so.
 */

export interface GpsFix {
  lat: number;
  lng: number;
  source: 'device' | 'estimated' | 'unavailable';
}

const TRIPS_KEY = 'nemt_trips';
const SEED_VERSION_KEY = 'nemt_trips_seed_version';
const SEED_VERSION = '2';

const SEED_TRIPS: Trip[] = [
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
    driverId: 'DRV-101',
    driverName: 'Marcus Vance',
    vehicleNumber: 'Van #4',
    startOdometer: 124568,
    endOdometer: 124579,
    completedAt: '08:42 AM',
    signeeType: 'patient',
    signeeName: 'Robert Chen',
    signatureDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="120" viewBox="0 0 300 120"><path d="M 20 70 Q 60 20 100 60 T 180 50 T 260 80" stroke="%231e40af" stroke-width="3" fill="none" stroke-linecap="round"/><text x="180" y="105" font-family="sans-serif" font-size="12" fill="%2364748b">Digital Verification</text></svg>',
    driverSignatureDataUrl: '',
    driverSignatureName: 'Marcus Vance',
    billable: true,
    lifecycleTimestamps: {
      scheduled: '08:00 AM',
      enRoute: '08:05 AM',
      arrivedPickup: '08:18 AM',
      boarded: '08:24 AM',
      completed: '08:42 AM'
    },
    statusEvents: [],
    pickupGps: { lat: 39.7340, lng: -104.9975, at: '08:18 AM', source: 'estimated' },
    dropoffGps: { lat: 39.7301, lng: -104.8900, at: '08:42 AM', source: 'estimated' },
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
    driverId: 'DRV-101',
    driverName: 'Marcus Vance',
    vehicleNumber: 'Van #4',
    startOdometer: 124580,
    lifecycleTimestamps: {
      scheduled: '09:00 AM',
      enRoute: '09:12 AM'
    },
    statusEvents: [],
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
    driverId: 'DRV-101',
    driverName: 'Marcus Vance',
    vehicleNumber: 'Van #4',
    startOdometer: 124595,
    lifecycleTimestamps: {
      scheduled: '10:00 AM'
    },
    statusEvents: [],
    currentLat: 39.7282,
    currentLng: -104.9930
  }
];

/** Map the driver-session id (DRV-1) to the DQF roster id (DRV-101). */
export const DQF_ID_BY_SESSION_ID: Record<string, string> = {
  'DRV-1': 'DRV-101',
  'DRV-101': 'DRV-101',
  'DRV-2': 'DRV-102',
  'DRV-102': 'DRV-102',
};

@Injectable({
  providedIn: 'root'
})
export class TripService {
  private sync = inject(SyncService);

  private tripsSignal = signal<Trip[]>(this.loadTrips());

  readonly trips = this.tripsSignal.asReadonly();
  readonly activeDriverTrips = computed(() =>
    this.tripsSignal().filter(t => t.status !== 'completed' && t.status !== 'cancelled' && t.status !== 'no_show')
  );
  readonly completedTrips = computed(() =>
    this.tripsSignal().filter(t => t.status === 'completed' || t.status === 'no_show' || t.status === 'cancelled')
  );
  /** Board counts by status, for the dispatch live board. */
  readonly tripsByStatus = computed(() => {
    const counts: Record<string, number> = {
      scheduled: 0, en_route_pickup: 0, arrived_pickup: 0, in_transit: 0,
      completed: 0, cancelled: 0, no_show: 0, delayed: 0,
    };
    for (const t of this.tripsSignal()) counts[t.status] = (counts[t.status] ?? 0) + 1;
    return counts;
  });

  // Demo driver-session persistence (localStorage, same pattern as the rest of
  // this frontend-only build). Keeps a shift alive across a page refresh or a
  // new tab — e.g. opening the DQF Vault / DVIR from the admin console.
  // Replaced by a real server session/token in the backend phase.
  private readonly DRIVER_SESSION_KEY = 'nemt_driver_session';

  private readonly defaultDriverSession = {
    driverId: 'DRV-1',
    driverName: 'Marcus Vance',
    vehicleNumber: 'Van #4',
    startingOdometer: 124580,
    isOnDuty: false,
    verifiedAt: null as string | null
  };

  readonly driverSession = signal({ ...this.defaultDriverSession });

  constructor() {
    try {
      const stored = localStorage.getItem(this.DRIVER_SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.driverSession.set({ ...this.defaultDriverSession, ...parsed });
      }
    } catch {
      // Corrupt stored session: fall back to the default (signed-out) state.
    }
    // Cross-tab sync: another tab persisted trips → re-read them.
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === TRIPS_KEY) this.tripsSignal.set(this.loadTrips());
      });
    }
  }

  private loadTrips(): Trip[] {
    try {
      const version = localStorage.getItem(SEED_VERSION_KEY);
      const raw = localStorage.getItem(TRIPS_KEY);
      if (raw && version === SEED_VERSION) {
        const parsed = JSON.parse(raw) as Trip[];
        return parsed.length ? parsed : this.seedTrips();
      }
      return this.seedTrips();
    } catch {
      return this.seedTrips();
    }
  }

  private seedTrips(): Trip[] {
    const copy = SEED_TRIPS.map(t => ({
      ...t,
      lifecycleTimestamps: { ...t.lifecycleTimestamps },
      statusEvents: [...(t.statusEvents ?? [])],
    }));
    try {
      localStorage.setItem(TRIPS_KEY, JSON.stringify(copy));
      localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
    } catch { /* ignore */ }
    return copy;
  }

  private persist(trips: Trip[]): void {
    try {
      localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
    } catch { /* ignore */ }
    this.sync.notifyTripsChanged();
  }

  /** True once the driver has completed login + pre-trip verification. */
  isDriverVerified(): boolean {
    const s = this.driverSession();
    return !!s.verifiedAt || s.isOnDuty;
  }

  /** End the shift: clear the verified/on-duty state (and stored session). */
  endShift(): void {
    try {
      localStorage.removeItem(this.DRIVER_SESSION_KEY);
    } catch {
      // Storage unavailable: in-memory reset below is enough for this tab.
    }
    this.driverSession.set({ ...this.defaultDriverSession });
  }

  setDriverSession(session: Partial<{
    driverId: string;
    driverName: string;
    vehicleNumber: string;
    startingOdometer: number;
    isOnDuty: boolean;
    verifiedAt: string | null;
  }>) {
    this.driverSession.update(s => {
      const next = { ...s, ...session };
      try {
        localStorage.setItem(this.DRIVER_SESSION_KEY, JSON.stringify(next));
      } catch {
        // Storage unavailable (private mode, etc.): keep in-memory state only.
      }
      return next;
    });
    // Also update any active trips to match the assigned vehicle/driver if changed
    if (session.vehicleNumber || session.driverName) {
      this.tripsSignal.update(trips =>
        trips.map(t => ({
          ...t,
          driverName: session.driverName || t.driverName,
          vehicleNumber: session.vehicleNumber || t.vehicleNumber
        }))
      );
      this.persist(this.tripsSignal());
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
      },
      statusEvents: tripData.statusEvents ?? [],
    };
    this.tripsSignal.update(trips => [newTrip, ...trips]);
    this.persist(this.tripsSignal());
    this.sync.recordEvent({
      kind: 'assignment',
      tripId: newTrip.id,
      tripLabel: `${newTrip.patientName} (${newTrip.id})`,
      summary: `Dispatch created trip ${newTrip.id} — ${newTrip.patientName}, ${newTrip.mobility}`,
      by: 'dispatch',
      byName: 'Dispatch',
    });
    return newTrip;
  }

  /** Dispatch reassigns a trip to another driver/vehicle (manifest re-sequences live). */
  assignTrip(tripId: string, driverId: string | undefined, driverName: string | undefined, vehicleNumber: string | undefined): void {
    const trip = this.tripsSignal().find(t => t.id === tripId);
    if (!trip) return;
    this.tripsSignal.update(trips =>
      trips.map(t => (t.id === tripId ? { ...t, driverId, driverName, vehicleNumber } : t))
    );
    this.persist(this.tripsSignal());
    this.sync.recordEvent({
      kind: 'assignment',
      tripId,
      tripLabel: `${trip.patientName} (${tripId})`,
      summary: driverName
        ? `Dispatch reassigned ${tripId} to ${driverName} (${vehicleNumber || 'no vehicle'})`
        : `Dispatch unassigned ${tripId} — back in the unassigned queue`,
      by: 'dispatch',
      byName: 'Dispatch',
    });
  }

  /** Best-effort live GPS fix; falls back to the stop's known coordinates. */
  captureGps(fallbackLat?: number, fallbackLng?: number): Promise<GpsFix> {
    return new Promise((resolve) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        resolve(fallbackLat !== undefined && fallbackLng !== undefined
          ? { lat: fallbackLat, lng: fallbackLng, source: 'estimated' }
          : { lat: 39.7392, lng: -104.9903, source: 'unavailable' });
        return;
      }
      let done = false;
      const finish = (fix: GpsFix) => {
        if (!done) { done = true; resolve(fix); }
      };
      navigator.geolocation.getCurrentPosition(
        (pos) => finish({ lat: pos.coords.latitude, lng: pos.coords.longitude, source: 'device' }),
        () => finish(fallbackLat !== undefined && fallbackLng !== undefined
          ? { lat: fallbackLat, lng: fallbackLng, source: 'estimated' }
          : { lat: 39.7392, lng: -104.9903, source: 'unavailable' }),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 30000 }
      );
      setTimeout(() => finish(fallbackLat !== undefined && fallbackLng !== undefined
        ? { lat: fallbackLat, lng: fallbackLng, source: 'estimated' }
        : { lat: 39.7392, lng: -104.9903, source: 'unavailable' }), 5500);
    });
  }

  /** RouteGenie proximity gate: distance from a fix to the pickup stop. */
  distanceToPickupMiles(trip: Trip, fix: GpsFix): number | null {
    if (trip.pickupLat === undefined || trip.pickupLng === undefined) return null;
    return haversineMiles(fix.lat, fix.lng, trip.pickupLat, trip.pickupLng);
  }

  /**
   * The core status transition. Captures GPS, stamps the lifecycle time,
   * appends a GPS-stamped status event (audit trail), records the sync
   * event (queued when offline), persists, and broadcasts to other tabs.
   * Callers pass a pre-captured fix when they already have one (e.g. the
   * Arrived gate); otherwise a fix is captured here.
   */
  async updateTripStatus(
    tripId: string,
    status: TripStatus,
    metadata?: Partial<Trip> & { reasonCode?: string; reasonNote?: string; by?: 'driver' | 'dispatch'; byName?: string; fix?: GpsFix }
  ): Promise<void> {
    const trip = this.tripsSignal().find(t => t.id === tripId);
    if (!trip) return;
    const by = metadata?.by ?? 'driver';
    const byName = metadata?.byName ?? (by === 'driver' ? (this.driverSession().driverName || 'Driver') : 'Dispatch');
    const timeNow = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const isoNow = new Date().toISOString();
    const fix = metadata?.fix ?? await this.captureGps(
      status === 'arrived_pickup' || status === 'en_route_pickup' ? trip.pickupLat : trip.dropoffLat,
      status === 'arrived_pickup' || status === 'en_route_pickup' ? trip.pickupLng : trip.dropoffLng
    );

    const timestamps = { ...trip.lifecycleTimestamps };
    if (status === 'en_route_pickup' && !timestamps.enRoute) timestamps.enRoute = timeNow;
    if (status === 'arrived_pickup' && !timestamps.arrivedPickup) timestamps.arrivedPickup = timeNow;
    if (status === 'in_transit' && !timestamps.boarded) timestamps.boarded = timeNow;
    if (status === 'completed' && !timestamps.completed) timestamps.completed = timeNow;

    const event: TripStatusEvent = {
      status,
      at: timeNow,
      atIso: isoNow,
      lat: fix.lat,
      lng: fix.lng,
      gpsSource: fix.source,
      by,
      byName,
      reasonCode: metadata?.reasonCode,
      reasonNote: metadata?.reasonNote,
    };

    const { reasonCode, reasonNote, by: _by, byName: _byName, fix: _fix, ...restMeta } = metadata ?? {};
    const billable = status === 'completed'
      ? !!((restMeta.endOdometer ?? trip.endOdometer) && (restMeta.signatureDataUrl ?? trip.signatureDataUrl))
      : trip.billable;

    this.tripsSignal.update(trips =>
      trips.map(t => {
        if (t.id !== tripId) return t;
        return {
          ...t,
          status,
          lifecycleTimestamps: timestamps,
          completedAt: status === 'completed' ? (restMeta.completedAt || timeNow) : t.completedAt,
          statusEvents: [...(t.statusEvents ?? []), event],
          statusReasonCode: reasonCode ?? (status === 'no_show' || status === 'cancelled' || status === 'delayed' ? t.statusReasonCode : undefined),
          statusReasonNote: reasonNote ?? t.statusReasonNote,
          pickupGps: status === 'arrived_pickup'
            ? { lat: fix.lat, lng: fix.lng, at: timeNow, source: fix.source }
            : t.pickupGps,
          dropoffGps: status === 'completed'
            ? { lat: fix.lat, lng: fix.lng, at: timeNow, source: fix.source }
            : t.dropoffGps,
          currentLat: fix.lat,
          currentLng: fix.lng,
          billable,
          ...restMeta,
        };
      })
    );
    this.persist(this.tripsSignal());

    const label = SyncService.statusLabel(status);
    const reason = reasonCode ? ` — ${reasonCode}${reasonNote ? `: ${reasonNote}` : ''}` : '';
    this.sync.recordEvent({
      kind: status === 'no_show' || status === 'cancelled' || status === 'delayed' ? 'exception' : 'status',
      tripId,
      tripLabel: `${trip.patientName} (${tripId})`,
      summary: `${byName} → ${label} on ${tripId}${reason} · GPS ${fix.lat.toFixed(4)}, ${fix.lng.toFixed(4)} (${fix.source})`,
      by,
      byName,
      lat: fix.lat,
      lng: fix.lng,
      gpsSource: fix.source,
    });
  }

  /** Record wheelchair securement for a leg (before Boarded). */
  saveSecurement(tripId: string, securement: WheelchairSecurement): void {
    const trip = this.tripsSignal().find(t => t.id === tripId);
    if (!trip) return;
    const timeNow = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const done: WheelchairSecurement = { ...securement, completedAt: timeNow, completedBy: this.driverSession().driverName };
    this.tripsSignal.update(trips =>
      trips.map(t => (t.id === tripId ? { ...t, wheelchairSecurement: done } : t))
    );
    this.persist(this.tripsSignal());
    this.sync.recordEvent({
      kind: 'securement',
      tripId,
      tripLabel: `${trip.patientName} (${tripId})`,
      summary: `Wheelchair securement completed on ${tripId} — 4-point tie-downs, brakes set, lap + shoulder belt`,
      by: 'driver',
      byName: this.driverSession().driverName,
    });
  }

  /** Minutes from the driver's current position to a stop (30 mph estimate). */
  etaMinutes(trip: Trip, toDropoff: boolean): number | null {
    const fromLat = trip.currentLat ?? trip.pickupLat;
    const fromLng = trip.currentLng ?? trip.pickupLng;
    const toLat = toDropoff ? trip.dropoffLat : trip.pickupLat;
    const toLng = toDropoff ? trip.dropoffLng : trip.pickupLng;
    if (fromLat === undefined || fromLng === undefined || toLat === undefined || toLng === undefined) return null;
    return etaMinutesForMiles(haversineMiles(fromLat, fromLng, toLat, toLng));
  }

  /** "How late" in minutes vs the scheduled time (for late-first sorting). */
  minutesLate(trip: Trip): number {
    const m = trip.scheduledTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!m) return 0;
    let h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    if (/pm/i.test(m[3]) && h !== 12) h += 12;
    if (/am/i.test(m[3]) && h === 12) h = 0;
    const scheduled = new Date();
    scheduled.setHours(h, min, 0, 0);
    const diff = (Date.now() - scheduled.getTime()) / 60000;
    return diff > 0 ? Math.round(diff) : 0;
  }
}
