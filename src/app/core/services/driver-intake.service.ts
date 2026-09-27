import { Injectable, signal, computed } from '@angular/core';
import { DriverApplicant, INITIAL_DRIVERS } from '../data/mock-drivers';

@Injectable({
  providedIn: 'root'
})
export class DriverIntakeService {
  private readonly STORAGE_KEY = 'nemt_driver_applicants_db';

  private driversSignal = signal<DriverApplicant[]>(this.loadInitialDrivers());
  readonly drivers = this.driversSignal.asReadonly();

  readonly activeDrivers = computed(() =>
    this.driversSignal().filter(d => d.status === 'active')
  );

  readonly pendingReviewDrivers = computed(() =>
    this.driversSignal().filter(d => d.status === 'pending_review')
  );

  readonly approvedDrivers = computed(() =>
    this.driversSignal().filter(d => d.status === 'approved')
  );

  readonly totalCount = computed(() => this.driversSignal().length);
  readonly activeCount = computed(() => this.activeDrivers().length);
  readonly pendingCount = computed(() => this.pendingReviewDrivers().length);

  private loadInitialDrivers(): DriverApplicant[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not read stored drivers from localStorage', e);
    }
    return INITIAL_DRIVERS;
  }

  private saveDrivers(drivers: DriverApplicant[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(drivers));
    } catch (e) {
      console.warn('Could not persist drivers to localStorage', e);
    }
  }

  addApplicant(
    applicant: Omit<DriverApplicant, 'id' | 'appliedDate' | 'status'> & {
      id?: string;
      appliedDate?: string;
      status?: 'pending_review' | 'approved' | 'active';
    }
  ): DriverApplicant {
    const nextId =
      applicant.id ||
      `DRV-${String(Math.floor(10 + Math.random() * 890)).padStart(3, '0')}`;
    const today =
      applicant.appliedDate || new Date().toISOString().split('T')[0];

    const newDriver: DriverApplicant = {
      ...applicant,
      id: nextId,
      status: applicant.status || 'pending_review',
      appliedDate: today
    };

    this.driversSignal.update(list => {
      const updated = [newDriver, ...list];
      this.saveDrivers(updated);
      return updated;
    });

    return newDriver;
  }

  updateStatus(
    id: string,
    status: 'pending_review' | 'approved' | 'active'
  ): void {
    this.driversSignal.update(list => {
      const updated = list.map(d => (d.id === id ? { ...d, status } : d));
      this.saveDrivers(updated);
      return updated;
    });
  }

  updateApplicant(id: string, data: Partial<DriverApplicant>): void {
    this.driversSignal.update(list => {
      const updated = list.map(d => (d.id === id ? { ...d, ...data } : d));
      this.saveDrivers(updated);
      return updated;
    });
  }

  deleteApplicant(id: string): void {
    this.driversSignal.update(list => {
      const updated = list.filter(d => d.id !== id);
      this.saveDrivers(updated);
      return updated;
    });
  }

  getApplicant(id: string): DriverApplicant | undefined {
    return this.driversSignal().find(d => d.id === id);
  }

  resetToDefault(): void {
    this.driversSignal.set(INITIAL_DRIVERS);
    this.saveDrivers(INITIAL_DRIVERS);
  }
}
