import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { NotificationService } from '../../services/notification.service';

/**
 * NotificationBell — in-app notification bell (Phase 3).
 *
 * Shows the server notification list when the backend is reachable
 * (60s polling); shows nothing at all when it is not — no fake data.
 * Used in the admin topbar and the driver header.
 */
@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatBadgeModule, MatMenuModule],
  template: `
    <button mat-icon-button
            [matMenuTriggerFor]="menu"
            aria-label="Notifications"
            [matBadge]="unread()"
            [matBadgeHidden]="unread() === 0"
            matBadgeColor="warn"
            matBadgeSize="small"
            (click)="refresh()">
      <mat-icon>notifications</mat-icon>
    </button>
    <mat-menu #menu="matMenu" class="notification-menu">
      <div class="menu-head">
        <strong>Notifications</strong>
        <button type="button" class="mark-all" (click)="markAllRead($event)">Mark all read</button>
      </div>
      <div class="menu-body" *ngIf="items().length > 0; else emptyState" (click)="$event.stopPropagation()">
        <button mat-menu-item *ngFor="let n of items()" (click)="markRead(n.id)" [class.unread]="!n.read">
          <span class="notif-title">{{ n.title }}</span>
          <span class="notif-body">{{ n.body }}</span>
          <span class="notif-time">{{ n.createdAt | date: 'short' }}</span>
        </button>
      </div>
      <ng-template #emptyState>
        <div class="menu-empty" (click)="$event.stopPropagation()">
          {{ serverMode() ? 'No notifications yet.' : 'Notifications need the backend — none available offline.' }}
        </div>
      </ng-template>
    </mat-menu>
  `,
  styles: [`
    .menu-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px 8px;
      font-size: 14px;
      color: #0f172a;
    }
    .mark-all {
      border: none;
      background: none;
      color: #2563eb;
      font-size: 12px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      padding: 0;
    }
    .menu-body {
      max-height: 320px;
      overflow-y: auto;
    }
    .menu-empty {
      padding: 16px;
      font-size: 13px;
      color: #64748b;
      max-width: 300px;
    }
    .notif-title {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: #0f172a;
      white-space: normal;
      line-height: 1.3;
    }
    .notif-body {
      display: block;
      font-size: 12px;
      color: #64748b;
      white-space: normal;
      line-height: 1.4;
    }
    .notif-time {
      display: block;
      font-size: 11px;
      color: #94a3b8;
      margin-top: 2px;
    }
    button[mat-menu-item].unread {
      background: #eff6ff;
    }
  `]
})
export class NotificationBellComponent {
  private notifications = inject(NotificationService);

  items = this.notifications.notifications;
  unread = this.notifications.unreadCount;
  serverMode = this.notifications.serverMode;

  refresh(): void {
    void this.notifications.refresh();
  }

  markRead(id: string): void {
    void this.notifications.markRead(id);
  }

  markAllRead(event: Event): void {
    event.stopPropagation();
    void this.notifications.markAllRead();
  }
}
