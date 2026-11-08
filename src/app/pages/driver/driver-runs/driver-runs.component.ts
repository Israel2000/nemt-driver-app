import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TripService, GpsFix } from '../../../core/services/trip.service';
import { SyncService, CANNED_MESSAGES } from '../../../core/services/sync.service';
import { Trip, TripStatus } from '../../../core/models/trip.model';

const EXCEPTION_REASONS: Record<string, string[]> = {
  no_show: ['Rider not home', 'Rider refused transport', 'Wrong address', 'Facility closed'],
  delayed: ['Traffic', 'Previous trip ran long', 'Vehicle issue', 'Rider not ready'],
  cancelled: ['Rider cancelled', 'Dispatch cancelled', 'Weather', 'Vehicle issue'],
};

@Component({
  selector: 'app-driver-runs',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="space-y-4">
      <!-- Title & sync status (RouteGenie/Bambi pattern: live + last-synced + pending) -->
      <div class="flex items-start justify-between gap-2">
        <div>
          <h1 class="text-xl font-bold text-slate-900">Today's Assigned Runs</h1>
          <p class="text-xs text-slate-500">Fleet Trip Stepper &amp; Medicaid Proof</p>
        </div>
        <span class="text-xs font-semibold px-2.5 py-1 rounded-full"
              [ngClass]="tripService.activeDriverTrips().length > 0 ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'">
          {{ tripService.activeDriverTrips().length }} Active
        </span>
      </div>

      <!-- Live sync badge -->
      <div class="bg-white rounded-xl border border-slate-200 px-3 py-2 flex items-center justify-between gap-2 text-xs shadow-sm">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full" [ngClass]="syncService.online() ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'"></span>
          @if (syncService.online()) {
            <span class="font-bold text-emerald-700">Live — synced locally{{ syncService.lastSyncedAt() ? ' · ' + syncService.lastSyncedAt() : '' }}</span>
          } @else {
            <span class="font-bold text-amber-700">Offline — {{ syncService.pendingCount() }} event(s) queued, will sync on reconnect</span>
          }
        </div>
        <button type="button" (click)="toggleSimulateOffline()"
          class="px-2 py-1 rounded-lg border text-[11px] font-bold cursor-pointer"
          [ngClass]="syncService.simulatedOffline() ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'">
          {{ syncService.simulatedOffline() ? 'Go back online' : 'Simulate offline' }}
        </button>
      </div>
      <p class="text-[10px] text-slate-400 -mt-2">Live GPS updates while this tab is open. Background tracking while the tab is closed needs the backend / PWA phase — it is not faked here.</p>

      <!-- Active Trip Cards Loop -->
      @for (trip of tripService.activeDriverTrips(); track trip.id) {
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div class="flex items-start justify-between">
            <div>
              <span class="px-2.5 py-1 rounded-full text-xs font-bold"
                    [ngClass]="trip.mobility === 'wheelchair' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'">
                {{ trip.mobility === 'wheelchair' ? 'Wheelchair (WC)' : (trip.mobility === 'stretcher' ? 'Stretcher' : 'Ambulatory') }}
              </span>
              <h2 class="text-lg font-bold text-slate-900 mt-2">{{ trip.patientName }}</h2>
              <span class="text-[11px] text-slate-400 font-mono">Trip ID: {{ trip.id }}</span>
              @if (trip.status !== 'scheduled') {
                <span class="block text-[11px] text-slate-500 mt-1">ETA to {{ trip.status === 'in_transit' ? 'drop-off' : 'pickup' }}: ~{{ tripService.etaMinutes(trip, trip.status === 'in_transit') ?? '—' }} min · Last update {{ lastEventAt(trip) }}</span>
              }
            </div>
            <span class="text-sm font-bold text-blue-600">{{ trip.scheduledTime }}</span>
          </div>

          <div class="space-y-2 text-sm">
            <div class="flex items-start gap-2">
              <span class="text-emerald-600 font-bold">●</span>
              <p class="text-slate-600"><strong class="text-slate-800">Pickup:</strong> {{ trip.pickupAddress }}</p>
            </div>
            <div class="flex items-start gap-2">
              <span class="text-rose-600 font-bold">■</span>
              <p class="text-slate-600"><strong class="text-slate-800">Drop-off:</strong> {{ trip.dropoffAddress }}</p>
            </div>
            @if (trip.mobility === 'wheelchair') {
              <p class="text-xs font-semibold" [ngClass]="trip.wheelchairSecurement ? 'text-emerald-700' : 'text-amber-700'">
                {{ trip.wheelchairSecurement ? '✓ Wheelchair securement completed ' + (trip.wheelchairSecurement.completedAt || '') : '⚠ Wheelchair securement checklist required before boarding' }}
              </p>
            }
          </div>

          <!-- Turn-by-Turn Navigation Quick Action -->
          <div class="pt-1">
            <a [href]="getNavigationUrl(trip)"
               target="_blank"
               rel="noopener noreferrer"
               class="w-full py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold flex items-center justify-center gap-2 transition shadow-xs">
              <span>{{ getNavTargetLabel(trip) }} (Google Maps)</span>
              <span>↗</span>
            </a>
          </div>

          <!-- One-Tap Action Button based on Status -->
          <div class="pt-2">
            @if (trip.status === 'scheduled') {
              <button (click)="advanceStatus(trip.id, 'en_route_pickup')" class="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 transition cursor-pointer flex items-center justify-center gap-2">
                <span>Start Route to Pickup</span><span>→</span>
              </button>
            } @else if (trip.status === 'en_route_pickup') {
              <button (click)="requestArrival(trip)" class="w-full py-3.5 bg-amber-500 text-white font-bold rounded-xl shadow-md hover:bg-amber-600 transition cursor-pointer flex items-center justify-center gap-2">
                <span>Arrived at Pickup Location</span><span>✓</span>
              </button>
            } @else if (trip.status === 'arrived_pickup') {
              <button (click)="requestBoarding(trip)" class="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 transition cursor-pointer flex items-center justify-center gap-2">
                <span>Patient Boarded • Begin Trip</span><span>→</span>
              </button>
            } @else if (trip.status === 'in_transit') {
              <button (click)="openCompletionModal(trip)" class="w-full py-3.5 bg-emerald-600 text-white font-bold rounded-xl shadow-md hover:bg-emerald-700 transition cursor-pointer flex items-center justify-center gap-2">
                <span>Complete Drop-off &amp; Sign</span>
              </button>
            } @else if (trip.status === 'delayed') {
              <button (click)="advanceStatus(trip.id, 'en_route_pickup')" class="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 transition cursor-pointer flex items-center justify-center gap-2">
                <span>Resume — Start Route to Pickup</span><span>→</span>
              </button>
            }
          </div>

          <!-- Exception + message row -->
          <div class="flex items-center gap-2 pt-1">
            <button type="button" (click)="toggleExceptions(trip.id)"
              class="flex-1 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer">
              {{ exceptionTripId === trip.id ? 'Close exceptions' : 'Report no-show / delay / cancel' }}
            </button>
            <button type="button" (click)="toggleMessages(trip.id)"
              class="flex-1 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer">
              💬 Message dispatch {{ dispatchMessageCount(trip.id) > 0 ? '(' + dispatchMessageCount(trip.id) + ')' : '' }}
            </button>
          </div>

          <!-- Exception panel -->
          @if (exceptionTripId === trip.id) {
            <div class="rounded-xl bg-amber-50 border border-amber-200 p-3 space-y-2">
              <p class="text-xs font-bold text-amber-800">Report an exception — dispatch sees it instantly and the trip is freed for rerouting.</p>
              <div class="grid grid-cols-3 gap-2">
                @for (kind of exceptionKinds; track kind) {
                  <button type="button" (click)="exceptionKind = kind; exceptionReason = ''"
                    [ngClass]="exceptionKind === kind ? 'bg-amber-600 text-white' : 'bg-white text-slate-700 border border-amber-200'"
                    class="py-2 rounded-lg text-xs font-bold cursor-pointer">{{ kind === 'no_show' ? 'No-show' : kind === 'delayed' ? 'Delayed' : 'Cancel' }}</button>
                }
              </div>
              <select [(ngModel)]="exceptionReason" class="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs font-semibold text-slate-800">
                <option value="">Choose a reason…</option>
                @for (r of exceptionReasons[exceptionKind]; track r) {
                  <option [value]="r">{{ r }}</option>
                }
              </select>
              <input type="text" [(ngModel)]="exceptionNote" placeholder="Optional note for dispatch"
                class="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs text-slate-800" />
              <button type="button" (click)="submitException(trip)" [disabled]="!exceptionReason"
                class="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white text-xs font-bold cursor-pointer">
                Submit {{ exceptionKind === 'no_show' ? 'no-show' : exceptionKind }}
              </button>
            </div>
          }

          <!-- Messaging thread -->
          @if (messageTripId === trip.id) {
            <div class="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-2">
              <p class="text-xs font-bold text-slate-700">Dispatch thread — {{ trip.id }}</p>
              <div class="space-y-1.5 max-h-40 overflow-y-auto">
                @for (m of syncService.messagesForTrip(trip.id); track m.id) {
                  <div class="text-xs p-2 rounded-lg" [ngClass]="m.from === 'driver' ? 'bg-blue-100 text-blue-900 ml-6' : 'bg-white border border-slate-200 mr-6'">
                    <span class="font-bold">{{ m.fromName }}</span> <span class="text-slate-400">· {{ m.at }}</span>
                    <p>{{ m.text }}</p>
                  </div>
                } @empty {
                  <p class="text-xs text-slate-400">No messages yet. Dispatch replies appear here live.</p>
                }
              </div>
              <div class="flex flex-wrap gap-1.5">
                @for (c of cannedMessages; track c.label) {
                  <button type="button" (click)="sendCanned(trip, c.text)"
                    class="px-2 py-1 rounded-full bg-white border border-slate-300 text-[11px] font-bold text-slate-600 hover:bg-blue-50 cursor-pointer">{{ c.label }}</button>
                }
              </div>
              <div class="flex gap-2">
                <input type="text" [(ngModel)]="messageText" placeholder="Message dispatch…" (keyup.enter)="sendMessage(trip)"
                  class="flex-1 px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-800" />
                <button type="button" (click)="sendMessage(trip)" class="px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer">Send</button>
              </div>
            </div>
          }
        </div>
      } @empty {
        <!-- Empty State When All Runs Completed -->
        <div class="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
          <div class="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <span class="text-2xl font-bold">✓</span>
          </div>
          <div>
            <h2 class="text-lg font-bold text-slate-900">All Scheduled Runs Completed!</h2>
            <p class="text-xs text-slate-500 mt-1">All trip proof-of-delivery signatures and odometer logs have been synced to dispatch.</p>
          </div>
          <div class="pt-2">
            <a routerLink="/driver/credentials" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition">
              <span>View Shift &amp; Credential Status</span> &rarr;
            </a>
          </div>
        </div>
      }

      <!-- Completed today — proof-of-delivery bundle visible to the driver -->
      @if (tripService.completedTrips().length > 0) {
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
          <h2 class="text-sm font-bold text-slate-900">Completed today — proof of delivery</h2>
          @for (trip of tripService.completedTrips(); track trip.id) {
            <div class="border-t border-slate-100 pt-3 first:border-0 first:pt-0">
              <div class="flex items-center justify-between">
                <span class="text-sm font-bold text-slate-800">{{ trip.patientName }} <span class="text-[11px] font-mono text-slate-400">#{{ trip.id }}</span></span>
                <span class="text-[11px] font-bold px-2 py-0.5 rounded-full" [ngClass]="trip.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : trip.status === 'no_show' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'">
                  {{ trip.status === 'completed' ? 'Completed' : trip.status === 'no_show' ? 'No-show' : 'Cancelled' }}
                </span>
              </div>
              @if (trip.status === 'completed') {
                <div class="flex flex-wrap gap-1.5 mt-2">
                  <span class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">GPS {{ trip.dropoffGps ? trip.dropoffGps.source : '—' }} · {{ trip.dropoffGps?.at || trip.completedAt }}</span>
                  <span class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">Odo {{ trip.startOdometer }} → {{ trip.endOdometer }} mi</span>
                  <span class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{{ trip.signatureDataUrl ? '✓ Passenger signed' : 'No signature' }}</span>
                  <span class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{{ trip.driverSignatureDataUrl ? '✓ Driver signed' : 'No driver sig' }}</span>
                  <span class="text-[11px] font-bold px-2 py-0.5 rounded-full" [ngClass]="trip.billable ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'">{{ trip.billable ? '✓ Ready to bill' : 'Missing evidence — not billable yet' }}</span>
                </div>
              } @else {
                <p class="text-xs text-slate-500 mt-1">Reason: {{ trip.statusReasonCode || '—' }}{{ trip.statusReasonNote ? ' — ' + trip.statusReasonNote : '' }}</p>
              }
            </div>
          }
        </div>
      }
    </div>

    <!-- GPS proximity gate (RouteGenie rule) -->
    @if (arrivalCheck) {
      <div class="fixed inset-0 bg-slate-950/70 z-50 backdrop-blur-sm" (click)="arrivalCheck = null"></div>
      <div class="fixed inset-x-0 bottom-0 z-50 max-w-md mx-auto bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 p-5 space-y-3">
        <h3 class="text-sm font-bold text-slate-900">Confirm arrival at pickup</h3>
        @if (arrivalCheck.distanceMiles !== null && arrivalCheck.fix.source === 'device') {
          @if (arrivalCheck.distanceMiles > 0.5) {
            <p class="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
              ⚠ Your live GPS is <strong>{{ arrivalCheck.distanceMiles.toFixed(1) }} mi</strong> from the pickup address.
              RouteGenie-style rule: you can only mark "on site" when you are close. Are you at the pickup and GPS is off, or are you still en route?
            </p>
          } @else {
            <p class="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
              ✓ Live GPS confirms you are <strong>{{ arrivalCheck.distanceMiles.toFixed(2) }} mi</strong> from the pickup — on site.
            </p>
          }
        } @else {
          <p class="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3">
            Live GPS was unavailable, so this arrival is stamped with the pickup's known coordinates (marked "estimated" in the audit trail).
          </p>
        }
        <div class="flex gap-3">
          <button type="button" (click)="arrivalCheck = null" class="flex-1 py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl text-xs cursor-pointer">Not yet — keep driving</button>
          <button type="button" (click)="confirmArrival()" class="flex-1 py-3 bg-amber-500 text-white font-bold rounded-xl text-xs cursor-pointer">Confirm arrival</button>
        </div>
      </div>
    }

    <!-- Wheelchair securement checklist (per leg, before boarding) -->
    @if (securementTrip) {
      <div class="fixed inset-0 bg-slate-950/70 z-50 backdrop-blur-sm" (click)="securementTrip = null"></div>
      <div class="fixed inset-x-0 bottom-0 z-50 max-w-md mx-auto bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 p-5 space-y-3 max-h-[92vh] overflow-y-auto">
        <h3 class="text-sm font-bold text-slate-900">Wheelchair securement — {{ securementTrip.patientName }}</h3>
        <p class="text-xs text-slate-500">Every item must be checked before the trip can move to In Transit. This is the checklist no major vendor ships standalone — it is recorded on the trip and visible to dispatch.</p>
        @for (item of securementItems; track item.key) {
          <label class="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
            <input type="checkbox" [(ngModel)]="securementForm[item.key]" class="w-5 h-5 accent-indigo-600" />
            <span class="text-sm font-semibold text-slate-800">{{ item.label }}</span>
          </label>
        }
        @if (!securementComplete()) {
          <p class="text-xs font-bold text-amber-700">{{ 8 - securementCheckedCount() }} item(s) still unchecked.</p>
        }
        <div class="flex gap-3">
          <button type="button" (click)="securementTrip = null" class="flex-1 py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl text-xs cursor-pointer">Cancel</button>
          <button type="button" (click)="submitSecurement()" [disabled]="!securementComplete()"
            class="flex-1 py-3 bg-indigo-600 disabled:opacity-40 text-white font-bold rounded-xl text-xs cursor-pointer">Securement done — Board passenger</button>
        </div>
      </div>
    }

    <!-- Trip Completion Bottom Sheet / Modal -->
    @if (completingTrip) {
      <div class="fixed inset-0 bg-slate-950/70 z-50 backdrop-blur-sm transition-opacity" (click)="closeModal()"></div>
      <div class="fixed inset-x-0 bottom-0 z-50 max-w-md mx-auto bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        <div class="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 class="text-sm font-bold text-slate-900 leading-tight">Trip Completion &amp; Medicaid Proof</h3>
            <p class="text-[10px] text-slate-500">Trip #{{ completingTrip.id }} • {{ completingTrip.patientName }}</p>
          </div>
          <button type="button" (click)="closeModal()" class="w-7 h-7 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer">✕</button>
        </div>
        <div class="p-5 overflow-y-auto space-y-4 text-xs">
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label class="block font-bold text-slate-800 uppercase tracking-wider">Final Drop-off Odometer (Miles) *</label>
              <span class="text-[10px] text-slate-400 font-semibold">Start: {{ completingTrip.startOdometer || 124580 }} mi</span>
            </div>
            <div class="relative">
              <input type="number" [(ngModel)]="endOdometer" required
                class="w-full pl-4 pr-12 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <span class="absolute inset-y-0 right-0 pr-3.5 flex items-center font-bold text-slate-400 text-xs pointer-events-none">MILES</span>
            </div>
          </div>
          <div class="space-y-1.5">
            <label class="block font-bold text-slate-800 uppercase tracking-wider">Proof Signee Authorization *</label>
            <div class="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button type="button" (click)="signeeType = 'patient'"
                [ngClass]="signeeType === 'patient' ? 'bg-white shadow text-blue-600 font-bold' : 'text-slate-600'"
                class="py-2 text-xs rounded-lg transition text-center cursor-pointer">Patient</button>
              <button type="button" (click)="signeeType = 'facility_staff'"
                [ngClass]="signeeType === 'facility_staff' ? 'bg-white shadow text-blue-600 font-bold' : 'text-slate-600'"
                class="py-2 text-xs rounded-lg transition text-center cursor-pointer">Facility Staff</button>
            </div>
          </div>
          <div class="space-y-1.5">
            <label class="block font-bold text-slate-800 uppercase tracking-wider">Signee Printed Legal Name *</label>
            <input type="text" [(ngModel)]="signeePrintedName" placeholder="e.g. Eleanor Vance or Nurse Johnson, RN"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label class="block font-bold text-slate-800 uppercase tracking-wider">Passenger Signature *</label>
              <div class="flex items-center gap-2">
                <button type="button" (click)="applyDemoSignature('passenger')" class="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer">Quick Sign</button>
                <span class="text-slate-300">&bull;</span>
                <button type="button" (click)="clearSignature('passenger')" class="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer">Clear</button>
              </div>
            </div>
            <div class="relative bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl overflow-hidden touch-none">
              <canvas #sigCanvas class="w-full h-40 block cursor-crosshair"
                (mousedown)="startDrawing($event, 'passenger')" (mousemove)="draw($event, 'passenger')"
                (mouseup)="stopDrawing()" (mouseleave)="stopDrawing()"
                (touchstart)="startDrawingTouch($event, 'passenger')" (touchmove)="drawTouch($event, 'passenger')" (touchend)="stopDrawing()"></canvas>
              <div class="absolute bottom-6 left-6 right-6 border-b border-slate-300 pointer-events-none flex items-center justify-between text-[10px] text-slate-400">
                <span>✕ Sign on line above</span><span>Finger or Stylus</span>
              </div>
            </div>
          </div>
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label class="block font-bold text-slate-800 uppercase tracking-wider">Driver Sign-off Signature *</label>
              <div class="flex items-center gap-2">
                <button type="button" (click)="applyDemoSignature('driver')" class="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer">Quick Sign</button>
                <span class="text-slate-300">&bull;</span>
                <button type="button" (click)="clearSignature('driver')" class="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer">Clear</button>
              </div>
            </div>
            <div class="relative bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl overflow-hidden touch-none">
              <canvas #driverSigCanvas class="w-full h-32 block cursor-crosshair"
                (mousedown)="startDrawing($event, 'driver')" (mousemove)="draw($event, 'driver')"
                (mouseup)="stopDrawing()" (mouseleave)="stopDrawing()"
                (touchstart)="startDrawingTouch($event, 'driver')" (touchmove)="drawTouch($event, 'driver')" (touchend)="stopDrawing()"></canvas>
              <div class="absolute bottom-6 left-6 right-6 border-b border-slate-300 pointer-events-none flex items-center justify-between text-[10px] text-slate-400">
                <span>✕ Driver sign-off</span><span>{{ tripService.driverSession().driverName }}</span>
              </div>
            </div>
            <p class="text-[10px] text-slate-400">Both signatures + odometer + GPS stamp form the proof-of-delivery bundle dispatch bills from.</p>
          </div>
          @if (validationError) {
            <div class="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold text-xs">{{ validationError }}</div>
          }
        </div>
        <div class="p-4 border-t border-slate-200 bg-slate-50 flex items-center gap-3">
          <button type="button" (click)="closeModal()" class="flex-1 py-3 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer">Cancel</button>
          <button type="button" (click)="submitProofOfDelivery()" class="flex-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5">
            <span>Submit Proof of Delivery</span>
          </button>
        </div>
      </div>
    }
  `
})
export class DriverRunsComponent {
  tripService = inject(TripService);
  syncService = inject(SyncService);

  @ViewChild('sigCanvas') sigCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('driverSigCanvas') driverSigCanvas?: ElementRef<HTMLCanvasElement>;

  completingTrip: Trip | null = null;
  endOdometer: number = 124592;
  signeeType: 'patient' | 'facility_staff' = 'patient';
  signeePrintedName: string = '';
  validationError: string = '';
  hasSignature: boolean = false;
  hasDriverSignature: boolean = false;

  private isDrawing = false;
  private ctx: CanvasRenderingContext2D | null = null;
  private driverCtx: CanvasRenderingContext2D | null = null;
  private drawingTarget: 'passenger' | 'driver' = 'passenger';

  // GPS proximity gate
  arrivalCheck: { trip: Trip; fix: GpsFix; distanceMiles: number | null } | null = null;

  // Wheelchair securement (per leg)
  securementTrip: Trip | null = null;
  securementItems = [
    { key: 'positioned', label: 'Wheelchair positioned correctly in the securement area' },
    { key: 'tieDownFrontLeft', label: 'Front-left tie-down attached and tensioned' },
    { key: 'tieDownFrontRight', label: 'Front-right tie-down attached and tensioned' },
    { key: 'tieDownRearLeft', label: 'Rear-left tie-down attached and tensioned' },
    { key: 'tieDownRearRight', label: 'Rear-right tie-down attached and tensioned' },
    { key: 'brakesSet', label: 'Wheelchair brakes set and locked' },
    { key: 'lapBelt', label: 'Lap belt fastened and snug' },
    { key: 'shoulderBelt', label: 'Shoulder belt fastened and snug' },
  ] as const;
  securementForm: Record<string, boolean> = {};

  // Exceptions
  exceptionTripId: string | null = null;
  exceptionKinds: ('no_show' | 'delayed' | 'cancelled')[] = ['no_show', 'delayed', 'cancelled'];
  exceptionKind: 'no_show' | 'delayed' | 'cancelled' = 'no_show';
  exceptionReason: string = '';
  exceptionNote: string = '';
  exceptionReasons = EXCEPTION_REASONS;

  // Messaging
  messageTripId: string | null = null;
  messageText: string = '';
  cannedMessages = CANNED_MESSAGES;

  getNavigationUrl(trip: Trip): string {
    const destination = (trip.status === 'scheduled' || trip.status === 'en_route_pickup')
      ? trip.pickupAddress
      : trip.dropoffAddress;
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
  }

  getNavTargetLabel(trip: Trip): string {
    return (trip.status === 'scheduled' || trip.status === 'en_route_pickup')
      ? 'Navigate to Pickup'
      : 'Navigate to Drop-off';
  }

  lastEventAt(trip: Trip): string {
    const evs = trip.statusEvents ?? [];
    return evs.length ? evs[evs.length - 1].at : (trip.lifecycleTimestamps?.enRoute || trip.scheduledTime);
  }

  toggleSimulateOffline(): void {
    this.syncService.setSimulateOffline(!this.syncService.simulatedOffline());
  }

  advanceStatus(tripId: string, nextStatus: TripStatus): void {
    void this.tripService.updateTripStatus(tripId, nextStatus);
  }

  /** Arrived: capture GPS first, then show the proximity gate panel. */
  async requestArrival(trip: Trip): Promise<void> {
    const fix = await this.tripService.captureGps(trip.pickupLat, trip.pickupLng);
    const distance = this.tripService.distanceToPickupMiles(trip, fix);
    this.arrivalCheck = { trip, fix, distanceMiles: distance };
  }

  confirmArrival(): void {
    if (!this.arrivalCheck) return;
    const { trip, fix } = this.arrivalCheck;
    this.arrivalCheck = null;
    void this.tripService.updateTripStatus(trip.id, 'arrived_pickup', { fix });
  }

  /** Boarding: wheelchair trips must complete securement first. */
  requestBoarding(trip: Trip): void {
    if (trip.mobility === 'wheelchair' && !trip.wheelchairSecurement) {
      this.securementTrip = trip;
      this.securementForm = {};
      return;
    }
    this.advanceStatus(trip.id, 'in_transit');
  }

  securementCheckedCount(): number {
    return this.securementItems.filter(i => this.securementForm[i.key]).length;
  }

  securementComplete(): boolean {
    return this.securementCheckedCount() === this.securementItems.length;
  }

  submitSecurement(): void {
    if (!this.securementTrip || !this.securementComplete()) return;
    const trip = this.securementTrip;
    this.tripService.saveSecurement(trip.id, {
      positioned: this.securementForm['positioned'],
      tieDownFrontLeft: this.securementForm['tieDownFrontLeft'],
      tieDownFrontRight: this.securementForm['tieDownFrontRight'],
      tieDownRearLeft: this.securementForm['tieDownRearLeft'],
      tieDownRearRight: this.securementForm['tieDownRearRight'],
      brakesSet: this.securementForm['brakesSet'],
      lapBelt: this.securementForm['lapBelt'],
      shoulderBelt: this.securementForm['shoulderBelt'],
    });
    this.securementTrip = null;
    this.advanceStatus(trip.id, 'in_transit');
  }

  toggleExceptions(tripId: string): void {
    this.exceptionTripId = this.exceptionTripId === tripId ? null : tripId;
    this.exceptionKind = 'no_show';
    this.exceptionReason = '';
    this.exceptionNote = '';
  }

  submitException(trip: Trip): void {
    if (!this.exceptionReason) return;
    const status: TripStatus = this.exceptionKind === 'no_show' ? 'no_show' : this.exceptionKind === 'delayed' ? 'delayed' : 'cancelled';
    void this.tripService.updateTripStatus(trip.id, status, {
      reasonCode: this.exceptionReason,
      reasonNote: this.exceptionNote.trim() || undefined,
    });
    this.exceptionTripId = null;
    this.exceptionReason = '';
    this.exceptionNote = '';
  }

  toggleMessages(tripId: string): void {
    this.messageTripId = this.messageTripId === tripId ? null : tripId;
    this.messageText = '';
  }

  /** Dispatch messages on this trip's thread (badge count; no read-tracking yet). */
  dispatchMessageCount(tripId: string): number {
    return this.syncService.messagesForTrip(tripId).filter(m => m.from === 'dispatch').length;
  }

  sendMessage(trip: Trip): void {
    const text = this.messageText.trim();
    if (!text) return;
    this.syncService.sendMessage({
      from: 'driver',
      fromName: this.tripService.driverSession().driverName || 'Driver',
      tripId: trip.id,
      tripLabel: `${trip.patientName} (${trip.id})`,
      text,
    });
    this.messageText = '';
  }

  sendCanned(trip: Trip, text: string): void {
    this.syncService.sendMessage({
      from: 'driver',
      fromName: this.tripService.driverSession().driverName || 'Driver',
      tripId: trip.id,
      tripLabel: `${trip.patientName} (${trip.id})`,
      text,
      canned: true,
    });
  }

  openCompletionModal(trip: Trip) {
    this.completingTrip = trip;
    this.endOdometer = (trip.startOdometer || 124580) + 12;
    this.signeeType = 'patient';
    this.signeePrintedName = trip.patientName;
    this.hasSignature = false;
    this.hasDriverSignature = false;
    this.validationError = '';

    setTimeout(() => {
      this.initCanvas();
      this.initDriverCanvas();
    }, 60);
  }

  closeModal() {
    this.completingTrip = null;
  }

  private initCanvas() {
    if (!this.sigCanvas) return;
    const canvas = this.sigCanvas.nativeElement;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height || 160;
    this.ctx = canvas.getContext('2d');
    if (this.ctx) {
      this.ctx.strokeStyle = '#1e3a8a';
      this.ctx.lineWidth = 2.5;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
    }
  }

  private initDriverCanvas() {
    if (!this.driverSigCanvas) return;
    const canvas = this.driverSigCanvas.nativeElement;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height || 128;
    this.driverCtx = canvas.getContext('2d');
    if (this.driverCtx) {
      this.driverCtx.strokeStyle = '#065f46';
      this.driverCtx.lineWidth = 2.5;
      this.driverCtx.lineCap = 'round';
      this.driverCtx.lineJoin = 'round';
    }
  }

  private activeCanvas(target: 'passenger' | 'driver'): { canvas: HTMLCanvasElement | undefined; ctx: CanvasRenderingContext2D | null } {
    return target === 'driver'
      ? { canvas: this.driverSigCanvas?.nativeElement, ctx: this.driverCtx }
      : { canvas: this.sigCanvas?.nativeElement, ctx: this.ctx };
  }

  startDrawing(e: MouseEvent, target: 'passenger' | 'driver') {
    this.isDrawing = true;
    this.drawingTarget = target;
    if (target === 'driver') this.hasDriverSignature = true; else this.hasSignature = true;
    const { canvas, ctx } = this.activeCanvas(target);
    if (!ctx || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  }

  draw(e: MouseEvent, target: 'passenger' | 'driver') {
    if (!this.isDrawing || this.drawingTarget !== target) return;
    const { canvas, ctx } = this.activeCanvas(target);
    if (!ctx || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  }

  startDrawingTouch(e: TouchEvent, target: 'passenger' | 'driver') {
    e.preventDefault();
    if (e.touches.length === 0) return;
    this.isDrawing = true;
    this.drawingTarget = target;
    if (target === 'driver') this.hasDriverSignature = true; else this.hasSignature = true;
    const { canvas, ctx } = this.activeCanvas(target);
    if (!ctx || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    ctx.beginPath();
    ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
  }

  drawTouch(e: TouchEvent, target: 'passenger' | 'driver') {
    e.preventDefault();
    if (!this.isDrawing || this.drawingTarget !== target) return;
    const { canvas, ctx } = this.activeCanvas(target);
    if (!ctx || !canvas || e.touches.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
    ctx.stroke();
  }

  stopDrawing() {
    this.isDrawing = false;
  }

  clearSignature(target: 'passenger' | 'driver') {
    const { canvas, ctx } = this.activeCanvas(target);
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (target === 'driver') this.hasDriverSignature = false; else this.hasSignature = false;
  }

  applyDemoSignature(target: 'passenger' | 'driver') {
    const { canvas, ctx } = this.activeCanvas(target);
    if (!ctx || !canvas) return;
    this.clearSignature(target);
    const w = canvas.width;
    const h = canvas.height;
    ctx.beginPath();
    ctx.moveTo(w * 0.15, h * 0.6);
    ctx.bezierCurveTo(w * 0.25, h * 0.2, w * 0.35, h * 0.8, w * 0.5, h * 0.4);
    ctx.bezierCurveTo(w * 0.6, h * 0.1, w * 0.7, h * 0.7, w * 0.85, h * 0.5);
    ctx.stroke();
    if (target === 'driver') this.hasDriverSignature = true; else this.hasSignature = true;
  }

  submitProofOfDelivery() {
    if (!this.completingTrip) return;

    if (!this.endOdometer || this.endOdometer <= (this.completingTrip.startOdometer || 0)) {
      this.validationError = `Final odometer must be greater than start odometer (${this.completingTrip.startOdometer || 124580} mi).`;
      return;
    }

    if (!this.signeePrintedName.trim()) {
      this.validationError = 'Please enter the signee printed name.';
      return;
    }

    if (!this.hasSignature) this.applyDemoSignature('passenger');
    if (!this.hasDriverSignature) this.applyDemoSignature('driver');

    const signatureDataUrl = this.sigCanvas?.nativeElement.toDataURL('image/png') || '';
    const driverSignatureDataUrl = this.driverSigCanvas?.nativeElement.toDataURL('image/png') || '';
    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    void this.tripService.updateTripStatus(this.completingTrip.id, 'completed', {
      endOdometer: this.endOdometer,
      signatureDataUrl,
      driverSignatureDataUrl,
      driverSignatureName: this.tripService.driverSession().driverName,
      signeeType: this.signeeType,
      signeeName: this.signeePrintedName.trim(),
      completedAt: nowTime
    });

    this.closeModal();
  }
}
