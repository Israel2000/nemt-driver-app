import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  DQFRecord,
  NonDriverStaffRecord,
  VehicleComplianceRecord,
  DVIRChecklist,
  DispatchEligibilityResult
} from '../models/compliance.model';

@Injectable({
  providedIn: 'root'
})
export class ComplianceService {
  private readonly DQF_STORAGE_KEY = 'nemt_dqf_records';
  private readonly STAFF_STORAGE_KEY = 'nemt_staff_records';
  private readonly VEHICLE_STORAGE_KEY = 'nemt_vehicle_compliance';
  private readonly DVIR_STORAGE_KEY = 'nemt_dvir_logs';

  private dqfSubject = new BehaviorSubject<DQFRecord[]>([]);
  public dqfRecords$: Observable<DQFRecord[]> = this.dqfSubject.asObservable();

  private staffSubject = new BehaviorSubject<NonDriverStaffRecord[]>([]);
  public staffRecords$: Observable<NonDriverStaffRecord[]> = this.staffSubject.asObservable();

  private vehicleSubject = new BehaviorSubject<VehicleComplianceRecord[]>([]);
  public vehicleRecords$: Observable<VehicleComplianceRecord[]> = this.vehicleSubject.asObservable();

  private dvirSubject = new BehaviorSubject<DVIRChecklist[]>([]);
  public dvirLogs$: Observable<DVIRChecklist[]> = this.dvirSubject.asObservable();

  constructor() {
    this.initData();
  }

  private initData(): void {
    this.loadDQF();
    this.loadStaff();
    this.loadVehicles();
    this.loadDVIR();
  }

  // --------------------------------------------------------------------------
  // DQF Records & Credential Renewals
  // --------------------------------------------------------------------------

  private loadDQF(): void {
    let list: DQFRecord[] = [];
    try {
      const stored = localStorage.getItem(this.DQF_STORAGE_KEY);
      if (stored) {
        list = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Error reading DQF from storage', e);
    }

    if (!list || list.length === 0) {
      list = this.getSeedDQF();
      this.saveDQF(list);
    } else {
      this.dqfSubject.next(list);
    }
  }

  private saveDQF(records: DQFRecord[]): void {
    try {
      localStorage.setItem(this.DQF_STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.warn('Error saving DQF to storage', e);
    }
    this.dqfSubject.next(records);
  }

  public getDQFById(driverId: string): DQFRecord | undefined {
    return this.dqfSubject.value.find(d => d.driverId === driverId);
  }

  public renewCredential(
    driverId: string,
    credentialType: 'cpr' | 'license' | 'medical' | 'pass' | 'defensive',
    newExpiryDate: string,
    docFileName?: string
  ): boolean {
    const list = [...this.dqfSubject.value];
    const index = list.findIndex(d => d.driverId === driverId);
    if (index === -1) return false;

    const record = { ...list[index] };
    const now = new Date();
    const exp = new Date(newExpiryDate);
    const status = exp < now ? 'expired' : (exp.getTime() - now.getTime() <= 30 * 86400000 ? 'expiring_soon' : 'valid');

    if (credentialType === 'cpr') {
      record.certifications.cprFirstAid.expirationDate = newExpiryDate;
      record.certifications.cprFirstAid.status = status;
      if (docFileName) record.certifications.cprFirstAid.documentFileName = docFileName;
    } else if (credentialType === 'license') {
      record.license.expirationDate = newExpiryDate;
      if (docFileName) record.license.licenseCardFrontFileName = docFileName;
    } else if (credentialType === 'medical') {
      record.medicalFitness.expirationDate = newExpiryDate;
      if (docFileName) record.medicalFitness.medicalCardFileName = docFileName;
    } else if (credentialType === 'pass') {
      record.certifications.passOrCtaa.expirationDate = newExpiryDate;
      record.certifications.passOrCtaa.status = status;
      if (docFileName) record.certifications.passOrCtaa.documentFileName = docFileName;
    } else if (credentialType === 'defensive') {
      record.certifications.defensiveDriving.expirationDate = newExpiryDate;
      record.certifications.defensiveDriving.status = status;
      if (docFileName) record.certifications.defensiveDriving.documentFileName = docFileName;
    }

    // Re-evaluate overall status
    record.overallStatus = this.computeDriverOverallStatus(record);
    record.lastAuditedDate = new Date().toISOString().split('T')[0];

    list[index] = record;
    this.saveDQF(list);
    return true;
  }

  public runMonthlyOigSamBatchScan(): { scannedCount: number; clearedCount: number; flaggedCount: number } {
    const list = [...this.dqfSubject.value];
    const today = new Date().toISOString().split('T')[0];
    let cleared = 0;
    let flagged = 0;

    const updated = list.map(record => {
      // Simulate verification against federal LEIE / SAM database
      const isClean = record.driverId !== 'DRV-999'; // sample exception rule
      if (isClean) {
        record.screenings.oigSamStatus = 'cleared';
        record.screenings.oigSamLastCheckedDate = today;
        record.screenings.oigSamCheckId = `OIG-CHECK-${Math.floor(100000 + Math.random() * 900000)}`;
        cleared++;
      } else {
        record.screenings.oigSamStatus = 'flagged';
        flagged++;
      }
      record.overallStatus = this.computeDriverOverallStatus(record);
      return record;
    });

    this.saveDQF(updated);
    return { scannedCount: list.length, clearedCount: cleared, flaggedCount: flagged };
  }

  private computeDriverOverallStatus(record: DQFRecord): 'compliant' | 'warning' | 'locked_out' {
    const now = new Date();
    const licExp = new Date(record.license.expirationDate);
    const cprExp = new Date(record.certifications.cprFirstAid.expirationDate);
    const medExp = new Date(record.medicalFitness.expirationDate);

    // Hard lockout triggers
    if (licExp < now || cprExp < now || medExp < now || record.screenings.oigSamStatus !== 'cleared') {
      return 'locked_out';
    }

    // Warning triggers (within 30 days)
    const thirtyDays = 30 * 86400000;
    if (
      licExp.getTime() - now.getTime() <= thirtyDays ||
      cprExp.getTime() - now.getTime() <= thirtyDays ||
      medExp.getTime() - now.getTime() <= thirtyDays
    ) {
      return 'warning';
    }

    return 'compliant';
  }

  // --------------------------------------------------------------------------
  // Non-Driver Staff Records
  // --------------------------------------------------------------------------

  private loadStaff(): void {
    let list: NonDriverStaffRecord[] = [];
    try {
      const stored = localStorage.getItem(this.STAFF_STORAGE_KEY);
      if (stored) {
        list = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Error reading staff from storage', e);
    }

    if (!list || list.length === 0) {
      list = this.getSeedStaff();
      this.saveStaff(list);
    } else {
      this.staffSubject.next(list);
    }
  }

  private saveStaff(records: NonDriverStaffRecord[]): void {
    try {
      localStorage.setItem(this.STAFF_STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.warn('Error saving staff to storage', e);
    }
    this.staffSubject.next(records);
  }

  public addStaffRecord(staff: NonDriverStaffRecord): void {
    const list = [...this.staffSubject.value, staff];
    this.saveStaff(list);
  }

  // --------------------------------------------------------------------------
  // Vehicle & Fleet Compliance
  // --------------------------------------------------------------------------

  private loadVehicles(): void {
    let list: VehicleComplianceRecord[] = [];
    try {
      const stored = localStorage.getItem(this.VEHICLE_STORAGE_KEY);
      if (stored) {
        list = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Error reading vehicle compliance from storage', e);
    }

    if (!list || list.length === 0) {
      list = this.getSeedVehicles();
      this.saveVehicles(list);
    } else {
      this.vehicleSubject.next(list);
    }
  }

  private saveVehicles(records: VehicleComplianceRecord[]): void {
    try {
      localStorage.setItem(this.VEHICLE_STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.warn('Error saving vehicle compliance to storage', e);
    }
    this.vehicleSubject.next(records);
  }

  public getVehicleByUnit(unitNumber: string): VehicleComplianceRecord | undefined {
    return this.vehicleSubject.value.find(v => v.unitNumber === unitNumber);
  }

  // --------------------------------------------------------------------------
  // Operational Daily Vehicle Inspection Reports (DVIR)
  // --------------------------------------------------------------------------

  private loadDVIR(): void {
    let list: DVIRChecklist[] = [];
    try {
      const stored = localStorage.getItem(this.DVIR_STORAGE_KEY);
      if (stored) {
        list = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Error reading DVIR logs from storage', e);
    }

    if (!list || list.length === 0) {
      list = this.getSeedDVIR();
      this.saveDVIR(list);
    } else {
      this.dvirSubject.next(list);
    }
  }

  private saveDVIR(records: DVIRChecklist[]): void {
    try {
      localStorage.setItem(this.DVIR_STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.warn('Error saving DVIR logs to storage', e);
    }
    this.dvirSubject.next(records);
  }

  public submitDVIR(checklist: DVIRChecklist): void {
    const list = [checklist, ...this.dvirSubject.value];
    this.saveDVIR(list);

    // Update vehicle's today DVIR status and odometer
    const vehicles = [...this.vehicleSubject.value];
    const vIndex = vehicles.findIndex(v => v.unitNumber === checklist.unitNumber);
    if (vIndex !== -1) {
      vehicles[vIndex].todayDvirStatus = checklist.defectsIdentified ? 'failed_defects' : 'passed';
      vehicles[vIndex].lastOdometer = checklist.odometer;
      this.saveVehicles(vehicles);
    }
  }

  // --------------------------------------------------------------------------
  // HARD DISPATCH LOCKOUT ENGINE
  // Evaluates whether a driver + vehicle combination is legally eligible for Medicaid dispatch
  // --------------------------------------------------------------------------

  public evaluateDispatchEligibility(driverId: string, unitNumber: string): DispatchEligibilityResult {
    const driver = this.getDQFById(driverId);
    const vehicle = this.getVehicleByUnit(unitNumber);
    const now = new Date();
    const lockoutReasons: string[] = [];
    const warningReasons: string[] = [];

    // 1. Driver Checks
    if (!driver) {
      lockoutReasons.push('Driver qualification file not found.');
    } else {
      const licExp = new Date(driver.license.expirationDate);
      if (licExp < now) {
        lockoutReasons.push(`Driver's license expired on ${driver.license.expirationDate}`);
      } else if (licExp.getTime() - now.getTime() <= 30 * 86400000) {
        warningReasons.push(`Driver's license expires within 30 days (${driver.license.expirationDate})`);
      }

      const cprExp = new Date(driver.certifications.cprFirstAid.expirationDate);
      if (cprExp < now) {
        lockoutReasons.push(`CPR / First Aid card expired on ${driver.certifications.cprFirstAid.expirationDate}`);
      } else if (cprExp.getTime() - now.getTime() <= 30 * 86400000) {
        warningReasons.push(`CPR card expires soon (${driver.certifications.cprFirstAid.expirationDate})`);
      }

      const medExp = new Date(driver.medicalFitness.expirationDate);
      if (medExp < now) {
        lockoutReasons.push(`DOT Medical Certificate (MCSA-5876) expired on ${driver.medicalFitness.expirationDate}`);
      }

      if (driver.screenings.oigSamStatus !== 'cleared') {
        lockoutReasons.push('Monthly OIG / SAM Exclusion Clearance is unverified or flagged');
      }

      if (driver.license.mvrStatus === 'disqualified') {
        lockoutReasons.push('Annual MVR check status is Disqualified');
      }
    }

    // 2. Vehicle Checks
    if (!vehicle) {
      lockoutReasons.push('Vehicle fleet record not found.');
    } else {
      const insExp = new Date(vehicle.insuranceExpiration);
      if (insExp < now) {
        lockoutReasons.push(`Commercial insurance COI expired on ${vehicle.insuranceExpiration}`);
      }

      const regExp = new Date(vehicle.commercialRegistrationExpiry);
      if (regExp < now) {
        lockoutReasons.push(`Commercial vehicle registration expired on ${vehicle.commercialRegistrationExpiry}`);
      }

      if (vehicle.status !== 'In Service') {
        lockoutReasons.push(`Vehicle status is '${vehicle.status}'`);
      }

      if (vehicle.todayDvirStatus === 'failed_defects') {
        lockoutReasons.push('Daily DVIR has uncorrected safety defects');
      } else if (vehicle.todayDvirStatus === 'pending') {
        warningReasons.push('Daily Pre-Trip DVIR has not yet been logged for this shift');
      }
    }

    const isEligible = lockoutReasons.length === 0;

    return {
      driverId,
      unitNumber,
      isEligible,
      lockoutReasons,
      warningReasons,
      auditShieldPass: isEligible,
      evaluatedAt: new Date().toISOString()
    };
  }

  // --------------------------------------------------------------------------
  // Seed Data Initializers
  // --------------------------------------------------------------------------

  private getSeedDQF(): DQFRecord[] {
    return [
      {
        driverId: 'DRV-101',
        fullName: 'Marcus Vance',
        email: 'marcus.vance@example.com',
        phone: '(303) 555-0192',
        employmentType: 'Full-Time Employee',
        hireDate: '2024-03-15',
        assignedVehicleUnit: 'VAN-101',
        employment: {
          taxFormType: 'W-4',
          taxFormSubmitted: true,
          taxFormFileName: 'marcus_vance_w4.pdf',
          i9Verified: true,
          i9VerificationDate: '2024-03-15',
          directDepositAuthorized: true,
          emergencyContactName: 'Brenda Vance',
          emergencyContactPhone: '(303) 555-9011',
          emergencyContactRelationship: 'Spouse'
        },
        license: {
          licenseNumber: 'CO-9842104',
          state: 'CO',
          licenseClass: 'Class R (Standard Commercial Endorsed)',
          expirationDate: '2026-11-15',
          licenseCardFrontFileName: 'dl_front_vance.jpg',
          mvrLastPulledDate: '2025-11-10',
          mvrNextDue: '2026-11-10',
          mvrStatus: 'clean',
          hasSuspensionsPast5Years: false
        },
        screenings: {
          fcraDisclosureSigned: true,
          backgroundCheckCompletedDate: '2024-03-12',
          backgroundCheckStatus: 'passed',
          sexOffenderRegistryCleared: true,
          sexOffenderCheckDate: '2024-03-12',
          oigSamLastCheckedDate: '2026-09-01',
          oigSamStatus: 'cleared',
          oigSamCheckId: 'OIG-2026-88192',
          drugScreenType: '10-panel',
          drugScreenResult: 'negative',
          drugScreenCompletedDate: '2024-03-10',
          randomTestingPoolEnrolled: true
        },
        medicalFitness: {
          certificateType: 'DOT_MCSA_5876',
          examinerName: 'Dr. Robert Hayes, MD (NRCME #48910)',
          nationalRegistryNumber: '48910',
          issueDate: '2025-04-10',
          expirationDate: '2027-04-10',
          liftingClearanceMet: true,
          medicalCardFileName: 'dot_medical_vance.pdf'
        },
        certifications: {
          cprFirstAid: {
            credentialName: 'Adult & Pediatric CPR/First Aid',
            issuer: 'American Red Cross',
            cardNumber: 'ARC-CPR-77291',
            issueDate: '2024-10-01',
            expirationDate: '2026-10-01',
            status: 'expiring_soon',
            documentFileName: 'cpr_card_vance.jpg'
          },
          passOrCtaa: {
            credentialName: 'PASS Basic 7.0 Certification',
            issuer: 'CTAA (Community Transportation Association)',
            cardNumber: 'PASS-CO-4109',
            issueDate: '2024-04-05',
            expirationDate: '2027-04-05',
            status: 'valid'
          },
          defensiveDriving: {
            credentialName: 'National Safety Council Defensive Driving (DDC-4)',
            issuer: 'National Safety Council',
            issueDate: '2024-03-20',
            expirationDate: '2027-03-20',
            status: 'valid'
          },
          wheelchairLiftSecurement: {
            trainedDate: '2024-03-18',
            trainerName: 'David Sterling, Lead Safety Officer',
            passedEvaluation: true,
            tieDownCertFileName: 'lift_eval_vance.pdf'
          },
          bloodbornePathogens: {
            credentialName: 'OSHA Bloodborne Pathogens & Infection Control',
            issuer: 'Health & Safety Institute (HSI)',
            issueDate: '2025-01-10',
            expirationDate: '2026-01-10',
            status: 'valid'
          },
          hipaaPatientPrivacy: {
            acknowledgedDate: '2024-03-15',
            signedConsent: true
          }
        },
        overallStatus: 'warning',
        lastAuditedDate: '2026-09-01'
      },
      {
        driverId: 'DRV-102',
        fullName: 'Elena Rostova',
        email: 'elena.rostova@example.com',
        phone: '(303) 555-8831',
        employmentType: 'Full-Time Employee',
        hireDate: '2023-08-20',
        assignedVehicleUnit: 'VAN-102',
        employment: {
          taxFormType: 'W-4',
          taxFormSubmitted: true,
          i9Verified: true,
          directDepositAuthorized: true,
          emergencyContactName: 'Mikhail Rostov',
          emergencyContactPhone: '(303) 555-1284',
          emergencyContactRelationship: 'Brother'
        },
        license: {
          licenseNumber: 'CO-7714902',
          state: 'CO',
          licenseClass: 'Class R Commercial Endorsed',
          expirationDate: '2027-08-20',
          mvrLastPulledDate: '2025-08-15',
          mvrNextDue: '2026-08-15',
          mvrStatus: 'clean',
          hasSuspensionsPast5Years: false
        },
        screenings: {
          fcraDisclosureSigned: true,
          backgroundCheckCompletedDate: '2023-08-10',
          backgroundCheckStatus: 'passed',
          sexOffenderRegistryCleared: true,
          sexOffenderCheckDate: '2023-08-10',
          oigSamLastCheckedDate: '2026-09-01',
          oigSamStatus: 'cleared',
          oigSamCheckId: 'OIG-2026-88193',
          drugScreenType: '10-panel',
          drugScreenResult: 'negative',
          drugScreenCompletedDate: '2023-08-12',
          randomTestingPoolEnrolled: true
        },
        medicalFitness: {
          certificateType: 'DOT_MCSA_5876',
          examinerName: 'Dr. Sarah Lin, MD (NRCME #62019)',
          nationalRegistryNumber: '62019',
          issueDate: '2024-12-05',
          expirationDate: '2026-12-05',
          liftingClearanceMet: true
        },
        certifications: {
          cprFirstAid: {
            credentialName: 'Adult & Pediatric CPR/First Aid',
            issuer: 'American Heart Association (AHA)',
            cardNumber: 'AHA-BLS-99120',
            issueDate: '2025-01-14',
            expirationDate: '2027-01-14',
            status: 'valid'
          },
          passOrCtaa: {
            credentialName: 'PASS Basic 7.0 Certification',
            issuer: 'CTAA',
            issueDate: '2023-09-01',
            expirationDate: '2026-09-01',
            status: 'valid'
          },
          defensiveDriving: {
            credentialName: 'Defensive Driving Course',
            issuer: 'Colorado Safety Association',
            issueDate: '2023-08-25',
            expirationDate: '2026-08-25',
            status: 'valid'
          },
          wheelchairLiftSecurement: {
            trainedDate: '2023-08-28',
            trainerName: 'David Sterling',
            passedEvaluation: true
          },
          bloodbornePathogens: {
            credentialName: 'OSHA Bloodborne Pathogens',
            issuer: 'National Safety Council',
            issueDate: '2024-08-20',
            expirationDate: '2025-08-20',
            status: 'valid'
          },
          hipaaPatientPrivacy: {
            acknowledgedDate: '2023-08-20',
            signedConsent: true
          }
        },
        overallStatus: 'compliant',
        lastAuditedDate: '2026-09-01'
      },
      {
        driverId: 'DRV-103',
        fullName: 'Darnell Washington',
        email: 'darnell.w@example.com',
        phone: '(720) 555-4491',
        employmentType: '1099 Contractor',
        hireDate: '2023-05-10',
        assignedVehicleUnit: 'SED-104',
        employment: {
          taxFormType: 'W-9',
          taxFormSubmitted: true,
          i9Verified: true,
          directDepositAuthorized: true,
          emergencyContactName: 'Tasha Washington',
          emergencyContactPhone: '(720) 555-3320',
          emergencyContactRelationship: 'Spouse'
        },
        license: {
          licenseNumber: 'CO-6029312',
          state: 'CO',
          licenseClass: 'Class R',
          expirationDate: '2026-08-10', // EXPIRED!
          mvrLastPulledDate: '2024-06-20',
          mvrNextDue: '2025-06-20',
          mvrStatus: 'clean',
          hasSuspensionsPast5Years: false
        },
        screenings: {
          fcraDisclosureSigned: true,
          backgroundCheckCompletedDate: '2023-05-02',
          backgroundCheckStatus: 'passed',
          sexOffenderRegistryCleared: true,
          sexOffenderCheckDate: '2023-05-02',
          oigSamLastCheckedDate: '2026-07-15', // Overdue (>30 days)!
          oigSamStatus: 'overdue',
          oigSamCheckId: 'OIG-2026-77123',
          drugScreenType: '5-panel',
          drugScreenResult: 'negative',
          drugScreenCompletedDate: '2023-05-05',
          randomTestingPoolEnrolled: true
        },
        medicalFitness: {
          certificateType: 'DOT_MCSA_5876',
          examinerName: 'Dr. Robert Hayes, MD',
          issueDate: '2025-02-18',
          expirationDate: '2027-02-18',
          liftingClearanceMet: true
        },
        certifications: {
          cprFirstAid: {
            credentialName: 'Adult First Aid & CPR',
            issuer: 'American Red Cross',
            issueDate: '2024-10-01',
            expirationDate: '2026-10-01',
            status: 'expiring_soon'
          },
          passOrCtaa: {
            credentialName: 'PASS Basic Certification',
            issuer: 'CTAA',
            issueDate: '2023-05-15',
            expirationDate: '2026-05-15',
            status: 'valid'
          },
          defensiveDriving: {
            credentialName: 'Defensive Driving',
            issuer: 'NSC',
            issueDate: '2023-05-18',
            expirationDate: '2026-05-18',
            status: 'valid'
          },
          wheelchairLiftSecurement: {
            trainedDate: '2023-05-20',
            trainerName: 'David Sterling',
            passedEvaluation: true
          },
          bloodbornePathogens: {
            credentialName: 'Bloodborne Pathogens',
            issuer: 'HSI',
            issueDate: '2024-05-10',
            expirationDate: '2025-05-10',
            status: 'valid'
          },
          hipaaPatientPrivacy: {
            acknowledgedDate: '2023-05-10',
            signedConsent: true
          }
        },
        overallStatus: 'locked_out',
        lastAuditedDate: '2026-09-01'
      }
    ];
  }

  private getSeedStaff(): NonDriverStaffRecord[] {
    return [
      {
        id: 'STF-201',
        fullName: 'Kendra Miller',
        email: 'kendra.m@example.com',
        phone: '(303) 555-7721',
        role: 'Dispatcher',
        hireDate: '2023-11-01',
        w4OrW9Signed: true,
        i9Verified: true,
        handbookSigned: true,
        backgroundCheckCleared: true,
        backgroundCheckDate: '2023-10-25',
        hipaaConfidentialitySigned: true,
        hipaaSignedDate: '2023-11-01',
        status: 'active'
      },
      {
        id: 'STF-202',
        fullName: 'Hector Morales',
        email: 'hector.m@example.com',
        phone: '(303) 555-3349',
        role: 'Custodian / Vehicle Sanitizer',
        hireDate: '2024-01-15',
        w4OrW9Signed: true,
        i9Verified: true,
        handbookSigned: true,
        backgroundCheckCleared: true,
        backgroundCheckDate: '2024-01-10',
        hipaaConfidentialitySigned: true,
        hipaaSignedDate: '2024-01-15',
        oshaHazComSdsAcknowledged: true,
        bbpBiohazardCleaningCertified: true,
        bbpCertExpiry: '2027-01-15',
        hepatitisBVaccineStatus: 'accepted',
        status: 'active'
      }
    ];
  }

  private getSeedVehicles(): VehicleComplianceRecord[] {
    return [
      {
        unitNumber: 'VAN-101',
        vin: '1FTBR1Y85KPA91024',
        licensePlate: 'MED-8910',
        makeModel: '2023 Ford Transit 350 High Roof',
        year: 2023,
        vehicleType: 'Wheelchair Ramp Van',
        status: 'In Service',
        assignedDriverId: 'DRV-101',
        assignedDriverName: 'Marcus Vance',
        commercialRegistrationExpiry: '2027-02-28',
        registrationState: 'CO',
        insuranceCarrier: 'Progressive Commercial Fleet',
        policyNumber: 'CA-9041280-CO',
        liabilityCoverageAmount: 1500000,
        insuranceExpiration: '2027-03-01',
        additionalInsuredBrokers: ['Modivcare', 'MTM', 'Colorado Department of Health Care Policy and Financing (Medicaid)'],
        adaLiftManufacturer: 'BraunAbility Millennium Series',
        liftRatedCapacityLbs: 800,
        floorTieDownSystemType: "Q'Straint QRT-360 4-Point L-Track System",
        adaCertificationExpiry: '2027-02-15',
        annualSafetyInspectionDate: '2025-11-15',
        annualSafetyInspectionExpiry: '2026-11-15',
        certMechanicFacility: 'Mile High Fleet Services Inc.',
        todayDvirStatus: 'passed',
        lastOdometer: 42350
      },
      {
        unitNumber: 'VAN-102',
        vin: '3C6TRVDG2NE681023',
        licensePlate: 'MED-9122',
        makeModel: '2022 Ram ProMaster 2500 Lift',
        year: 2022,
        vehicleType: 'Bariatric Stretcher Van',
        status: 'In Service',
        assignedDriverId: 'DRV-102',
        assignedDriverName: 'Elena Rostova',
        commercialRegistrationExpiry: '2027-05-31',
        registrationState: 'CO',
        insuranceCarrier: 'Progressive Commercial Fleet',
        policyNumber: 'CA-9041280-CO',
        liabilityCoverageAmount: 1500000,
        insuranceExpiration: '2027-03-01',
        additionalInsuredBrokers: ['Modivcare', 'MTM', 'Colorado Medicaid'],
        adaLiftManufacturer: 'Ricon S-Series Bariatric Power Lift',
        liftRatedCapacityLbs: 1000,
        floorTieDownSystemType: "Sure-Lok Titan Retractor Stretcher Lockdown",
        adaCertificationExpiry: '2027-04-10',
        annualSafetyInspectionDate: '2025-10-01',
        annualSafetyInspectionExpiry: '2026-10-01',
        certMechanicFacility: 'Denver Commercial Fleet Care',
        todayDvirStatus: 'passed',
        lastOdometer: 58900
      },
      {
        unitNumber: 'VAN-103',
        vin: '2C4RDGBG8MR104812',
        licensePlate: 'MED-4419',
        makeModel: '2021 Dodge Grand Caravan ADA',
        year: 2021,
        vehicleType: 'Wheelchair Ramp Van',
        status: 'In Maintenance',
        commercialRegistrationExpiry: '2026-09-28', // Expiring in days
        registrationState: 'CO',
        insuranceCarrier: 'Progressive Commercial Fleet',
        policyNumber: 'CA-9041280-CO',
        liabilityCoverageAmount: 1500000,
        insuranceExpiration: '2027-03-01',
        additionalInsuredBrokers: ['Modivcare', 'MTM'],
        adaLiftManufacturer: 'BraunAbility Rear-Entry Ramp',
        liftRatedCapacityLbs: 800,
        floorTieDownSystemType: "Q'Straint Deluxe Manual Tie-Down",
        annualSafetyInspectionDate: '2025-09-28',
        annualSafetyInspectionExpiry: '2026-09-28',
        certMechanicFacility: 'Front Range Fleet Repair',
        todayDvirStatus: 'failed_defects',
        lastOdometer: 84120
      },
      {
        unitNumber: 'SED-104',
        vin: '4T1B11HK5RU901284',
        licensePlate: 'MED-2033',
        makeModel: '2024 Toyota Camry Hybrid LE',
        year: 2024,
        vehicleType: 'Ambulatory Sedan',
        status: 'In Service',
        commercialRegistrationExpiry: '2027-01-20',
        registrationState: 'CO',
        insuranceCarrier: 'Progressive Commercial Fleet',
        policyNumber: 'CA-9041280-CO',
        liabilityCoverageAmount: 1500000,
        insuranceExpiration: '2027-03-01',
        additionalInsuredBrokers: ['Modivcare', 'MTM', 'Colorado Medicaid'],
        annualSafetyInspectionDate: '2026-01-20',
        annualSafetyInspectionExpiry: '2027-01-20',
        certMechanicFacility: 'Mile High Fleet Services Inc.',
        todayDvirStatus: 'pending',
        lastOdometer: 31400
      }
    ];
  }

  private getSeedDVIR(): DVIRChecklist[] {
    return [
      {
        id: 'DVIR-2026-901',
        inspectionType: 'pre_trip',
        unitNumber: 'VAN-101',
        driverId: 'DRV-101',
        driverName: 'Marcus Vance',
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
        odometer: 42350,
        brakesServiceAndParking: true,
        tiresTreadAndPressure: true,
        lightsHeadBrakeTurnHazard: true,
        hornAndWipers: true,
        mirrorsAndWindshield: true,
        wheelchairLiftDeploymentCycle: true,
        wheelchairLiftManualBackupPump: true,
        qStraintTieDownsAndLapBelts: true,
        fireExtinguisherCharged: true,
        firstAidAndBbpSpillKitStocked: true,
        cleanlinessAndSanitization: true,
        hvacClimateControlOperating: true,
        defectsIdentified: false,
        vehicleSafeToOperate: true,
        driverSignatureDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><text y="25" font-family="cursive">MVance</text></svg>',
        driverPrintedName: 'Marcus Vance'
      },
      {
        id: 'DVIR-2026-902',
        inspectionType: 'pre_trip',
        unitNumber: 'VAN-103',
        driverId: 'DRV-103',
        driverName: 'Darnell Washington',
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
        odometer: 84120,
        brakesServiceAndParking: true,
        tiresTreadAndPressure: true,
        lightsHeadBrakeTurnHazard: true,
        hornAndWipers: true,
        mirrorsAndWindshield: true,
        wheelchairLiftDeploymentCycle: false, // DEFECT: Lift sluggish
        wheelchairLiftManualBackupPump: true,
        qStraintTieDownsAndLapBelts: true,
        fireExtinguisherCharged: true,
        firstAidAndBbpSpillKitStocked: true,
        cleanlinessAndSanitization: true,
        hvacClimateControlOperating: true,
        defectsIdentified: true,
        defectNotes: 'Ramp hydraulic pump slow to retract. Requires fluid top-off.',
        vehicleSafeToOperate: false,
        driverSignatureDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><text y="25" font-family="cursive">DWash</text></svg>',
        driverPrintedName: 'Darnell Washington'
      }
    ];
  }
}
