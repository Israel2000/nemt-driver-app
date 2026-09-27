export type TripStatus =
  | 'scheduled'
  | 'en_route_pickup'
  | 'arrived_pickup'
  | 'in_transit'
  | 'completed'
  | 'cancelled';

export type MobilityType = 'ambulatory' | 'wheelchair' | 'stretcher';

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
  signatureDataUrl?: string;
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
  currentLat?: number;
  currentLng?: number;
}
