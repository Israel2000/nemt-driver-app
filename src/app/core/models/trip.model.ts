export type TripStatus =
  | 'scheduled'
  | 'en_route_pickup'
  | 'arrived_pickup'
  | 'in_transit'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'delayed';

export type MobilityType = 'ambulatory' | 'wheelchair' | 'stretcher';

/** One GPS- + timestamp-stamped status transition (RouteGenie/Bambi pattern).
 *  Every driver tap and every dispatch action appends one of these, so the
 *  dispatch board, the audit trail and the proof-of-delivery drawer all read
 *  the same event history. `gpsSource` is honest about where the fix came
 *  from: 'device' = live Geolocation API, 'estimated' = last known / stop
 *  coordinates (browser GPS denied or unavailable), 'unavailable' = none. */
export interface TripStatusEvent {
  status: TripStatus;
  /** HH:MM AM/PM display time, plus ISO for ordering. */
  at: string;
  atIso: string;
  lat?: number;
  lng?: number;
  gpsSource: 'device' | 'estimated' | 'unavailable';
  by: 'driver' | 'dispatch';
  byName?: string;
  reasonCode?: string;
  reasonNote?: string;
}

/** Per-leg wheelchair securement checklist (market gap — no major vendor
 *  ships this standalone). Completed by the driver at boarding, before the
 *  trip can move to In Transit. */
export interface WheelchairSecurement {
  positioned: boolean;
  tieDownFrontLeft: boolean;
  tieDownFrontRight: boolean;
  tieDownRearLeft: boolean;
  tieDownRearRight: boolean;
  brakesSet: boolean;
  lapBelt: boolean;
  shoulderBelt: boolean;
  completedAt?: string;
  completedBy?: string;
}

export interface Trip {
  id: string;
  patientName: string;
  patientPhone?: string;
  mobility: MobilityType;
  pickupAddress: string;
  pickupLat?: number;
  pickupLng?: number;
  dropoffAddress: string;
  dropoffLat?: number;
  dropoffLng?: number;
  scheduledTime: string;
  status: TripStatus;
  driverId?: string;
  driverName?: string;
  vehicleNumber?: string;
  startOdometer?: number;
  endOdometer?: number;
  /** Passenger / facility signature (canvas capture at drop-off). */
  signatureDataUrl?: string;
  /** Driver's own sign-off signature at drop-off. */
  driverSignatureDataUrl?: string;
  driverSignatureName?: string;
  completedAt?: string;
  signeeType?: 'patient' | 'facility_staff';
  signeeName?: string;
  lifecycleTimestamps?: {
    scheduled?: string;
    enRoute?: string;
    arrivedPickup?: string;
    boarded?: string;
    completed?: string;
  };
  /** Full GPS-stamped status history (new). */
  statusEvents?: TripStatusEvent[];
  /** Reason for no-show / cancelled / delayed (with code, not free text only). */
  statusReasonCode?: string;
  statusReasonNote?: string;
  /** GPS fix captured at pickup and at drop-off. */
  pickupGps?: { lat: number; lng: number; at: string; source: 'device' | 'estimated' | 'unavailable' };
  dropoffGps?: { lat: number; lng: number; at: string; source: 'device' | 'estimated' | 'unavailable' };
  /** Per-leg wheelchair securement (wheelchair trips only). */
  wheelchairSecurement?: WheelchairSecurement;
  /** Billable once completed with odometer + signature evidence attached. */
  billable?: boolean;
  currentLat?: number;
  currentLng?: number;
}

/** Haversine distance in miles between two lat/lng points. */
export function haversineMiles(
  lat1: number, lng1: number, lat2: number, lng2: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 3958.8; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Rough drive-time ETA in minutes at an assumed 30 mph city speed. */
export function etaMinutesForMiles(miles: number): number {
  return Math.max(1, Math.round((miles / 30) * 60));
}
