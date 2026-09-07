import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type ApplicationStatus = 'new' | 'under_review' | 'mvr_pending' | 'approved' | 'rejected';

export interface Residence {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  yearsAtAddress: number | string;
}

export interface Employment {
  companyName: string;
  address?: string;
  phone?: string;
  fromDate: string;
  toDate: string;
  position: string;
  reasonForLeaving?: string;
}

export interface DriverApplication {
  confirmationNumber: string;
  submittedAt: string;
  status: ApplicationStatus;
  notes?: string;
  personal: {
    firstName: string;
    middleName?: string;
    lastName: string;
    phone: string;
    email: string;
    dob: string;
    ssn: string;
    dateOfApplication: string;
    positionAppliedFor: string;
    availableStartDate: string;
    legalRightToWork: string;
  };
  residences: Residence[];
  license: {
    state: string;
    licenseNumber: string;
    licenseClass: string;
    expirationDate: string;
    hasSuspensions: string;
    suspensionDetails?: string;
    licensePhotoDataUrl?: string;
    licensePhotoName?: string;
  };
  employment: Employment[];
  education: {
    highSchoolName?: string;
    highSchoolCourse?: string;
    highSchoolYears?: string;
    highSchoolGraduated?: string;
    collegeName?: string;
    collegeCourse?: string;
    collegeYears?: string;
    collegeGraduated?: string;
    otherSchoolName?: string;
    otherSchoolCourse?: string;
    otherSchoolYears?: string;
    otherSchoolGraduated?: string;
  };
  documents?: {
    w4FileName?: string;
    w4FileSize?: number;
    w4FileData?: string;
    licensePhotoDataUrl?: string;
    licensePhotoName?: string;
  };
  certification: {
    certifyTrue: boolean;
    authorizeInvestigation: boolean;
    statementAttestation?: boolean;
    printedName: string;
    signatureDate: string;
    signatureDataUrl: string;
  };
}

export interface ActiveDriver {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  licenseNumber: string;
  licenseState: string;
  licenseExpiration: string;
  cprExpiration: string;
  dotPhysicalExpiration: string;
  drugScreenDate: string;
  vehicleAssigned?: string;
  status: 'compliant' | 'warning' | 'expired';
}

export interface ComplianceMetrics {
  totalApplicants: number;
  pendingReview: number;
  approvedDrivers: number;
  expiringCredentialsCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class DriverAdminService {
  private readonly STORAGE_KEY = 'nemt_driver_applications';
  private applicationsSubject = new BehaviorSubject<DriverApplication[]>([]);
  public applications$: Observable<DriverApplication[]> = this.applicationsSubject.asObservable();

  private selectedApplicantSubject = new BehaviorSubject<DriverApplication | null>(null);
  public selectedApplicant$: Observable<DriverApplication | null> = this.selectedApplicantSubject.asObservable();

  constructor() {
    this.loadApplications();
  }

  public openReview(applicant: DriverApplication): void {
    this.selectedApplicantSubject.next(applicant);
  }

  public closeReview(): void {
    this.selectedApplicantSubject.next(null);
  }

  public getSelectedApplicant(): DriverApplication | null {
    return this.selectedApplicantSubject.value;
  }

  private loadApplications(): void {
    let items: DriverApplication[] = [];
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        items = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Error reading applications from localStorage', e);
    }

    // If no applications exist in localStorage, seed realistic sample NEMT driver applicants
    if (!items || items.length === 0) {
      items = this.getSeedApplications();
      this.saveToStorage(items);
    } else {
      // Ensure all loaded applications have a status field
      items = items.map(app => ({
        ...app,
        status: app.status || 'new'
      }));
    }

    this.applicationsSubject.next(items);
  }

  public getApplications(): DriverApplication[] {
    return this.applicationsSubject.value;
  }

  public getApplicationByConfirmation(confNumber: string): DriverApplication | undefined {
    return this.applicationsSubject.value.find(a => a.confirmationNumber === confNumber);
  }

  public updateStatus(confirmationNumber: string, newStatus: ApplicationStatus, notes?: string): void {
    const updated = this.applicationsSubject.value.map(app => {
      if (app.confirmationNumber === confirmationNumber) {
        const updatedApp = {
          ...app,
          status: newStatus,
          notes: notes !== undefined ? notes : app.notes
        };
        if (this.selectedApplicantSubject.value?.confirmationNumber === confirmationNumber) {
          this.selectedApplicantSubject.next(updatedApp);
        }
        return updatedApp;
      }
      return app;
    });

    this.saveToStorage(updated);
    this.applicationsSubject.next(updated);
  }

  public deleteApplication(confirmationNumber: string): void {
    if (this.selectedApplicantSubject.value?.confirmationNumber === confirmationNumber) {
      this.selectedApplicantSubject.next(null);
    }
    const updated = this.applicationsSubject.value.filter(a => a.confirmationNumber !== confirmationNumber);
    this.saveToStorage(updated);
    this.applicationsSubject.next(updated);
  }

  public getComplianceMetrics(): ComplianceMetrics {
    const apps = this.applicationsSubject.value;
    const active = this.getActiveDrivers();

    const expiringCount = active.filter(d => d.status === 'warning' || d.status === 'expired').length;

    return {
      totalApplicants: apps.length,
      pendingReview: apps.filter(a => a.status === 'new' || a.status === 'under_review' || a.status === 'mvr_pending').length,
      approvedDrivers: apps.filter(a => a.status === 'approved').length + active.length,
      expiringCredentialsCount: expiringCount
    };
  }

  public getActiveDrivers(): ActiveDriver[] {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const checkStatus = (dateStr: string): 'compliant' | 'warning' | 'expired' => {
      const expDate = new Date(dateStr);
      if (isNaN(expDate.getTime())) return 'compliant';
      if (expDate < now) return 'expired';
      if (expDate <= thirtyDaysFromNow) return 'warning';
      return 'compliant';
    };

    const seedDrivers: ActiveDriver[] = [
      {
        id: 'DRV-101',
        fullName: 'Marcus Vance',
        phone: '(303) 555-0192',
        email: 'marcus.vance@example.com',
        licenseNumber: 'CO-9842104',
        licenseState: 'CO',
        licenseExpiration: '2026-11-15',
        cprExpiration: '2026-09-25', // Expiring soon (< 30 days)
        dotPhysicalExpiration: '2027-04-10',
        drugScreenDate: '2025-08-10',
        vehicleAssigned: 'Van #4 (Wheelchair Ramp)',
        status: 'warning'
      },
      {
        id: 'DRV-102',
        fullName: 'Elena Rostova',
        phone: '(303) 555-8831',
        email: 'elena.rostova@example.com',
        licenseNumber: 'CO-7714902',
        licenseState: 'CO',
        licenseExpiration: '2027-08-20',
        cprExpiration: '2027-01-14',
        dotPhysicalExpiration: '2026-12-05',
        drugScreenDate: '2025-10-02',
        vehicleAssigned: 'Van #2 (Bariatric Lift)',
        status: 'compliant'
      },
      {
        id: 'DRV-103',
        fullName: 'Darnell Washington',
        phone: '(720) 555-4491',
        email: 'darnell.w@example.com',
        licenseNumber: 'CO-6029312',
        licenseState: 'CO',
        licenseExpiration: '2026-08-10', // Expired!
        cprExpiration: '2026-10-01',
        dotPhysicalExpiration: '2027-02-18',
        drugScreenDate: '2025-06-20',
        vehicleAssigned: 'Sedan #1 (Ambulatory)',
        status: 'expired'
      }
    ];

    // Compute overall status for each driver
    return seedDrivers.map(d => {
      const licStatus = checkStatus(d.licenseExpiration);
      const cprStatus = checkStatus(d.cprExpiration);
      const dotStatus = checkStatus(d.dotPhysicalExpiration);

      let overall: 'compliant' | 'warning' | 'expired' = 'compliant';
      if (licStatus === 'expired' || cprStatus === 'expired' || dotStatus === 'expired') {
        overall = 'expired';
      } else if (licStatus === 'warning' || cprStatus === 'warning' || dotStatus === 'warning') {
        overall = 'warning';
      }

      return {
        ...d,
        status: overall
      };
    });
  }

  private saveToStorage(items: DriverApplication[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Error saving applications to localStorage', e);
    }
  }

  private getSeedApplications(): DriverApplication[] {
    return [
      {
        confirmationNumber: 'NEMT-9K2L4X',
        submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'new',
        personal: {
          firstName: 'Robert',
          middleName: 'James',
          lastName: 'Miller',
          phone: '(720) 555-7381',
          email: 'robert.miller@example.com',
          dob: '1988-05-14',
          ssn: '***-**-4912',
          dateOfApplication: '2026-09-04',
          positionAppliedFor: 'NEMT Driver - Wheelchair Van',
          availableStartDate: '2026-09-15',
          legalRightToWork: 'yes'
        },
        residences: [
          {
            street: '1420 Colorado Blvd, Apt 3B',
            city: 'Denver',
            state: 'CO',
            zipCode: '80220',
            yearsAtAddress: 4
          },
          {
            street: '8801 E Colfax Ave',
            city: 'Aurora',
            state: 'CO',
            zipCode: '80010',
            yearsAtAddress: 3
          }
        ],
        license: {
          state: 'CO',
          licenseNumber: 'CO-9481023',
          licenseClass: 'Class C (Standard)',
          expirationDate: '2028-04-14',
          hasSuspensions: 'no',
          suspensionDetails: ''
        },
        employment: [
          {
            companyName: 'Mile High Logistics',
            address: 'Denver, CO',
            phone: '(303) 555-1100',
            fromDate: '03/2022',
            toDate: 'Present',
            position: 'Courier & Delivery Driver',
            reasonForLeaving: 'Seeking rewarding medical transportation career'
          },
          {
            companyName: 'Front Range Paratransit',
            address: 'Lakewood, CO',
            phone: '(303) 555-4300',
            fromDate: '06/2019',
            toDate: '02/2022',
            position: 'Ambulatory Driver',
            reasonForLeaving: 'Company relocated dispatch hub'
          }
        ],
        education: {
          highSchoolName: 'East High School, Denver',
          highSchoolCourse: 'High School Diploma',
          highSchoolYears: '4',
          highSchoolGraduated: 'yes',
          collegeName: 'Community College of Denver',
          collegeCourse: 'Associate of Arts (General Studies)',
          collegeYears: '2',
          collegeGraduated: 'yes'
        },
        documents: {
          w4FileName: 'Form_W4_Robert_Miller.pdf',
          w4FileSize: 245100
        },
        certification: {
          certifyTrue: true,
          authorizeInvestigation: true,
          printedName: 'Robert James Miller',
          signatureDate: '2026-09-04',
          signatureDataUrl: ''
        },
        notes: 'Has previous paratransit experience. Ready for MVR review.'
      },
      {
        confirmationNumber: 'NEMT-3T7W9A',
        submittedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'under_review',
        personal: {
          firstName: 'Sarah',
          lastName: 'Jenkins',
          phone: '(303) 555-9014',
          email: 's.jenkins@example.com',
          dob: '1992-11-28',
          ssn: '***-**-8123',
          dateOfApplication: '2026-09-02',
          positionAppliedFor: 'NEMT Driver - Stretcher & Wheelchair',
          availableStartDate: '2026-09-10',
          legalRightToWork: 'yes'
        },
        residences: [
          {
            street: '512 S Broadway',
            city: 'Denver',
            state: 'CO',
            zipCode: '80209',
            yearsAtAddress: 7
          }
        ],
        license: {
          state: 'CO',
          licenseNumber: 'CO-5519204',
          licenseClass: 'Class C (Standard)',
          expirationDate: '2027-10-09',
          hasSuspensions: 'no'
        },
        employment: [
          {
            companyName: 'Denver Senior Care Living',
            address: 'Denver, CO',
            phone: '(303) 555-8822',
            fromDate: '01/2021',
            toDate: 'Present',
            position: 'Resident Care Coordinator & Shuttle Driver',
            reasonForLeaving: 'Looking for full-time medical transit'
          }
        ],
        education: {
          highSchoolName: 'Cherry Creek High School',
          highSchoolCourse: 'Diploma',
          highSchoolYears: '4',
          highSchoolGraduated: 'yes'
        },
        documents: {
          w4FileName: 'W4_Jenkins_2026.pdf',
          w4FileSize: 182400
        },
        certification: {
          certifyTrue: true,
          authorizeInvestigation: true,
          printedName: 'Sarah Jenkins',
          signatureDate: '2026-09-02',
          signatureDataUrl: ''
        },
        notes: 'CPR and First Aid certified. Excellent phone interview.'
      },
      {
        confirmationNumber: 'NEMT-8F1P5Q',
        submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'approved',
        personal: {
          firstName: 'Jamal',
          lastName: 'Edwards',
          phone: '(720) 555-3382',
          email: 'jamal.e@example.com',
          dob: '1985-03-22',
          ssn: '***-**-3341',
          dateOfApplication: '2026-08-30',
          positionAppliedFor: 'NEMT Driver',
          availableStartDate: '2026-09-08',
          legalRightToWork: 'yes'
        },
        residences: [
          {
            street: '3401 W 38th Ave',
            city: 'Denver',
            state: 'CO',
            zipCode: '80211',
            yearsAtAddress: 5
          }
        ],
        license: {
          state: 'CO',
          licenseNumber: 'CO-8821034',
          licenseClass: 'Class B (CDL)',
          expirationDate: '2029-01-18',
          hasSuspensions: 'no'
        },
        employment: [
          {
            companyName: 'Rocky Mountain Transit',
            address: 'Denver, CO',
            phone: '(303) 555-9921',
            fromDate: '05/2018',
            toDate: '08/2026',
            position: 'Paratransit Van Operator',
            reasonForLeaving: 'Company ownership change'
          }
        ],
        education: {
          highSchoolName: 'West High School',
          highSchoolCourse: 'General Studies',
          highSchoolYears: '4',
          highSchoolGraduated: 'yes'
        },
        documents: {
          w4FileName: 'Jamal_Edwards_W4.pdf',
          w4FileSize: 312000
        },
        certification: {
          certifyTrue: true,
          authorizeInvestigation: true,
          printedName: 'Jamal Edwards',
          signatureDate: '2026-08-30',
          signatureDataUrl: ''
        },
        notes: 'All checks passed: Clean MVR (0 points), clean 10-panel drug test, clean 7-year background check. Ready for vehicle assignment.'
      }
    ];
  }
}
