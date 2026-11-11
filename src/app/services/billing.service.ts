import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

/**
 * BillingService — claims built from completed + billable trips.
 *
 * Dual-mode (Phase 2 pattern): when a backend is reachable the claims
 * come from /api/billing; when it is not (Vercel, no backend yet) the
 * page shows demo claims from localStorage, exactly as before. Actions
 * (submit / mark paid / mark denied) call the API first and fall back to
 * updating the local demo claim.
 *
 * Amounts: the server prices claims at the documented $45.00 placeholder
 * rate until real broker rate tables exist — the demo claims below use
 * the same rate so the two modes agree.
 */

export interface Claim {
  id: string;
  claimNumber: string;
  tripCode: string;
  riderName: string;
  broker?: string | null;
  payer?: string | null;
  status: 'DRAFT' | 'SUBMITTED' | 'PAID' | 'DENIED';
  amount: number;
  currency: string;
  denialReason?: string | null;
  submittedAt?: string | null;
  paidAt?: string | null;
  createdAt?: string | null;
  placeholders?: string[];
}

export interface Cms1500View {
  claimNumber: string;
  tripCode: string;
  status: string;
  amount: number;
  cms1500: Record<string, unknown> | null;
  note: string;
}

const CLAIMS_KEY = 'nemt_demo_claims';

const DEMO_CLAIMS: Claim[] = [
  {
    id: 'demo-clm-1',
    claimNumber: 'CLM-1001',
    tripCode: 'TRP-100',
    riderName: 'Robert Chen',
    broker: 'MODIVCARE',
    payer: 'ModivCare',
    status: 'SUBMITTED',
    amount: 45.0,
    currency: 'USD',
    submittedAt: '2026-11-08T15:00:00Z',
    createdAt: '2026-11-08T14:00:00Z',
    placeholders: ['amount (flat $45.00 placeholder rate)'],
  },
  {
    id: 'demo-clm-2',
    claimNumber: 'CLM-1002',
    tripCode: 'TRP-100',
    riderName: 'Robert Chen',
    broker: 'MTM',
    payer: 'MTM',
    status: 'DRAFT',
    amount: 45.0,
    currency: 'USD',
    createdAt: '2026-11-09T09:00:00Z',
    placeholders: ['amount (flat $45.00 placeholder rate)'],
  },
];

@Injectable({ providedIn: 'root' })
export class BillingService {
  private http = inject(HttpClient);

  /** Phase 3 API base (dev proxy → :8080; unreachable on Vercel → local mode). */
  private readonly API_URL = '/api/billing';
  private apiReachable: boolean | null = null;

  /** True once a real claim list has been loaded from the server. */
  readonly serverMode = signal(false);

  private claimsSignal = signal<Claim[]>(this.loadDemo());
  readonly claims = this.claimsSignal.asReadonly();

  private hasJwt(): boolean {
    try {
      return !!localStorage.getItem('nemt_jwt');
    } catch {
      return false;
    }
  }

  constructor() {
    void this.refreshFromServer();
  }

  private loadDemo(): Claim[] {
    try {
      const raw = localStorage.getItem(CLAIMS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Claim[];
        if (parsed.length) return parsed;
      }
    } catch {
      // fall through to the seed
    }
    try {
      localStorage.setItem(CLAIMS_KEY, JSON.stringify(DEMO_CLAIMS));
    } catch {
      // ignore
    }
    return [...DEMO_CLAIMS];
  }

  private persistDemo(claims: Claim[]): void {
    try {
      localStorage.setItem(CLAIMS_KEY, JSON.stringify(claims));
    } catch {
      // ignore
    }
  }

  /** Pull the server claim list; demo claims stay when unreachable. */
  async refreshFromServer(): Promise<void> {
    if (!this.hasJwt() || this.apiReachable === false) {
      return;
    }
    try {
      const server = await firstValueFrom(this.http.get<Claim[]>(`${this.API_URL}/claims`));
      this.apiReachable = true;
      this.serverMode.set(true);
      this.claimsSignal.set(server);
    } catch (err: unknown) {
      if ((err as { status?: number })?.status === 0) {
        this.apiReachable = false;
      }
      // No backend: keep the demo claims exactly as they are.
    }
  }

  /** Create a claim from a completed + billable trip (server, else demo). */
  async createClaimFromTrip(tripCode: string, broker?: string, payer?: string): Promise<Claim | null> {
    if (this.hasJwt() && this.apiReachable !== false) {
      try {
        const created = await firstValueFrom(this.http.post<Claim>(
          `${this.API_URL}/claims/from-trip/${encodeURIComponent(tripCode)}`,
          { broker, payer }));
        this.apiReachable = true;
        this.serverMode.set(true);
        await this.refreshFromServer();
        return created;
      } catch (err: unknown) {
        if ((err as { status?: number })?.status === 0) {
          this.apiReachable = false;
        } else {
          // 409 (not billable / already claimed): surface it, don't fake one.
          throw err;
        }
      }
    }
    const demo: Claim = {
      id: `demo-clm-${Date.now()}`,
      claimNumber: `CLM-${1000 + this.claimsSignal().length + 1}`,
      tripCode,
      riderName: '—',
      broker: broker ?? null,
      payer: payer ?? broker ?? 'Medicaid',
      status: 'DRAFT',
      amount: 45.0,
      currency: 'USD',
      createdAt: new Date().toISOString(),
      placeholders: ['amount (flat $45.00 placeholder rate)'],
    };
    this.claimsSignal.update(list => [demo, ...list]);
    this.persistDemo(this.claimsSignal());
    return demo;
  }

  private async transition(
    claim: Claim,
    action: 'submit' | 'mark-paid' | 'mark-denied',
    body?: Record<string, unknown>
  ): Promise<void> {
    if (this.hasJwt() && this.apiReachable !== false) {
      try {
        await firstValueFrom(this.http.post(
          `${this.API_URL}/claims/${encodeURIComponent(claim.id)}/${action}`, body ?? {}));
        this.apiReachable = true;
        await this.refreshFromServer();
        return;
      } catch (err: unknown) {
        if ((err as { status?: number })?.status === 0) {
          this.apiReachable = false;
        } else {
          throw err;
        }
      }
    }
    const status: Claim['status'] =
      action === 'submit' ? 'SUBMITTED' : action === 'mark-paid' ? 'PAID' : 'DENIED';
    this.claimsSignal.update(list =>
      list.map(c => (c.id === claim.id
        ? { ...c, status, denialReason: action === 'mark-denied' ? (body?.['reason'] as string) ?? c.denialReason : c.denialReason }
        : c)));
    this.persistDemo(this.claimsSignal());
  }

  submitClaim(claim: Claim): Promise<void> {
    return this.transition(claim, 'submit');
  }

  markPaid(claim: Claim): Promise<void> {
    return this.transition(claim, 'mark-paid');
  }

  markDenied(claim: Claim, reason: string): Promise<void> {
    return this.transition(claim, 'mark-denied', { reason });
  }

  /** Structured CMS-1500 form data for a claim (server only; demo → null). */
  async fetchCms1500(claim: Claim): Promise<Cms1500View | null> {
    if (!this.hasJwt() || this.apiReachable === false || claim.id.startsWith('demo-')) {
      return null;
    }
    try {
      return await firstValueFrom(this.http.get<Cms1500View>(
        `${this.API_URL}/claims/${encodeURIComponent(claim.id)}/cms1500`));
    } catch {
      return null;
    }
  }
}
