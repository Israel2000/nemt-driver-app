import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Trip, TripStatus, TripStatusEvent, WheelchairSecurement, haversineMiles, etaMinutesForMiles } from '../models/trip.model';
import { SyncService } from './sync.service';

/** Wire shape of a trip as returned by GET /api/trips (Phase 2 backend). */
interface ServerTrip {
  id: string;
  code: string;
  riderName: string;
  patientPhone?: string | null;
  mobility: string;
  pickupAddress: string;
  pickupLat?: number | null;
  pickupLng?: number | null;
  dropoffAddress: string;
  dropoffLat?: number | null;
  dropoffLng?: number | null;
  scheduledAt?: string | null;
  status: string;
  frontendStatus: TripStatus;
  driverId?: string | null;
  driverName?: string | null;
  vehicleNumber?: string | null;
  wheelchair: boolean;
  odometerStart?: number | null;
  odometerEnd?: number | null;
  passengerSignature: boolean;
  driverSignature: boolean;
  billable: boolean;
  signeeName?: string | null;
  signeeType?: 'patient' | 'facility_staff' | null;
  completedAt?: string | null;
  currentLat?: number | null;
  currentLng?: number | null;
  securement?: {
    positioned: boolean; tieDownFrontLeft: boolean; tieDownFrontRight: boolean;
    tieDownRearLeft: boolean; tieDownRearRight: boolean; brakesSet: boolean;
    lapBelt: boolean; shoulderBelt: boolean; complete: boolean;
    completedBy?: string | null; completedAt?: string | null;
  } | null;
}

interface ServerTripEvent {
  status: string;
  frontendStatus: TripStatus;
  lat?: number | null;
  lng?: number | null;
  gpsSource: 'device' | 'estimated' | 'unavailable';
  byRole?: string | null;
  byName?: string | null;
  reasonCode?: string | null;
  reasonNote?: string | null;
  createdAt: string;
}

function toDisplayTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

/** "09:30 AM" → an ISO timestamp for today (the server takes scheduledAt). */
function scheduledTimeToIso(scheduledTime: string | undefined): string | undefined {
  if (!scheduledTime) return undefined;
  const m = scheduledTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return undefined;
  let h = parseInt(m[1], 10);
  if (/pm/i.test(m[3]) && h !== 12) h += 12;
  if (/am/i.test(m[3]) && h === 12) h = 0;
  const d = new Date();
  d.setHours(h, parseInt(m[2], 10), 0, 0);
  return d.toISOString();
}

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
  private http = inject(HttpClient);

  /** Phase 2 API base (dev proxy → :8080; unreachable on Vercel → local mode). */
  private readonly API_URL = '/api/trips';
  /** null = unknown yet; true once any API call succeeds; false after a network error. */
  private apiReachable: boolean | null = null;

  private hasJwt(): boolean {
    try {
      return !!localStorage.getItem('nemt_jwt');
    } catch {
      return false;
    }
  }

  private markApiResult(ok: boolean): void {
    this.apiReachable = ok;
  }

  /** Map a server trip onto the frontend Trip model (id stays the TRP- code). */
  private mapServerTrip(s: ServerTrip, events: ServerTripEvent[] = []): Trip {
    const statusEvents: TripStatusEvent[] = events.map(e => ({
      status: e.frontendStatus,
      at: toDisplayTime(e.createdAt),
      atIso: e.createdAt,
      lat: e.lat ?? undefined,
      lng: e.lng ?? undefined,
      gpsSource: e.gpsSource,
      by: e.byRole === 'driver' ? 'driver' : 'dispatch',
      byName: e.byName ?? undefined,
      reasonCode: e.reasonCode ?? undefined,
      reasonNote: e.reasonNote ?? undefined,
    }));
    const arrived = statusEvents.find(e => e.status === 'arrived_pickup');
    const completed = statusEvents.find(e => e.status === 'completed');
    return {
      id: s.code,
      patientName: s.riderName,
      patientPhone: s.patientPhone ?? undefined,
      mobility: (s.mobility as Trip['mobility']) || 'ambulatory',
      pickupAddress: s.pickupAddress,
      pickupLat: s.pickupLat ?? undefined,
      pickupLng: s.pickupLng ?? undefined,
      dropoffAddress: s.dropoffAddress,
      dropoffLat: s.dropoffLat ?? undefined,
      dropoffLng: s.dropoffLng ?? undefined,
      scheduledTime: s.scheduledAt ? toDisplayTime(s.scheduledAt) : '08:00 AM',
      status: s.frontendStatus,
      driverId: s.driverId ?? undefined,
      driverName: s.driverName ?? undefined,
      vehicleNumber: s.vehicleNumber ?? undefined,
      startOdometer: s.odometerStart ?? undefined,
      endOdometer: s.odometerEnd ?? undefined,
      signatureDataUrl: undefined,
      driverSignatureDataUrl: undefined,
      driverSignatureName: undefined,
      completedAt: s.completedAt ? toDisplayTime(s.completedAt) : undefined,
      signeeType: s.signeeType ?? undefined,
      signeeName: undefined,
      lifecycleTimestamps: {},
      statusEvents,
      pickupGps: arrived?.lat !== undefined && arrived?.lng !== undefined
        ? { lat: arrived.lat, lng: arrived.lng, at: arrived.at, source: arrived.gpsSource }
        : undefined,
      dropoffGps: completed?.lat !== undefined && completed?.lng !== undefined
        ? { lat: completed.lat, lng: completed.lng, at: completed.at, source: completed.gpsSource }
        : undefined,
      wheelchairSecurement: s.securement
        ? {
            positioned: s.securement.positioned,
            tieDownFrontLeft: s.securement.tieDownFrontLeft,
            tieDownFrontRight: s.securement.tieDownFrontRight,
            tieDownRearLeft: s.securement.tieDownRearLeft,
            tieDownRearRight: s.securement.tieDownRearRight,
            brakesSet: s.securement.brakesSet,
            lapBelt: s.securement.lapBelt,
            shoulderBelt: s.securement.shoulderBelt,
            completedAt: s.securement.completedAt ? toDisplayTime(s.securement.completedAt) : undefined,
            completedBy: s.securement.completedBy ?? undefined,
          }
        : undefined,
      billable: s.billable,
      currentLat: s.currentLat ?? s.pickupLat ?? undefined,
      currentLng: s.currentLng ?? s.pickupLng ?? undefined,
    };
  }

  /**
   * Pull the server trip list (when a backend is reachable) and make it the
   * signal's content; localStorage stays as the offline/demo cache. Called
   * once at startup when a JWT exists, and again on reconnect. If the API
   * is unreachable the local trips stay exactly as they are.
   */
  async refreshFromServer(): Promise<void> {
    if (!this.hasJwt() || this.apiReachable === false) {
      return;
    }
    try {
      const serverTrips = await firstValueFrom(this.http.get<ServerTrip[]>(this.API_URL));
      this.markApiResult(true);
      const mapped = await Promise.all(serverTrips.map(async s => {
        let events: ServerTripEvent[] = [];
        try {
          events = await firstValueFrom(
            this.http.get<ServerTripEvent[]>(`${this.API_URL}/${encodeURIComponent(s.code)}/events`));
        } catch {
          events = [];
        }
        return this.mapServerTrip(s, events);
      }));
      // Keep local-only trips the server has never seen (created offline and
      // not yet flushed) alongside the server list.
      const serverIds = new Set(mapped.map(t => t.id));
      const localOnly = this.tripsSignal().filter(t => !serverIds.has(t.id));
      const merged = [...mapped, ...localOnly];
      this.tripsSignal.set(merged);
      this.persist(merged);
      void this.sync.refreshMessagesFromServer(mapped.map(t => t.id));
    } catch (err: unknown) {
      // Network error (status 0) = no backend: stay in local mode silently.
      // Any other error (e.g. 401) also falls back to local trips.
      if ((err as { status?: number })?.status === 0 || (err as { status?: number })?.status === undefined) {
        this.markApiResult(false);
      }
    }
  }

  /** Fire-and-forget server push: success reconciles, failure stays local. */
  private pushToServer<T>(request: Promise<T>, onOk?: (res: T) => void): void {
    if (!this.hasJwt() || this.apiReachable === false) {
      return;
    }
    request.then(res => {
      this.markApiResult(true);
      onOk?.(res);
    }).catch((err: unknown) => {
      if ((err as { status?: number })?.status === 0) {
        this.markApiResult(false);
      }
      // 4xx from the server (e.g. proximity gate, DQF block) means the
      // server refused the change — the local optimistic state stands as
      // the demo/offline record; the next refresh reconciles from the server.
      console.warn('[TripService] server push failed, keeping local state', err);
    });
  }

  private pushCreate(trip: Trip): void {
    const body = {
      code: trip.id,
      riderName: trip.patientName,
      patientPhone: trip.patientPhone,
      mobility: trip.mobility,
      pickupAddress: trip.pickupAddress,
      pickupLat: trip.pickupLat,
      pickupLng: trip.pickupLng,
      dropoffAddress: trip.dropoffAddress,
      dropoffLat: trip.dropoffLat,
      dropoffLng: trip.dropoffLng,
      scheduledAt: scheduledTimeToIso(trip.scheduledTime),
      driverCode: trip.driverId,
      vehicleLabel: trip.vehicleNumber,
      wheelchair: trip.mobility === 'wheelchair',
      odometerStart: trip.startOdometer,
    };
    this.pushToServer(
      firstValueFrom(this.http.post<ServerTrip>(this.API_URL, body)),
      (serverTrip) => {
        const merged = this.mapServerTrip(serverTrip, []);
        this.tripsSignal.update(trips =>
          trips.map(t => (t.id === merged.id ? { ...merged, statusEvents: t.statusEvents ?? merged.statusEvents } : t)));
        this.persist(this.tripsSignal());
      }
    );
  }

  private pushStatus(
    tripId: string,
    status: TripStatus,
    metadata?: Partial<Trip> & { reasonCode?: string; reasonNote?: string; fix?: GpsFix }
  ): void {
    const body: Record<string, unknown> = {
      status,
      lat: metadata?.fix?.lat,
      lng: metadata?.fix?.lng,
      gpsSource: metadata?.fix?.source,
      reasonCode: metadata?.reasonCode,
      reasonNote: metadata?.reasonNote,
      odometerEnd: metadata?.endOdometer,
      passengerSignature: !!metadata?.signatureDataUrl,
      passengerSignatureData: metadata?.signatureDataUrl,
      driverSignature: !!metadata?.driverSignatureDataUrl,
      driverSignatureData: metadata?.driverSignatureDataUrl,
      driverSignatureName: metadata?.driverSignatureName,
      signeeName: metadata?.signeeName,
      signeeType: metadata?.signeeType,
    };
    this.pushToServer(
      firstValueFrom(this.http.post<ServerTrip>(`${this.API_URL}/${encodeURIComponent(tripId)}/status`, body)),
      (serverTrip) => {
        this.tripsSignal.update(trips =>
          trips.map(t => (t.id === serverTrip.code
            ? { ...t, billable: serverTrip.billable, status: serverTrip.frontendStatus }
            : t)));
        this.persist(this.tripsSignal());
      }
    );
  }

  private pushAssign(tripId: string, driverId: string | undefined, vehicleNumber: string | undefined): void {
    this.pushToServer(
      firstValueFrom(this.http.patch<ServerTrip>(
        `${this.API_URL}/${encodeURIComponent(tripId)}/assign`,
        { driverCode: driverId, vehicleLabel: vehicleNumber }))
    );
  }

  private pushSecurement(tripId: string, securement: WheelchairSecurement): void {
    this.pushToServer(
      firstValueFrom(this.http.post(
        `${this.API_URL}/${encodeURIComponent(tripId)}/securement`, securement))
    );
  }

  /** Server ETA (haversine @ 30 mph, labelled estimate) — async; templates keep the sync local etaMinutes. */
  async fetchEtaFromServer(tripId: string, toDropoff: boolean): Promise<number | null> {
    if (!this.hasJwt() || this.apiReachable === false) {
      return null;
    }
    try {
      const res = await firstValueFrom(this.http.get<{ minutes: number }>(
        `${this.API_URL}/${encodeURIComponent(tripId)}/eta?to=${toDropoff ? 'dropoff' : 'pickup'}`));
      this.markApiResult(true);
      return res.minutes;
    } catch {
      return null;
    }
  }

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
      window.addEventListener('online', () => void this.refreshFromServer());
    }
    // Phase 2: if a backend JWT exists, the server is the source of truth —
    // pull its trips (falls back to local trips when unreachable).
    void this.refreshFromServer();
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
      payload: {
        code: newTrip.id,
        patientName: newTrip.patientName,
        patientPhone: newTrip.patientPhone,
        mobility: newTrip.mobility,
        pickupAddress: newTrip.pickupAddress,
        pickupLat: newTrip.pickupLat,
        pickupLng: newTrip.pickupLng,
        dropoffAddress: newTrip.dropoffAddress,
        dropoffLat: newTrip.dropoffLat,
        dropoffLng: newTrip.dropoffLng,
        scheduledAt: scheduledTimeToIso(newTrip.scheduledTime),
        driverCode: newTrip.driverId,
        vehicleLabel: newTrip.vehicleNumber,
        wheelchair: newTrip.mobility === 'wheelchair',
        odometerStart: newTrip.startOdometer,
      },
    });
    this.pushCreate(newTrip);
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
      payload: { driverCode: driverId, vehicleLabel: vehicleNumber },
    });
    this.pushAssign(tripId, driverId, vehicleNumber);
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
      payload: {
        status,
        lat: fix.lat,
        lng: fix.lng,
        gpsSource: fix.source,
        reasonCode: metadata?.reasonCode,
        reasonNote: metadata?.reasonNote,
        odometerEnd: restMeta.endOdometer,
        passengerSignature: !!restMeta.signatureDataUrl,
        passengerSignatureData: restMeta.signatureDataUrl,
        driverSignature: !!restMeta.driverSignatureDataUrl,
        driverSignatureData: restMeta.driverSignatureDataUrl,
        driverSignatureName: restMeta.driverSignatureName,
        signeeName: restMeta.signeeName,
        signeeType: restMeta.signeeType,
      },
    });
    this.pushStatus(tripId, status, metadata);
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
      payload: {
        positioned: securement.positioned,
        tieDownFrontLeft: securement.tieDownFrontLeft,
        tieDownFrontRight: securement.tieDownFrontRight,
        tieDownRearLeft: securement.tieDownRearLeft,
        tieDownRearRight: securement.tieDownRearRight,
        brakesSet: securement.brakesSet,
        lapBelt: securement.lapBelt,
        shoulderBelt: securement.shoulderBelt,
        completedBy: this.driverSession().driverName,
      },
    });
    this.pushSecurement(tripId, securement);
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
