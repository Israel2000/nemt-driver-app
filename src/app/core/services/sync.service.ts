import { Injectable, signal, computed } from '@angular/core';
import { TripStatus } from '../models/trip.model';

/**
 * SyncService — the driver ↔ dispatch interconnection layer, frontend-only.
 *
 * What it does (RouteGenie / Bambi / MediRoutes pattern, simulated locally
 * until the backend phase):
 *  - Online/offline state: real `navigator.onLine` + online/offline events,
 *    plus a demo "Simulate offline" toggle so Israel can watch the outbox
 *    work without opening devtools.
 *  - Offline outbox: every status change / message captured while offline is
 *    queued in localStorage, shown as "N events pending", and flushed (in
 *    order) on reconnect. There is no server yet, so "sync" here means:
 *    persist locally + broadcast to other tabs. The UI labels it honestly
 *    ("Synced locally") and the backend phase replaces the flush with a
 *    real API call — the queue shape (ordered, retryable, per-event) is
 *    already the shape the backend needs.
 *  - Live activity / audit log: every status transition, assignment,
 *    message and exception, GPS- + timestamp-stamped, persisted so the
 *    dispatch board's activity feed and the audit trail survive refresh.
 *  - Two-way messaging: driver ↔ dispatch threads, canned messages,
 *    persisted to localStorage.
 *  - Cross-tab sync: BroadcastChannel ('nemt-sync') + `storage` events, so
 *    a driver status tap in one tab updates the dispatch board in another
 *    tab within a second, with no reload.
 */

export type SyncEventKind =
  | 'status'
  | 'assignment'
  | 'message'
  | 'securement'
  | 'signature'
  | 'dvir'
  | 'exception';

export interface QueuedEvent {
  id: string;
  kind: SyncEventKind;
  tripId?: string;
  summary: string;
  queuedAtIso: string;
  queuedAt: string;
}

export interface TripActivityEvent {
  id: string;
  tripId?: string;
  tripLabel?: string;
  kind: SyncEventKind;
  summary: string;
  by: 'driver' | 'dispatch' | 'system';
  byName?: string;
  at: string;
  atIso: string;
  lat?: number;
  lng?: number;
  gpsSource?: 'device' | 'estimated' | 'unavailable';
  synced: boolean;
}

export interface DispatchMessage {
  id: string;
  from: 'driver' | 'dispatch';
  fromName: string;
  tripId?: string | null;
  tripLabel?: string;
  text: string;
  canned?: boolean;
  at: string;
  atIso: string;
}

export const CANNED_MESSAGES: { label: string; text: string }[] = [
  { label: 'Running late', text: 'Running about 10 minutes late to pickup — traffic. ETA updated.' },
  { label: 'Arrived, no answer', text: 'Arrived at pickup — no answer at the door. Waiting 5 minutes, then will call dispatch.' },
  { label: 'Rider not ready', text: 'Rider is not ready yet. Waiting at pickup.' },
  { label: 'Vehicle issue', text: 'Vehicle issue — need dispatch guidance before continuing.' },
  { label: 'Need help', text: 'Need dispatch assistance on this trip.' },
  { label: 'On my way', text: 'On my way — see you shortly.' },
];

const OUTBOX_KEY = 'nemt_sync_outbox';
const ACTIVITY_KEY = 'nemt_trip_activity';
const MESSAGES_KEY = 'nemt_dispatch_messages';
const LAST_SYNCED_KEY = 'nemt_last_synced';
const CHANNEL_NAME = 'nemt-sync';

function nowDisplay(): string {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function uid(): string {
  return `ev-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

@Injectable({ providedIn: 'root' })
export class SyncService {
  /** Real browser online state, OR-ed with the demo toggle below. */
  private browserOnline = signal<boolean>(typeof navigator === 'undefined' ? true : navigator.onLine);
  /** Demo toggle: "Simulate offline" on the driver screen. */
  private simulateOffline = signal<boolean>(false);

  readonly online = computed(() => this.browserOnline() && !this.simulateOffline());
  readonly simulatedOffline = this.simulateOffline.asReadonly();

  private outboxSignal = signal<QueuedEvent[]>([]);
  readonly outbox = this.outboxSignal.asReadonly();
  readonly pendingCount = computed(() => this.outboxSignal().length);

  private lastSyncedSignal = signal<string | null>(null);
  readonly lastSyncedAt = this.lastSyncedSignal.asReadonly();

  private activitySignal = signal<TripActivityEvent[]>([]);
  readonly activity = this.activitySignal.asReadonly();

  private messagesSignal = signal<DispatchMessage[]>([]);
  readonly messages = this.messagesSignal.asReadonly();

  private channel: BroadcastChannel | null = null;

  constructor() {
    this.outboxSignal.set(this.read<QueuedEvent[]>(OUTBOX_KEY, []));
    this.activitySignal.set(this.read<TripActivityEvent[]>(ACTIVITY_KEY, []));
    this.lastSyncedSignal.set(this.read<string | null>(LAST_SYNCED_KEY, null));
    this.messagesSignal.set(this.read<DispatchMessage[]>(MESSAGES_KEY, []));

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.browserOnline.set(true);
        this.flushOutbox();
      });
      window.addEventListener('offline', () => this.browserOnline.set(false));
      window.addEventListener('storage', (e) => {
        // Another tab persisted trips/messages/activity: re-read our copies
        // so the dispatch board updates without a reload.
        if (e.key === ACTIVITY_KEY) this.activitySignal.set(this.read<TripActivityEvent[]>(ACTIVITY_KEY, []));
        if (e.key === MESSAGES_KEY) this.messagesSignal.set(this.read<DispatchMessage[]>(MESSAGES_KEY, []));
        if (e.key === OUTBOX_KEY) this.outboxSignal.set(this.read<QueuedEvent[]>(OUTBOX_KEY, []));
        if (e.key === LAST_SYNCED_KEY) this.lastSyncedSignal.set(this.read<string | null>(LAST_SYNCED_KEY, null));
      });
    }

    try {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.onmessage = (ev: MessageEvent) => {
        const msg = ev.data as { type?: string };
        if (!msg || typeof msg !== 'object') return;
        if (msg.type === 'trips-changed' || msg.type === 'messages-changed' || msg.type === 'activity-changed') {
          // Trip state itself is re-read by TripService's storage listener;
          // here we just refresh our own copies.
          this.activitySignal.set(this.read<TripActivityEvent[]>(ACTIVITY_KEY, []));
          this.messagesSignal.set(this.read<DispatchMessage[]>(MESSAGES_KEY, []));
          this.outboxSignal.set(this.read<QueuedEvent[]>(OUTBOX_KEY, []));
        }
        if (msg.type === 'outbox-flushed') {
          this.lastSyncedSignal.set(this.read<string | null>(LAST_SYNCED_KEY, null));
        }
      };
    } catch {
      this.channel = null; // Older browsers: storage events still cover it.
    }
  }

  /** Demo toggle used on the driver screen (labelled as a simulation). */
  setSimulateOffline(value: boolean): void {
    this.simulateOffline.set(value);
    if (!value) this.flushOutbox();
  }

  /** Broadcast a trips-changed ping to other tabs. */
  notifyTripsChanged(): void {
    try { this.channel?.postMessage({ type: 'trips-changed', at: new Date().toISOString() }); } catch { /* ignore */ }
  }

  notifyMessagesChanged(): void {
    try { this.channel?.postMessage({ type: 'messages-changed', at: new Date().toISOString() }); } catch { /* ignore */ }
  }

  /**
   * Record a syncable event. Online: applied + marked synced immediately.
   * Offline: queued in the outbox (ordered) and the activity entry is
   * marked pending until the flush on reconnect.
   */
  recordEvent(event: Omit<TripActivityEvent, 'id' | 'at' | 'atIso' | 'synced'>): TripActivityEvent {
    const full: TripActivityEvent = {
      ...event,
      id: uid(),
      at: nowDisplay(),
      atIso: new Date().toISOString(),
      synced: this.online(),
    };
    this.activitySignal.update(list => [full, ...list].slice(0, 100));
    this.write(ACTIVITY_KEY, this.activitySignal());
    try { this.channel?.postMessage({ type: 'activity-changed', at: full.atIso }); } catch { /* ignore */ }

    if (this.online()) {
      this.markSynced();
    } else {
      const queued: QueuedEvent = {
        id: full.id,
        kind: full.kind,
        tripId: full.tripId,
        summary: full.summary,
        queuedAtIso: full.atIso,
        queuedAt: full.at,
      };
      this.outboxSignal.update(list => [...list, queued]);
      this.write(OUTBOX_KEY, this.outboxSignal());
    }
    return full;
  }

  /** Flush the outbox on reconnect, oldest first; marks entries synced. */
  flushOutbox(): void {
    const pending = this.outboxSignal();
    if (pending.length === 0) {
      this.markSynced();
      return;
    }
    const pendingIds = new Set(pending.map(p => p.id));
    this.activitySignal.update(list =>
      list.map(e => (pendingIds.has(e.id) ? { ...e, synced: true } : e))
    );
    this.write(ACTIVITY_KEY, this.activitySignal());
    this.outboxSignal.set([]);
    this.write(OUTBOX_KEY, []);
    this.markSynced();
    try { this.channel?.postMessage({ type: 'outbox-flushed', at: new Date().toISOString() }); } catch { /* ignore */ }
  }

  private markSynced(): void {
    const at = nowDisplay();
    this.lastSyncedSignal.set(at);
    this.write(LAST_SYNCED_KEY, at);
  }

  /** Two-way driver ↔ dispatch messaging (persisted + cross-tab). */
  sendMessage(msg: Omit<DispatchMessage, 'id' | 'at' | 'atIso'>): DispatchMessage {
    const full: DispatchMessage = {
      ...msg,
      id: uid(),
      at: nowDisplay(),
      atIso: new Date().toISOString(),
    };
    this.messagesSignal.update(list => [...list, full].slice(-200));
    this.write(MESSAGES_KEY, this.messagesSignal());
    this.notifyMessagesChanged();
    if (this.online()) {
      this.markSynced();
    } else {
      this.outboxSignal.update(list => [
        ...list,
        { id: full.id, kind: 'message', tripId: full.tripId ?? undefined, summary: full.text, queuedAtIso: full.atIso, queuedAt: full.at },
      ]);
      this.write(OUTBOX_KEY, this.outboxSignal());
    }
    return full;
  }

  messagesForTrip(tripId: string | null | undefined): DispatchMessage[] {
    return this.messagesSignal().filter(m => !tripId || m.tripId === tripId || m.tripId === null);
  }

  /** Human status label for a TripStatus value (shared by driver + dispatch). */
  static statusLabel(status: TripStatus): string {
    switch (status) {
      case 'scheduled': return 'Scheduled';
      case 'en_route_pickup': return 'En Route';
      case 'arrived_pickup': return 'At Pickup';
      case 'in_transit': return 'In Transit';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      case 'no_show': return 'No-Show';
      case 'delayed': return 'Delayed';
      default: return status;
    }
  }

  private read<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  }

  private write(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage unavailable: in-memory state still works for this tab.
    }
  }
}
