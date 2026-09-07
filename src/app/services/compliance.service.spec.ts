import { TestBed } from '@angular/core/testing';
import { ComplianceService } from './compliance.service';
import { DVIRChecklist } from '../models/compliance.model';

describe('ComplianceService', () => {
  let service: ComplianceService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [ComplianceService]
    });
    service = TestBed.inject(ComplianceService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created and seed compliance records', (done) => {
    expect(service).toBeTruthy();

    service.dqfRecords$.subscribe(records => {
      expect(records.length).toBeGreaterThanOrEqual(3);
      expect(records.some(r => r.driverId === 'DRV-101')).toBeTrue();
      done();
    });
  });

  it('should renew a driver credential and update overall status', () => {
    const driver = service.getDQFById('DRV-101');
    expect(driver).toBeTruthy();

    const futureDate = '2028-10-01';
    const renewed = service.renewCredential('DRV-101', 'cpr', futureDate, 'new_cpr_card.pdf');
    expect(renewed).toBeTrue();

    const updated = service.getDQFById('DRV-101');
    expect(updated?.certifications.cprFirstAid.expirationDate).toBe(futureDate);
    expect(updated?.certifications.cprFirstAid.status).toBe('valid');
  });

  it('should execute monthly OIG/SAM batch scan and clear drivers', () => {
    const scanResult = service.runMonthlyOigSamBatchScan();
    expect(scanResult.scannedCount).toBeGreaterThanOrEqual(3);
    expect(scanResult.clearedCount).toBeGreaterThanOrEqual(2);

    const driver = service.getDQFById('DRV-101');
    expect(driver?.screenings.oigSamStatus).toBe('cleared');
  });

  it('should submit a DVIR and update vehicle status', () => {
    const dvir: DVIRChecklist = {
      id: 'TEST-DVIR-1',
      inspectionType: 'pre_trip',
      unitNumber: 'SED-104',
      driverId: 'DRV-101',
      driverName: 'Marcus Vance',
      timestamp: new Date().toISOString(),
      odometer: 32000,
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
      driverSignatureDataUrl: 'data:image/svg+xml;utf8,<svg></svg>',
      driverPrintedName: 'Marcus Vance'
    };

    service.submitDVIR(dvir);
    const vehicle = service.getVehicleByUnit('SED-104');
    expect(vehicle?.todayDvirStatus).toBe('passed');
    expect(vehicle?.lastOdometer).toBe(32000);
  });

  it('should enforce Hard Dispatch Lockout for expired credentials and missing OIG', () => {
    // DRV-103 has an expired license and overdue OIG in seed data
    const lockoutResult = service.evaluateDispatchEligibility('DRV-103', 'VAN-101');
    expect(lockoutResult.isEligible).toBeFalse();
    expect(lockoutResult.lockoutReasons.length).toBeGreaterThan(0);
    expect(lockoutResult.auditShieldPass).toBeFalse();
  });
});
