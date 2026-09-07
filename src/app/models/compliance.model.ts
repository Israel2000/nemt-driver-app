/**
 * NEMT FLEETOS - REGULATORY COMPLIANCE & OPERATIONAL DATA MODELS
 * Standardized across Medicaid, state Department of Health, and NEMT brokers (Modivcare, MTM, MAS).
 */

// ============================================================================
// BUCKET 1: DRIVER QUALIFICATION FILE (DQF) & ONBOARDING
// ============================================================================

export interface DQFEmploymentTax {
  taxFormType: 'W-4' | 'W-9' | '1099_Contractor';
  taxFormSubmitted: boolean;
  taxFormFileName?: string;
  i9Verified: boolean;
  i9VerificationDate?: string;
  directDepositAuthorized: boolean;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
}

export interface DQFLicenseMvr {
  licenseNumber: string;
  state: string;
  licenseClass: string;
  expirationDate: string;
  licenseCardFrontFileName?: string;
  licenseCardBackFileName?: string;
  mvrLastPulledDate: string;
  mvrNextDue: string;
  mvrStatus: 'clean' | 'minor_infraction' | 'disqualified';
  mvrReportFileName?: string;
  hasSuspensionsPast5Years: boolean;
}

export interface DQFScreenings {
  fcraDisclosureSigned: boolean;
  backgroundCheckCompletedDate: string;
  backgroundCheckStatus: 'passed' | 'pending' | 'flagged';
  sexOffenderRegistryCleared: boolean;
  sexOffenderCheckDate: string;
  // OIG / SAM Exclusion Clearance (Mandatory for Medicaid Reimbursement)
  oigSamLastCheckedDate: string;
  oigSamStatus: 'cleared' | 'flagged' | 'overdue';
  oigSamCheckId: string;
  // Drug & Alcohol Screening
  drugScreenType: '5-panel' | '10-panel' | 'DOT-panel';
  drugScreenResult: 'negative' | 'positive' | 'pending';
  drugScreenCompletedDate: string;
  randomTestingPoolEnrolled: boolean;
}

export interface DQFMedicalFitness {
  certificateType: 'DOT_MCSA_5876' | 'Physician_Physical_Clearance';
  examinerName: string;
  nationalRegistryNumber?: string;
  issueDate: string;
  expirationDate: string;
  liftingClearanceMet: boolean; // Minimum 50-75 lbs lift, bend, assist riders
  medicalCardFileName?: string;
}

export interface CredentialTracker {
  credentialName: string;
  issuer: string;
  cardNumber?: string;
  issueDate: string;
  expirationDate: string;
  status: 'valid' | 'expiring_soon' | 'expired';
  documentFileName?: string;
}

export interface DQFCertifications {
  cprFirstAid: CredentialTracker;
  passOrCtaa: CredentialTracker; // Passenger Assistance Safety and Sensitivity
  defensiveDriving: CredentialTracker;
  wheelchairLiftSecurement: {
    trainedDate: string;
    trainerName: string;
    passedEvaluation: boolean;
    tieDownCertFileName?: string;
  };
  bloodbornePathogens: CredentialTracker;
  hipaaPatientPrivacy: {
    acknowledgedDate: string;
    signedConsent: boolean;
  };
}

export interface DQFRecord {
  driverId: string;
  fullName: string;
  email: string;
  phone: string;
  employmentType: 'Full-Time Employee' | 'Part-Time Employee' | '1099 Contractor';
  hireDate: string;
  assignedVehicleUnit?: string;
  
  employment: DQFEmploymentTax;
  license: DQFLicenseMvr;
  screenings: DQFScreenings;
  medicalFitness: DQFMedicalFitness;
  certifications: DQFCertifications;
  
  overallStatus: 'compliant' | 'warning' | 'locked_out';
  lastAuditedDate: string;
}

// ============================================================================
// BUCKET 2: NON-DRIVER STAFF ONBOARDING (Custodians, Dispatchers, Billing)
// ============================================================================

export type NonDriverRole = 'Dispatcher' | 'Custodian / Vehicle Sanitizer' | 'Billing & Medicaid Specialist' | 'Fleet Mechanic';

export interface NonDriverStaffRecord {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: NonDriverRole;
  hireDate: string;
  w4OrW9Signed: boolean;
  i9Verified: boolean;
  handbookSigned: boolean;
  backgroundCheckCleared: boolean;
  backgroundCheckDate: string;
  hipaaConfidentialitySigned: boolean;
  hipaaSignedDate: string;
  // Specific to custodians & vehicle cleaning staff
  oshaHazComSdsAcknowledged?: boolean;
  bbpBiohazardCleaningCertified?: boolean;
  bbpCertExpiry?: string;
  hepatitisBVaccineStatus?: 'accepted' | 'declined' | 'immune';
  status: 'active' | 'leave' | 'compliance_pending';
}

// ============================================================================
// BUCKET 3: VEHICLE & FLEET COMPLIANCE
// ============================================================================

export interface VehicleComplianceRecord {
  unitNumber: string;
  vin: string;
  licensePlate: string;
  makeModel: string;
  year: number;
  vehicleType: 'Wheelchair Ramp Van' | 'Bariatric Stretcher Van' | 'Ambulatory Sedan';
  status: 'In Service' | 'Out of Service' | 'In Maintenance';
  assignedDriverId?: string;
  assignedDriverName?: string;
  
  // Registration & Insurance
  commercialRegistrationExpiry: string;
  registrationState: string;
  registrationDocFileName?: string;
  
  insuranceCarrier: string;
  policyNumber: string;
  liabilityCoverageAmount: number; // typically $1,000,000 to $1,500,000
  insuranceExpiration: string;
  additionalInsuredBrokers: string[]; // e.g. ['Modivcare', 'MTM', 'Colorado Medicaid']
  coiDocFileName?: string;
  
  // ADA Accessibility Certification
  adaLiftManufacturer?: string;
  liftRatedCapacityLbs?: number; // Minimum 600–800 lbs
  floorTieDownSystemType?: string; // e.g. "Q'Straint QRT-360 4-Point L-Track"
  adaCertificationExpiry?: string;
  
  // Annual Mechanic Safety Inspection
  annualSafetyInspectionDate: string;
  annualSafetyInspectionExpiry: string;
  certMechanicFacility: string;
  
  // Daily DVIR status
  todayDvirStatus: 'passed' | 'failed_defects' | 'pending';
  lastOdometer: number;
}

// ============================================================================
// BUCKET 4: OPERATIONAL DVIR & TRIP ATTESTATIONS
// ============================================================================

export interface DVIRChecklist {
  id: string;
  inspectionType: 'pre_trip' | 'post_trip';
  unitNumber: string;
  driverId: string;
  driverName: string;
  timestamp: string;
  odometer: number;
  
  // Vehicle System Checks
  brakesServiceAndParking: boolean;
  tiresTreadAndPressure: boolean;
  lightsHeadBrakeTurnHazard: boolean;
  hornAndWipers: boolean;
  mirrorsAndWindshield: boolean;
  
  // Critical NEMT & ADA Checks
  wheelchairLiftDeploymentCycle: boolean;
  wheelchairLiftManualBackupPump: boolean;
  qStraintTieDownsAndLapBelts: boolean; // 4-Point Tie Downs, condition & operation
  fireExtinguisherCharged: boolean; // Gauge in green
  firstAidAndBbpSpillKitStocked: boolean;
  cleanlinessAndSanitization: boolean;
  hvacClimateControlOperating: boolean; // Vital for dialysis and cardiac passengers
  
  defectsIdentified: boolean;
  defectNotes?: string;
  vehicleSafeToOperate: boolean;
  driverSignatureDataUrl: string;
  driverPrintedName: string;
  
  mechanicResolution?: {
    resolvedDate: string;
    mechanicName: string;
    actionTaken: string;
    signoffSignature: string;
  };
}

export interface TripAttestation {
  tripId: string;
  patientName: string;
  patientMedicaidId: string;
  brokerId?: string; // Modivcare, MTM, etc.
  brokerAuthCode: string;
  unitNumber: string;
  driverId: string;
  driverName: string;
  pickupTime: string;
  dropoffTime: string;
  pickupCoordinates: { lat: number; lng: number };
  dropoffCoordinates: { lat: number; lng: number };
  startOdometer: number;
  pickupOdometer: number;
  dropoffOdometer: number;
  loadedMiles: number;
  unloadedMiles: number;
  driverSignatureUrl: string;
  passengerOrFacilitySignatureUrl: string;
  signerRelationship: 'passenger' | 'nursing_facility_staff' | 'legal_guardian';
  signerPrintedName: string;
  signedAt: string;
}

// ============================================================================
// HARD DISPATCH LOCKOUT RULE ENGINE
// ============================================================================

export interface DispatchEligibilityResult {
  driverId: string;
  unitNumber: string;
  isEligible: boolean;
  lockoutReasons: string[];
  warningReasons: string[];
  auditShieldPass: boolean;
  evaluatedAt: string;
}
