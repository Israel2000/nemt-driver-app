export interface DriverApplicant {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  licenseNumber: string;
  licenseExp: string;
  cprCertified: boolean;
  cprExp: string;
  dotCardValid: boolean;
  dotExp: string;
  status: 'pending_review' | 'approved' | 'active';
  appliedDate: string;
  vehicleAssigned?: string;
  notes?: string;
}

export const INITIAL_DRIVERS: DriverApplicant[] = [
  {
    id: 'DRV-001',
    fullName: 'Marcus Vance',
    email: 'marcus.vance@metrocare.example',
    phone: '(720) 555-0142',
    city: 'Denver',
    state: 'CO',
    licenseNumber: 'CO-948201',
    licenseExp: '2027-04-15',
    cprCertified: true,
    cprExp: '2026-11-20',
    dotCardValid: true,
    dotExp: '2027-01-10',
    status: 'active',
    appliedDate: '2026-08-10',
    vehicleAssigned: 'Van #4'
  },
  {
    id: 'DRV-002',
    fullName: 'Sarah Jenkins',
    email: 'sarah.j@transitworks.example',
    phone: '(303) 555-0199',
    city: 'Aurora',
    state: 'CO',
    licenseNumber: 'CO-839102',
    licenseExp: '2026-10-05',
    cprCertified: true,
    cprExp: '2026-10-15',
    dotCardValid: true,
    dotExp: '2026-12-01',
    status: 'pending_review',
    appliedDate: '2026-09-22',
    vehicleAssigned: 'Van #2 (Staging)'
  },
  {
    id: 'DRV-003',
    fullName: 'Derrick Reynolds',
    email: 'd.reynolds@denvertransit.example',
    phone: '(720) 555-0812',
    city: 'Lakewood',
    state: 'CO',
    licenseNumber: 'CO-771923',
    licenseExp: '2028-02-18',
    cprCertified: true,
    cprExp: '2027-05-12',
    dotCardValid: true,
    dotExp: '2026-11-04',
    status: 'approved',
    appliedDate: '2026-09-18',
    vehicleAssigned: 'Van #5'
  }
];
