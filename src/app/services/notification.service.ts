import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

/**
 * NotificationService — in-app notifications (Phase 3).
 *
 * The server records trip + claim events as persistent notifications
 * (GET /api/notifications). This service polls them every 60s while the
 * user is signed in; when the backend is unreachable the poll quietly
 * stops and the bell shows nothing — no fake notifications are invented.
 *
 * Real push delivery (WebPush/VAPID + service worker) is NOT built yet:
 * the backend exposes a stubbed channel only. See backend/README.md.
 */

export interface AppNotification {
  id: string;
  type: 'TRIP_ASSIGNED' | 'EN_ROUTE' | 'ARRIVED' | 'TRIP_COMPLETED' | 'CLAIM_DENIED' | 'MESSAGE';
  title: string;
  body: string;
  tripCode?: string | null;
  read: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private http = inject(HttpClient);
  private readonly API_URL = '/api/notifications';
  private apiReachable: boolean | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;

  readonly notifications = signal<AppNotification[]>([]);
  readonly unreadCount = signal(0);
  readonly serverMode = signal(false);

  private hasJwt(): boolean {
    try {
      return !!localStorage.getItem('nemt_jwt');
    } catch {
      return false;
    }
  }

  /** Start polling (call once after sign-in); stop on sign-out. */
  startPolling(): void {
    if (this.timer) {
      return;
    }
    void this.refresh();
    this.timer = setInterval(() => void this.refresh(), 60_000);
  }

  stopPolling(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.notifications.set([]);
    this.unreadCount.set(0);
    this.serverMode.set(false);
  }

  async refresh(): Promise<void> {
    if (!this.hasJwt() || this.apiReachable === false) {
      return;
    }
    try {
      const list = await firstValueFrom(this.http.get<AppNotification[]>(this.API_URL));
      this.apiReachable = true;
      this.serverMode.set(true);
      this.notifications.set(list);
      this.unreadCount.set(list.filter(n => !n.read).length);
    } catch (err: unknown) {
      if ((err as { status?: number })?.status === 0) {
        this.apiReachable = false;
      }
    }
  }

  async markRead(id: string): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`${this.API_URL}/${encodeURIComponent(id)}/read`, {}));
      await this.refresh();
    } catch {
      // Offline: leave the local copy as-is; it refreshes on the next poll.
    }
  }

  async markAllRead(): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`${this.API_URL}/read-all`, {}));
      await this.refresh();
    } catch {
      // Offline: leave as-is.
    }
  }
}
