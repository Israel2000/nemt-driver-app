import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

/**
 * RiderTrackingComponent — public ride-status page (Phase 3).
 *
 * No login required. It calls GET /api/public/tracking/{token}, which
 * returns only the safe public subset: trip status, ETA, driver first
 * name + vehicle, and pickup/dropoff *areas* (city/state). No rider
 * address, no phone numbers, no signatures. An invalid or expired
 * token returns 404 and this page says the link is no longer valid.
 */

interface PublicTracking {
  tripCode: string;
  status: string;
  pickupArea: string | null;
  dropoffArea: string | null;
  eta: string | null;
  driverFirstName: string | null;
  vehicleLabel: string | null;
  expiresAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  ASSIGNED: 'Your ride is scheduled',
  EN_ROUTE_PICKUP: 'Your driver is on the way',
  ARRIVED_PICKUP: 'Your driver has arrived',
  IN_TRANSIT: 'You are on the way',
  COMPLETED: 'Trip completed',
  CANCELLED: 'Trip cancelled',
};

@Component({
  selector: 'app-rider-tracking',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="track-page">
      <div class="track-card" *ngIf="loading()">
        <p class="track-muted">Checking your ride status…</p>
      </div>

      <div class="track-card" *ngIf="error()">
        <h1>This tracking link is no longer valid</h1>
        <p class="track-muted">
          The link may have expired (links stay live until 24 hours after the
          trip ends) or the trip was changed. Ask the transport provider for a
          new link.
        </p>
        <a routerLink="/" class="track-home">Back to FleetOS</a>
      </div>

      <div class="track-card" *ngIf="view() as v">
        <span class="track-eyebrow">NEMT FleetOS · Ride tracking</span>
        <h1>{{ statusLabel(v.status) }}</h1>
        <p class="track-trip">Trip {{ v.tripCode }}</p>

        <div class="track-row">
          <span class="track-label">Pickup area</span>
          <span>{{ v.pickupArea || '—' }}</span>
        </div>
        <div class="track-row">
          <span class="track-label">Destination area</span>
          <span>{{ v.dropoffArea || '—' }}</span>
        </div>
        <div class="track-row" *ngIf="v.eta">
          <span class="track-label">Estimated arrival</span>
          <span>{{ v.eta | date: 'shortTime' }}</span>
        </div>
        <div class="track-row" *ngIf="v.driverFirstName">
          <span class="track-label">Driver</span>
          <span>{{ v.driverFirstName }} · {{ v.vehicleLabel || 'Vehicle' }}</span>
        </div>

        <p class="track-muted track-foot">
          This link expires {{ v.expiresAt | date: 'short' }}.
          For privacy, exact addresses and phone numbers are never shown here.
        </p>
        <button type="button" class="track-refresh" (click)="refresh()">Refresh status</button>
      </div>
    </div>
  `,
  styles: [`
    .track-page {
      min-height: 80vh;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 48px 16px;
      background: #f8fafc;
      font-family: 'DM Sans', system-ui, sans-serif;
    }
    .track-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      padding: 32px;
      width: 100%;
      max-width: 520px;
      box-sizing: border-box;
    }
    .track-eyebrow {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      color: #2563eb;
    }
    h1 {
      margin: 8px 0 4px;
      font-size: 24px;
      color: #0f172a;
    }
    .track-trip {
      margin: 0 0 20px;
      font-size: 13px;
      color: #64748b;
      font-family: monospace;
    }
    .track-row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid #f1f5f9;
      font-size: 14px;
      color: #0f172a;
    }
    .track-label { color: #64748b; font-weight: 500; }
    .track-muted { color: #64748b; font-size: 14px; line-height: 1.5; }
    .track-foot { margin-top: 20px; font-size: 12px; }
    .track-refresh {
      margin-top: 12px;
      width: 100%;
      padding: 10px 16px;
      border: none;
      border-radius: 12px;
      background: #2563eb;
      color: #ffffff;
      font-size: 14px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
    }
    .track-home { color: #2563eb; font-weight: 600; font-size: 14px; }
  `]
})
export class RiderTrackingComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly view = signal<PublicTracking | null>(null);

  private token = '';

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') ?? '';
    void this.refresh();
  }

  async refresh(): Promise<void> {
    this.loading.set(true);
    this.error.set(false);
    if (!this.token) {
      this.loading.set(false);
      this.error.set(true);
      return;
    }
    try {
      const res = await firstValueFrom(this.http.get<PublicTracking>(
        `/api/public/tracking/${encodeURIComponent(this.token)}`));
      this.view.set(res);
    } catch {
      this.view.set(null);
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  statusLabel(status: string): string {
    return STATUS_LABELS[status] ?? status;
  }
}
