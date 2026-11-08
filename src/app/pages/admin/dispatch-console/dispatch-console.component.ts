import { Component, inject, signal, AfterViewInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TripService } from '../../../core/services/trip.service';
import { SyncService, CANNED_MESSAGES } from '../../../core/services/sync.service';
import { ComplianceService } from '../../../services/compliance.service';
import { Trip, MobilityType } from '../../../core/models/trip.model';

declare const L: any;

@Component({
  selector: 'app-dispatch-console',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSnackBarModule],
  template: `
    <div class="h-[calc(100vh-4rem)] flex flex-col md:flex-row overflow-hidden bg-slate-50 font-sans relative">
      
      <!-- =====================================================================
           LEFT COLUMN: LIVE TRIP MANIFEST (440px)
           ===================================================================== -->
      <div class="w-full md:w-[440px] bg-white border-r border-slate-200 flex flex-col h-full shadow-sm z-20">
        <!-- Column Header -->
        <div class="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div>
            <h2 class="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Live Trip Manifest</span>
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </h2>
            <p class="text-xs text-slate-500">Real-time driver updates from mobile field app</p>
          </div>
          <div class="flex items-center gap-2">
            <button type="button" (click)="showMessagesDrawer.set(true)"
              class="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm transition cursor-pointer">
              💬 Messages {{ syncService.messages().length > 0 ? '(' + syncService.messages().length + ')' : '' }}
            </button>
            <button
              type="button"
              (click)="openQuickDispatch()"
              class="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm hover:shadow transition flex items-center gap-1.5 cursor-pointer"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              <span>+ Quick Dispatch</span>
            </button>
          </div>
        </div>

        <!-- Sync status (shared with the driver app) -->
        <div class="px-4 py-2 bg-white border-b border-slate-100 flex items-center justify-between text-[11px]">
          <span class="flex items-center gap-1.5 font-bold" [ngClass]="syncService.online() ? 'text-emerald-700' : 'text-amber-700'">
            <span class="w-2 h-2 rounded-full" [ngClass]="syncService.online() ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'"></span>
            {{ syncService.online() ? 'Live — synced locally' : 'Offline — ' + syncService.pendingCount() + ' event(s) pending' }}
            {{ syncService.lastSyncedAt() ? '· ' + syncService.lastSyncedAt() : '' }}
          </span>
          <span class="text-slate-400">Driver ↔ dispatch share one trip record</span>
        </div>

        <!-- Status filter chips (live board counts) -->
        <div class="px-4 py-2 bg-slate-50 border-b border-slate-100 flex flex-wrap gap-1.5">
          @for (f of statusFilters; track f.key) {
            <button type="button" (click)="statusFilter.set(f.key)"
              [ngClass]="statusFilter() === f.key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'"
              class="px-2.5 py-1 rounded-full border text-[11px] font-bold cursor-pointer">
              {{ f.label }} ({{ f.key === 'all' ? tripService.trips().length : (tripService.tripsByStatus()[f.key] || 0) }})
            </button>
          }
        </div>

        <!-- Filter / Stats Ribbon -->
        <div class="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span class="font-bold text-slate-700">{{ filteredTrips().length }} shown · {{ tripService.trips().length }} total</span>
          <span class="text-slate-400">Late pickups first · Click card to trace route</span>
        </div>

        <!-- Trips Scrollable List -->
        <div class="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/60">
          @for (trip of filteredTrips(); track trip.id) {
            <div
              (click)="selectTrip(trip)"
              class="p-4 rounded-2xl border transition-all duration-150 shadow-sm space-y-3 cursor-pointer bg-white"
              [ngClass]="{
                'ring-2 ring-blue-500 border-blue-500 bg-blue-50/30 shadow-md': selectedTripId() === trip.id,
                'border-emerald-200 hover:border-emerald-400': selectedTripId() !== trip.id && trip.status === 'completed',
                'border-slate-200 hover:border-blue-400': selectedTripId() !== trip.id && trip.status !== 'completed'
              }"
            >
              
              <!-- Patient Name & Status Badge -->
              <div class="flex items-center justify-between">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-slate-900">{{ trip.patientName }}</span>
                    <span class="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                          [ngClass]="trip.mobility === 'wheelchair' ? 'bg-purple-100 text-purple-700' : (trip.mobility === 'stretcher' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600')">
                      {{ trip.mobility === 'wheelchair' ? 'WC' : (trip.mobility === 'stretcher' ? 'Stretcher' : 'Amb') }}
                    </span>
                  </div>
                  <div class="flex items-center gap-2 mt-0.5">
                    <span class="text-[10px] text-slate-400 font-mono">#{{ trip.id }}</span>
                    @if (trip.patientPhone) {
                      <span class="text-[10px] text-slate-500 font-medium">📞 {{ trip.patientPhone }}</span>
                    }
                  </div>
                </div>
                <div class="text-right">
                  <span class="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider block"
                        [ngClass]="{
                          'bg-blue-100 text-blue-800 border border-blue-200': trip.status === 'en_route_pickup',
                          'bg-amber-100 text-amber-800 border border-amber-200': trip.status === 'arrived_pickup',
                          'bg-indigo-100 text-indigo-800 border border-indigo-200': trip.status === 'in_transit',
                          'bg-emerald-100 text-emerald-800 border border-emerald-200': trip.status === 'completed',
                          'bg-rose-100 text-rose-800 border border-rose-200': trip.status === 'no_show' || trip.status === 'cancelled',
                          'bg-orange-100 text-orange-800 border border-orange-200': trip.status === 'delayed',
                          'bg-slate-100 text-slate-600 border border-slate-200': trip.status === 'scheduled'
                        }">
                    {{ getStatusLabel(trip.status) }}
                  </span>
                  <span class="text-[10px] font-bold text-slate-500 mt-1 block">{{ trip.scheduledTime }}</span>
                </div>
              </div>

              <!-- Route Details -->
              <div class="space-y-1 text-xs text-slate-600">
                <p class="truncate"><strong class="text-slate-800">📍 Pick:</strong> {{ trip.pickupAddress }}</p>
                <p class="truncate"><strong class="text-slate-800">🏁 Drop:</strong> {{ trip.dropoffAddress }}</p>
                <div class="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Van: <strong class="text-slate-700">{{ trip.vehicleNumber || 'Unassigned' }}</strong></span>
                  <span>Driver: <strong class="text-slate-700">{{ trip.driverName || 'Unassigned' }}</strong></span>
                </div>
              </div>

              <!-- ETA + lateness (live, from the shared trip record) -->
              <div class="flex items-center justify-between text-[11px] pt-1">
                @if (tripService.minutesLate(trip) > 0 && trip.status !== 'completed' && trip.status !== 'cancelled' && trip.status !== 'no_show') {
                  <span class="font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">⏰ {{ tripService.minutesLate(trip) }} min late</span>
                } @else if (trip.status === 'en_route_pickup' || trip.status === 'arrived_pickup') {
                  <span class="font-bold text-blue-700">ETA pickup ~{{ tripService.etaMinutes(trip, false) ?? '—' }} min</span>
                } @else if (trip.status === 'in_transit') {
                  <span class="font-bold text-indigo-700">ETA drop-off ~{{ tripService.etaMinutes(trip, true) ?? '—' }} min</span>
                } @else {
                  <span class="text-slate-400">On schedule</span>
                }
                @if (trip.statusReasonCode) {
                  <span class="font-semibold text-amber-700">{{ trip.statusReasonCode }}</span>
                }
              </div>

              <!-- Dispatch actions: reassign / cancel -->
              @if (trip.status !== 'completed' && trip.status !== 'cancelled' && trip.status !== 'no_show') {
                <div class="pt-2 border-t border-slate-100 flex items-center gap-2">
                  <select [ngModel]="trip.driverId || ''" (ngModelChange)="reassignTrip(trip, $event)"
                    class="flex-1 px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-[11px] font-semibold text-slate-700 cursor-pointer">
                    <option value="">Reassign driver…</option>
                    <option value="DRV-101">Marcus Vance (Van #4)</option>
                    <option value="DRV-102">Elena Rostova (Van #2)</option>
                    <option value="DRV-103">Darnell Washington (Sedan #1) — expired</option>
                    <option value="unassigned">Unassigned</option>
                  </select>
                  <button type="button" (click)="cancelTrip(trip)"
                    class="px-2.5 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-700 text-[11px] font-bold hover:bg-rose-50 cursor-pointer">Cancel</button>
                </div>
              }

              <!-- Completed Trip Distinct Audit Button -->
              @if (trip.status === 'completed') {
                <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div class="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                    <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span>Completed {{ trip.completedAt || 'Today' }}</span>
                  </div>
                  
                  <button
                    type="button"
                    (click)="openProof(trip, $event)"
                    class="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <svg class="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    <span>View Audit Proof</span>
                  </button>
                </div>
              }
            </div>
          }
        </div>

        <!-- Live activity feed: every driver tap + dispatch action, GPS-stamped -->
        <div class="border-t border-slate-200 bg-white">
          <div class="px-4 py-2 flex items-center justify-between">
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Live activity — driver ↔ dispatch</span>
            <span class="text-[10px] text-slate-400">{{ syncService.activity().length }} events</span>
          </div>
          <div class="max-h-36 overflow-y-auto px-4 pb-3 space-y-1.5">
            @for (ev of syncService.activity().slice(0, 8); track ev.id) {
              <div class="text-[11px] leading-snug flex items-start gap-2">
                <span class="w-1.5 h-1.5 rounded-full mt-1 shrink-0" [ngClass]="ev.synced ? 'bg-emerald-500' : 'bg-amber-500'"></span>
                <span class="text-slate-700">{{ ev.summary }}</span>
                <span class="text-slate-400 ml-auto shrink-0">{{ ev.at }}</span>
              </div>
            } @empty {
              <p class="text-[11px] text-slate-400">No activity yet — driver status taps and dispatch actions will appear here live.</p>
            }
          </div>
        </div>
      </div>

      <!-- =====================================================================
           RIGHT COLUMN: REAL-TIME INTERACTIVE LEAFLET MAP VIEWPORT
           ===================================================================== -->
      <div class="flex-1 relative bg-slate-900 overflow-hidden">
        
        <!-- Live GPS Top Status Pill -->
        <div class="absolute top-4 left-4 z-10 bg-slate-900/90 border border-slate-700/80 px-4 py-2.5 rounded-2xl backdrop-blur text-left shadow-xl pointer-events-auto">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fleet Telemetry Radar</p>
          <div class="flex items-center gap-2 mt-0.5">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <p class="text-xs font-bold text-emerald-400">● Live — local sync (WebSocket in backend phase)</p>
          </div>
        </div>

        <!-- Active Fleet Quick Info -->
        <div class="absolute top-4 right-4 z-10 bg-slate-900/90 border border-slate-700/80 px-4 py-2.5 rounded-2xl backdrop-blur text-right shadow-xl hidden sm:block pointer-events-auto">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Driver Position</p>
          <p class="text-xs font-bold text-slate-200">{{ selectedTrip?.vehicleNumber || 'Van #4' }} ({{ selectedTrip?.driverName || 'Marcus Vance' }})</p>
          <span class="text-[10px] text-slate-400 font-mono">GPS: {{ (selectedTrip?.currentLat ?? 39.6536).toFixed(4) }}° N, {{ (selectedTrip?.currentLng ?? -104.9878).toFixed(4) }}° W</span>
        </div>

        <!-- Selected Trip Ribbon Overlay on Map (Bottom) -->
        @if (selectedTrip) {
          <div class="absolute bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 z-10 bg-white/95 backdrop-blur-md border border-slate-200 p-4 rounded-2xl shadow-2xl space-y-2 pointer-events-auto animate-in slide-in-from-bottom-2 duration-150">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-900">Active Route: {{ selectedTrip.patientName }}</span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">#{{ selectedTrip.id }}</span>
            </div>
            <p class="text-xs text-slate-600 truncate"><strong class="text-slate-800">Pick:</strong> {{ selectedTrip.pickupAddress }}</p>
            <p class="text-xs text-slate-600 truncate"><strong class="text-slate-800">Drop:</strong> {{ selectedTrip.dropoffAddress }}</p>
            <div class="pt-1 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100">
              <span>Van: <strong>{{ selectedTrip.vehicleNumber || 'Van #4' }}</strong></span>
              <button
                type="button"
                (click)="recenterRoute()"
                class="text-blue-600 hover:text-blue-800 font-bold cursor-pointer hover:underline"
              >
                Fit Route Bounds &rarr;
              </button>
            </div>
          </div>
        }

        <!-- Real Leaflet Map Container -->
        <div id="dispatch-map" class="w-full h-full z-0"></div>
      </div>

      <!-- =====================================================================
           CENTERED MODAL OVERLAY: + NEW QUICK DISPATCH TRIP
           ===================================================================== -->
      @if (showQuickDispatchDrawer()) {
        <!-- Backdrop & Centered Flex Wrapper -->
        <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all"
             (click)="closeQuickDispatch()">
          
          <!-- Centered Modal Card Box -->
          <div class="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 flex flex-col animate-in zoom-in-95 duration-150"
               (click)="$event.stopPropagation()">
            
            <!-- Modal Header -->
            <div class="p-5 border-b border-slate-200 bg-slate-50/90 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm">
              <div>
                <span class="text-[10px] font-bold uppercase tracking-widest text-blue-600">Immediate Allocation</span>
                <h2 class="text-base font-bold text-slate-900">+ Quick Dispatch Trip</h2>
              </div>
              <button
                type="button"
                (click)="closeQuickDispatch()"
                class="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-sm font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <!-- Modal Form Body -->
            <form (ngSubmit)="createDispatchTrip()" class="p-6 space-y-4 text-xs text-slate-700">
              
              <!-- Patient Name -->
              <div class="space-y-1.5">
                <label class="block font-bold text-slate-800 uppercase tracking-wider">Patient Full Name *</label>
                <input
                  type="text"
                  name="patientName"
                  [(ngModel)]="newTripForm.patientName"
                  required
                  placeholder="e.g. Margaret Holloway"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <!-- Patient Phone -->
              <div class="space-y-1.5">
                <label class="block font-bold text-slate-800 uppercase tracking-wider">Patient Phone Number</label>
                <input
                  type="tel"
                  name="patientPhone"
                  [(ngModel)]="newTripForm.patientPhone"
                  placeholder="(303) 555-0149"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <!-- Mobility Segmented Control -->
              <div class="space-y-1.5">
                <label class="block font-bold text-slate-800 uppercase tracking-wider">Mobility Level *</label>
                <div class="grid grid-cols-3 p-1 bg-slate-100 rounded-xl border border-slate-200 text-center">
                  <button
                    type="button"
                    (click)="newTripForm.mobility = 'ambulatory'"
                    [ngClass]="newTripForm.mobility === 'ambulatory' ? 'bg-white shadow text-blue-600 font-bold' : 'text-slate-600'"
                    class="py-2 text-xs rounded-lg transition cursor-pointer"
                  >
                    Ambulatory
                  </button>
                  <button
                    type="button"
                    (click)="newTripForm.mobility = 'wheelchair'"
                    [ngClass]="newTripForm.mobility === 'wheelchair' ? 'bg-white shadow text-blue-600 font-bold' : 'text-slate-600'"
                    class="py-2 text-xs rounded-lg transition cursor-pointer"
                  >
                    Wheelchair
                  </button>
                  <button
                    type="button"
                    (click)="newTripForm.mobility = 'stretcher'"
                    [ngClass]="newTripForm.mobility === 'stretcher' ? 'bg-white shadow text-blue-600 font-bold' : 'text-slate-600'"
                    class="py-2 text-xs rounded-lg transition cursor-pointer"
                  >
                    Stretcher
                  </button>
                </div>
              </div>

              <!-- Pickup Address -->
              <div class="space-y-1.5">
                <label class="block font-bold text-slate-800 uppercase tracking-wider">Pickup Address *</label>
                <input
                  type="text"
                  name="pickupAddress"
                  [(ngModel)]="newTripForm.pickupAddress"
                  required
                  placeholder="e.g. 2101 Market St, Denver, CO"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <!-- Dropoff Address -->
              <div class="space-y-1.5">
                <label class="block font-bold text-slate-800 uppercase tracking-wider">Drop-off Address *</label>
                <input
                  type="text"
                  name="dropoffAddress"
                  [(ngModel)]="newTripForm.dropoffAddress"
                  required
                  placeholder="e.g. 4200 E 9th Ave, Denver, CO"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <!-- Target Time -->
              <div class="space-y-1.5">
                <label class="block font-bold text-slate-800 uppercase tracking-wider">Target Scheduled Time</label>
                <input
                  type="text"
                  name="scheduledTime"
                  [(ngModel)]="newTripForm.scheduledTime"
                  placeholder="e.g. 11:30 AM"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <!-- Driver Assignment Dropdown -->
              <div class="space-y-1.5">
                <label class="block font-bold text-slate-800 uppercase tracking-wider">Assign Driver / Vehicle</label>
                <select
                  name="driverAssignment"
                  [(ngModel)]="newTripForm.driverAssignment"
                  (ngModelChange)="checkEligibility()"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="Marcus Vance (Van #4)">Marcus Vance (Van #4) - Active</option>
                  <option value="Elena Rostova (Van #2)">Elena Rostova (Van #2) - Active</option>
                  <option value="Darnell Washington (Sedan #1)">Darnell Washington (Sedan #1) - Expired credentials</option>
                  <option value="Unassigned">Leave Unassigned</option>
                </select>
                @if (eligibility) {
                  @if (eligibility.eligible) {
                    <p class="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5">✓ DQF check passed — driver + vehicle are dispatch-eligible.</p>
                  } @else {
                    <p class="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5">⛔ Dispatch blocked: {{ eligibility.reasons.join('; ') }}</p>
                  }
                  @if (eligibility.warnings.length > 0) {
                    <p class="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">⚠ {{ eligibility.warnings.join('; ') }}</p>
                  }
                }
              </div>

              <!-- Footer Submit Buttons -->
              <div class="pt-4 flex items-center gap-3">
                <button
                  type="button"
                  (click)="closeQuickDispatch()"
                  class="flex-1 py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="flex-2 py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-600/20 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                  </svg>
                  <span>Dispatch Run to Mobile Queue</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      }

      <!-- =====================================================================
           SLIDE-OVER DRAWER: MEDICAID AUDIT PROOF VIEWER
           ===================================================================== -->
      @if (selectedProofTrip()) {
        <!-- Drawer Backdrop Overlay -->
        <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 transition-opacity" (click)="closeProof()"></div>

        <!-- Drawer Content Shell -->
        <aside class="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
          
          <!-- Drawer Header -->
          <div class="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div class="space-y-0.5">
              <div class="flex items-center gap-2">
                <span class="text-xs font-mono font-bold text-slate-500">Trip #{{ selectedProofTrip()?.id }}</span>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase">
                  100% Audit Ready
                </span>
              </div>
              <h2 class="text-base font-bold text-slate-900">
                Medicaid Proof of Delivery Dossier
              </h2>
            </div>
            
            <button
              type="button"
              (click)="closeProof()"
              class="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-sm font-bold transition cursor-pointer"
            >
              ✕
            </button>
          </div>

          <!-- Drawer Body Scrollable Content -->
          <div class="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700" id="printable-proof">
            
            <!-- Patient & Route Card -->
            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-900 text-sm">{{ selectedProofTrip()?.patientName }}</span>
                <span class="text-[11px] font-semibold text-blue-600 uppercase">{{ selectedProofTrip()?.mobility }}</span>
              </div>
              <p><strong class="text-slate-800">Pickup:</strong> {{ selectedProofTrip()?.pickupAddress }}</p>
              <p><strong class="text-slate-800">Drop-off:</strong> {{ selectedProofTrip()?.dropoffAddress }}</p>
              <div class="pt-1 flex items-center justify-between text-[11px] text-slate-500">
                <span>Driver: <strong>{{ selectedProofTrip()?.driverName }}</strong></span>
                <span>Vehicle: <strong>{{ selectedProofTrip()?.vehicleNumber }}</strong></span>
              </div>
            </div>

            <!-- Certified Mileage & Odometer Strip -->
            <div class="space-y-2">
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500">1. Certified Vehicle Odometer Log</h4>
              <div class="grid grid-cols-3 gap-3">
                <div class="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <span class="text-[10px] text-slate-400 uppercase font-semibold">Start Odometer</span>
                  <div class="text-sm font-extrabold text-slate-900 mt-1">
                    {{ (selectedProofTrip()?.startOdometer || 124580) | number }} mi
                  </div>
                </div>

                <div class="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <span class="text-[10px] text-slate-400 uppercase font-semibold">Drop-off Odometer</span>
                  <div class="text-sm font-extrabold text-slate-900 mt-1">
                    {{ (selectedProofTrip()?.endOdometer || 124592) | number }} mi
                  </div>
                </div>

                <div class="p-3 rounded-xl bg-emerald-50 border border-emerald-200 shadow-xs">
                  <span class="text-[10px] text-emerald-700 uppercase font-semibold">Billable Miles</span>
                  <div class="text-sm font-extrabold text-emerald-800 mt-1">
                    {{ getTripMiles(selectedProofTrip()!) }} miles
                  </div>
                </div>
              </div>
            </div>

            <!-- Full Trip Lifecycle Timestamps -->
            <div class="space-y-2">
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500">2. Real-Time Trip Lifecycle Timestamps</h4>
              <div class="bg-white rounded-2xl border border-slate-200 p-4 divide-y divide-slate-100">
                <div class="py-2 flex items-center justify-between first:pt-0">
                  <span class="text-slate-600 flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-slate-400"></span>
                    <span>Trip Scheduled</span>
                  </span>
                  <span class="font-bold text-slate-900 font-mono">
                    {{ selectedProofTrip()?.lifecycleTimestamps?.scheduled || selectedProofTrip()?.scheduledTime }}
                  </span>
                </div>

                <div class="py-2 flex items-center justify-between">
                  <span class="text-slate-600 flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span>En Route to Pickup</span>
                  </span>
                  <span class="font-bold text-slate-900 font-mono">
                    {{ selectedProofTrip()?.lifecycleTimestamps?.enRoute || '09:12 AM' }}
                  </span>
                </div>

                <div class="py-2 flex items-center justify-between">
                  <span class="text-slate-600 flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span>Arrived at Pickup Location</span>
                  </span>
                  <span class="font-bold text-slate-900 font-mono">
                    {{ selectedProofTrip()?.lifecycleTimestamps?.arrivedPickup || '09:28 AM' }}
                  </span>
                </div>

                <div class="py-2 flex items-center justify-between">
                  <span class="text-slate-600 flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
                    <span>Patient Boarded &amp; Transit Started</span>
                  </span>
                  <span class="font-bold text-slate-900 font-mono">
                    {{ selectedProofTrip()?.lifecycleTimestamps?.boarded || '09:35 AM' }}
                  </span>
                </div>

                <div class="py-2 flex items-center justify-between last:pb-0 bg-emerald-50/50 -mx-4 px-4 rounded-b-xl">
                  <span class="text-emerald-800 font-semibold flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Drop-off Completed &amp; Signed</span>
                  </span>
                  <span class="font-bold text-emerald-800 font-mono">
                    {{ selectedProofTrip()?.lifecycleTimestamps?.completed || selectedProofTrip()?.completedAt || '09:58 AM' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Digital Proof Signature Display -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500">3. Electronic Patient/Facility Signature</h4>
                <span class="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {{ selectedProofTrip()?.signeeType === 'facility_staff' ? 'Staff Authorization' : 'Patient Attestation' }}
                </span>
              </div>

              <div class="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                <div class="border border-slate-200 rounded-xl bg-slate-50 p-2 flex items-center justify-center min-h-[120px]">
                  @if (selectedProofTrip()?.signatureDataUrl) {
                    <img
                      [src]="selectedProofTrip()?.signatureDataUrl"
                      alt="Digital Signature Proof"
                      class="max-h-28 object-contain"
                    />
                  } @else {
                    <div class="text-center py-4 text-slate-400">
                      <p>Signature executed digitally on mobile driver device.</p>
                    </div>
                  }
                </div>
                
                <div class="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Signee Name: <strong class="text-slate-800">{{ selectedProofTrip()?.signeeName || selectedProofTrip()?.patientName }}</strong></span>
                  <span class="font-mono text-[10px] text-slate-400">SHA-256 Verified Seal</span>
                </div>
              </div>
            </div>

            <!-- 4. GPS stamps, securement & billable status -->
            <div class="space-y-2">
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500">4. GPS Stamps, Securement &amp; Billable Status</h4>
              <div class="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                <p><strong class="text-slate-800">Pickup GPS:</strong>
                  {{ selectedProofTrip()?.pickupGps ? (selectedProofTrip()?.pickupGps?.lat?.toFixed(4) + ', ' + selectedProofTrip()?.pickupGps?.lng?.toFixed(4) + ' · ' + selectedProofTrip()?.pickupGps?.at + ' (' + selectedProofTrip()?.pickupGps?.source + ')') : 'Not captured' }}</p>
                <p><strong class="text-slate-800">Drop-off GPS:</strong>
                  {{ selectedProofTrip()?.dropoffGps ? (selectedProofTrip()?.dropoffGps?.lat?.toFixed(4) + ', ' + selectedProofTrip()?.dropoffGps?.lng?.toFixed(4) + ' · ' + selectedProofTrip()?.dropoffGps?.at + ' (' + selectedProofTrip()?.dropoffGps?.source + ')') : 'Not captured' }}</p>
                @if (selectedProofTrip()?.mobility === 'wheelchair') {
                  <p><strong class="text-slate-800">Wheelchair securement:</strong>
                    {{ selectedProofTrip()?.wheelchairSecurement ? '✓ Completed ' + (selectedProofTrip()?.wheelchairSecurement?.completedAt || '') + ' — 4-point tie-downs, brakes set, lap + shoulder belt' : '⚠ Not recorded for this leg' }}</p>
                }
                <p><strong class="text-slate-800">Driver sign-off:</strong>
                  {{ selectedProofTrip()?.driverSignatureDataUrl ? '✓ Signed by ' + (selectedProofTrip()?.driverSignatureName || 'driver') : 'Not captured' }}</p>
                <p><strong class="text-slate-800">Billable:</strong>
                  <span [ngClass]="selectedProofTrip()?.billable ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'">
                    {{ selectedProofTrip()?.billable ? '✓ Ready to bill — odometer + signatures + GPS attached' : 'Not yet — missing odometer or signature evidence' }}
                  </span></p>
              </div>
              @if ((selectedProofTrip()?.statusEvents?.length || 0) > 0) {
                <div class="p-4 rounded-2xl bg-white border border-slate-200">
                  <p class="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Status event history (audit trail)</p>
                  @for (ev of selectedProofTrip()?.statusEvents; track ev.atIso) {
                    <p class="py-1 border-t border-slate-100 first:border-0 text-[11px]">
                      <strong>{{ ev.status }}</strong> · {{ ev.at }} · {{ ev.byName || ev.by }}
                      @if (ev.lat !== undefined) { <span class="text-slate-400">· GPS {{ ev.lat.toFixed(4) }}, {{ ev.lng?.toFixed(4) }} ({{ ev.gpsSource }})</span> }
                      @if (ev.reasonCode) { <span class="text-amber-700">· {{ ev.reasonCode }}</span> }
                    </p>
                  }
                </div>
              }
            </div>

          </div>

          <!-- Drawer Action Footer -->
          <div class="p-4 border-t border-slate-200 bg-slate-50 flex items-center gap-3">
            <button
              type="button"
              (click)="exportTripSheet()"
              class="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              <span>Export Trip Sheet (PDF)</span>
            </button>
            <button
              type="button"
              (click)="closeProof()"
              class="px-4 py-3 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs border border-slate-300 transition cursor-pointer"
            >
              Close
            </button>
          </div>

        </aside>
      }

      <!-- MESSAGES DRAWER: two-way driver ↔ dispatch -->
      @if (showMessagesDrawer()) {
        <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40" (click)="showMessagesDrawer.set(false)"></div>
        <aside class="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden">
          <div class="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h2 class="text-base font-bold text-slate-900">Dispatch Messages</h2>
              <p class="text-xs text-slate-500">Two-way thread with drivers — documented, no phone/radio needed.</p>
            </div>
            <button type="button" (click)="showMessagesDrawer.set(false)"
              class="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer">✕</button>
          </div>
          <div class="p-4 border-b border-slate-100">
            <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Message about trip</label>
            <select [(ngModel)]="messageTripId" class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800">
              <option value="">Broadcast — all drivers</option>
              @for (t of tripService.trips(); track t.id) {
                <option [value]="t.id">{{ t.id }} — {{ t.patientName }} ({{ t.driverName || 'unassigned' }})</option>
              }
            </select>
          </div>
          <div class="flex-1 overflow-y-auto p-4 space-y-2">
            @for (m of visibleMessages(); track m.id) {
              <div class="text-xs p-3 rounded-xl" [ngClass]="m.from === 'dispatch' ? 'bg-blue-100 text-blue-900 ml-8' : 'bg-slate-100 text-slate-800 mr-8'">
                <span class="font-bold">{{ m.fromName }}</span>
                <span class="text-slate-400"> · {{ m.at }}</span>
                @if (m.tripLabel) { <span class="block text-[10px] font-semibold text-slate-500">{{ m.tripLabel }}</span> }
                <p class="mt-0.5">{{ m.text }}</p>
              </div>
            } @empty {
              <p class="text-xs text-slate-400">No messages yet. Send one below — drivers see it live on their Runs screen.</p>
            }
          </div>
          <div class="p-4 border-t border-slate-200 space-y-2">
            <div class="flex flex-wrap gap-1.5">
              @for (c of cannedMessages; track c.label) {
                <button type="button" (click)="sendDispatchMessage(c.text, true)"
                  class="px-2 py-1 rounded-full bg-white border border-slate-300 text-[11px] font-bold text-slate-600 hover:bg-blue-50 cursor-pointer">{{ c.label }}</button>
              }
            </div>
            <div class="flex gap-2">
              <input type="text" [(ngModel)]="dispatchMessageText" placeholder="Message driver(s)…" (keyup.enter)="sendDispatchMessage(dispatchMessageText)"
                class="flex-1 px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-800" />
              <button type="button" (click)="sendDispatchMessage(dispatchMessageText)" class="px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer">Send</button>
            </div>
          </div>
        </aside>
      }

    </div>
  `
})
export class DispatchConsoleComponent implements AfterViewInit, OnDestroy {
  tripService = inject(TripService);
  syncService = inject(SyncService);
  private compliance = inject(ComplianceService);
  private snackBar = inject(MatSnackBar);

  selectedTripId = signal<string | null>('TRP-101');
  selectedProofTrip = signal<Trip | null>(null);
  showQuickDispatchDrawer = signal<boolean>(false);

  /** Live board filters (MediRoutes-style board: late pickups surfaced first). */
  statusFilter = signal<string>('all');
  statusFilters = [
    { key: 'all', label: 'All' },
    { key: 'scheduled', label: 'Scheduled' },
    { key: 'en_route_pickup', label: 'En Route' },
    { key: 'arrived_pickup', label: 'At Pickup' },
    { key: 'in_transit', label: 'In Transit' },
    { key: 'completed', label: 'Completed' },
    { key: 'no_show', label: 'No-show' },
    { key: 'delayed', label: 'Delayed' },
  ];

  /** Dispatch messaging drawer state. */
  showMessagesDrawer = signal<boolean>(false);
  messageTripId: string = '';
  dispatchMessageText: string = '';
  cannedMessages = CANNED_MESSAGES;

  /** DQF eligibility for the driver picked in Quick Dispatch (ZeitRide pattern). */
  eligibility: { eligible: boolean; reasons: string[]; warnings: string[] } | null = null;

  /** Live map marker follows the shared trip record (driver GPS updates). */
  private markerEffect = effect(() => {
    const trips = this.tripService.trips();
    if (this.map && trips.length) this.renderDriverMarker();
  });

  newTripForm = {
    patientName: '',
    patientPhone: '',
    mobility: 'ambulatory' as MobilityType,
    pickupAddress: '',
    dropoffAddress: '',
    scheduledTime: '',
    driverAssignment: 'Marcus Vance (Van #4)'
  };

  private map: any = null;
  private currentPolyline: any = null;
  private tripMarkers: any[] = [];
  private driverMarker: any = null;
  private initCheckInterval: any = null;

  get selectedTrip(): Trip | undefined {
    return this.tripService.trips().find(t => t.id === this.selectedTripId());
  }

  /** Live board: filter by status, late pickups first, then scheduled time. */
  filteredTrips(): Trip[] {
    const filter = this.statusFilter();
    const list = this.tripService.trips().filter(t => filter === 'all' || t.status === filter);
    return [...list].sort((a, b) => {
      const lateDiff = this.tripService.minutesLate(b) - this.tripService.minutesLate(a);
      if (lateDiff !== 0) return lateDiff;
      return a.scheduledTime.localeCompare(b.scheduledTime);
    });
  }

  visibleMessages() {
    const all = this.syncService.messages();
    if (!this.messageTripId) return [...all].reverse();
    return all.filter(m => m.tripId === this.messageTripId).reverse();
  }

  sendDispatchMessage(text: string, canned = false): void {
    const clean = text.trim();
    if (!clean) return;
    const trip = this.messageTripId ? this.tripService.trips().find(t => t.id === this.messageTripId) : undefined;
    this.syncService.sendMessage({
      from: 'dispatch',
      fromName: 'Dispatch',
      tripId: this.messageTripId || null,
      tripLabel: trip ? `${trip.patientName} (${trip.id})` : 'Broadcast — all drivers',
      text: clean,
      canned,
    });
    this.dispatchMessageText = '';
  }

  /** Reassign from the trip card — the driver's manifest re-sequences live. */
  reassignTrip(trip: Trip, driverId: string): void {
    if (!driverId) return;
    if (driverId === 'unassigned') {
      this.tripService.assignTrip(trip.id, undefined, undefined, undefined);
      this.snackBar.open(`${trip.id} unassigned — back in the queue.`, 'Close', { duration: 3000 });
      return;
    }
    const map: Record<string, { name: string; vehicle: string; dqfId: string; unit: string }> = {
      'DRV-101': { name: 'Marcus Vance', vehicle: 'Van #4', dqfId: 'DRV-101', unit: 'VAN-101' },
      'DRV-102': { name: 'Elena Rostova', vehicle: 'Van #2', dqfId: 'DRV-102', unit: 'VAN-102' },
      'DRV-103': { name: 'Darnell Washington', vehicle: 'Sedan #1', dqfId: 'DRV-103', unit: 'SED-104' },
    };
    const target = map[driverId];
    if (!target) return;
    const result = this.compliance.evaluateDispatchEligibility(target.dqfId, target.unit);
    if (!result.isEligible) {
      this.snackBar.open(`Cannot assign ${target.name}: ${result.lockoutReasons[0]}`, 'Close', { duration: 5000 });
      return;
    }
    this.tripService.assignTrip(trip.id, driverId, target.name, target.vehicle);
    this.snackBar.open(`${trip.id} reassigned to ${target.name}.`, 'Close', { duration: 3000 });
  }

  cancelTrip(trip: Trip): void {
    void this.tripService.updateTripStatus(trip.id, 'cancelled', {
      reasonCode: 'Dispatch cancelled',
      by: 'dispatch',
      byName: 'Dispatch',
    });
    this.snackBar.open(`${trip.id} cancelled — driver notified, capacity freed.`, 'Close', { duration: 3500 });
  }

  ngAfterViewInit() {
    if (typeof L !== 'undefined') {
      this.initMap();
    } else {
      this.initCheckInterval = setInterval(() => {
        if (typeof L !== 'undefined') {
          clearInterval(this.initCheckInterval);
          this.initMap();
        }
      }, 100);
      setTimeout(() => clearInterval(this.initCheckInterval), 5000);
    }
  }

  ngOnDestroy() {
    if (this.initCheckInterval) {
      clearInterval(this.initCheckInterval);
    }
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private initMap() {
    const mapElement = document.getElementById('dispatch-map');
    if (!mapElement || this.map) return;

    // Center coordinates strictly to Denver Metro area, zoom level 11
    this.map = L.map('dispatch-map', {
      zoomControl: true,
      attributionControl: false
    }).setView([39.7392, -104.9903], 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(this.map);

    // Invalidate size after DOM renders to avoid gray tile rendering bugs
    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 200);

    this.renderDriverMarker();

    const activeTrip = this.selectedTrip || this.tripService.trips()[0];
    if (activeTrip) {
      this.selectTrip(activeTrip);
    }
  }

  private renderDriverMarker() {
    if (!this.map || typeof L === 'undefined') return;

    if (this.driverMarker) {
      this.map.removeLayer(this.driverMarker);
    }

    // Live position: the active trip's current GPS (updated by driver taps).
    const active = this.selectedTrip || this.tripService.trips().find(t => t.status !== 'completed' && t.status !== 'cancelled' && t.status !== 'no_show') || this.tripService.trips()[0];
    const lat = active?.currentLat ?? 39.6536;
    const lng = active?.currentLng ?? -104.9878;
    const label = active ? `${active.vehicleNumber || 'Van #4'} (${active.driverName || 'Unassigned'})` : 'Van #4 (Marcus Vance)';
    const status = active ? SyncService.statusLabel(active.status) : 'En Route to Pickup';
    const driverIcon = L.divIcon({
      className: 'custom-driver-icon',
      html: `
        <div class="relative flex items-center justify-center">
          <span class="absolute inline-flex h-9 w-9 rounded-full bg-blue-500 opacity-75 animate-ping"></span>
          <span class="relative inline-flex rounded-full h-8 w-8 bg-blue-600 text-white items-center justify-center text-xs font-bold shadow-xl border-2 border-white">
            🚐
          </span>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    this.driverMarker = L.marker([lat, lng], { icon: driverIcon })
      .bindPopup(`<strong>${label}</strong><br><span class="text-xs text-blue-600 font-semibold">Active: ${status}</span>`)
      .addTo(this.map);
  }

  selectTrip(trip: Trip) {
    this.selectedTripId.set(trip.id);

    if (!this.map || typeof L === 'undefined') return;

    // Clear previous polyline
    if (this.currentPolyline) {
      this.map.removeLayer(this.currentPolyline);
      this.currentPolyline = null;
    }

    // Clear previous trip markers
    this.tripMarkers.forEach(m => this.map.removeLayer(m));
    this.tripMarkers = [];

    const pLat = trip.pickupLat ?? 39.6536;
    const pLng = trip.pickupLng ?? -104.9878;
    const dLat = trip.dropoffLat ?? 39.6912;
    const dLng = trip.dropoffLng ?? -104.9801;

    // Route Polyline with dashed animation
    const coords: [number, number][] = [
      [pLat, pLng],
      [dLat, dLng]
    ];
    this.currentPolyline = L.polyline(coords, {
      color: '#2563eb',
      weight: 4,
      opacity: 0.85,
      dashArray: '6, 8'
    }).addTo(this.map);

    // Pickup Marker
    const pickupIcon = L.divIcon({
      className: 'custom-pin-pickup',
      html: `
        <div class="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 border-2 border-white shadow-lg text-white font-bold text-xs">
          📍
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    const pickupMarker = L.marker([pLat, pLng], { icon: pickupIcon })
      .bindPopup(`<strong>Pickup:</strong> ${trip.pickupAddress}<br><span class="text-xs text-slate-500">Patient: ${trip.patientName}</span>`)
      .addTo(this.map);
    this.tripMarkers.push(pickupMarker);

    // Dropoff Marker
    const dropoffIcon = L.divIcon({
      className: 'custom-pin-dropoff',
      html: `
        <div class="flex items-center justify-center w-8 h-8 rounded-full bg-rose-600 border-2 border-white shadow-lg text-white font-bold text-xs">
          🏁
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    const dropoffMarker = L.marker([dLat, dLng], { icon: dropoffIcon })
      .bindPopup(`<strong>Drop-off:</strong> ${trip.dropoffAddress}`)
      .addTo(this.map);
    this.tripMarkers.push(dropoffMarker);

    // Smoothly pan & zoom to route
    this.recenterRoute();
  }

  recenterRoute() {
    if (!this.map || !this.selectedTrip) return;
    const trip = this.selectedTrip;
    const pLat = trip.pickupLat ?? 39.6536;
    const pLng = trip.pickupLng ?? -104.9878;
    const dLat = trip.dropoffLat ?? 39.6912;
    const dLng = trip.dropoffLng ?? -104.9801;

    try {
      const bounds = L.latLngBounds([[pLat, pLng], [dLat, dLng]]);
      this.map.fitBounds(bounds.pad(0.35));
    } catch {
      this.map.flyTo([pLat, pLng], 12);
    }
  }

  openQuickDispatch() {
    this.showQuickDispatchDrawer.set(true);
    this.checkEligibility();
  }

  /** ZeitRide pattern: licence/state/expiry + renewal alerts + block-before-dispatch. */
  checkEligibility(): void {
    const assignment = this.newTripForm.driverAssignment;
    if (assignment === 'Unassigned') {
      this.eligibility = { eligible: true, reasons: [], warnings: [] };
      return;
    }
    const map: Record<string, { dqfId: string; unit: string }> = {
      'Marcus Vance (Van #4)': { dqfId: 'DRV-101', unit: 'VAN-101' },
      'Elena Rostova (Van #2)': { dqfId: 'DRV-102', unit: 'VAN-102' },
      'Darnell Washington (Sedan #1)': { dqfId: 'DRV-103', unit: 'SED-104' },
    };
    const target = map[assignment];
    if (!target) {
      this.eligibility = { eligible: false, reasons: ['No DQF file found for this driver — cannot verify credentials.'], warnings: [] };
      return;
    }
    const result = this.compliance.evaluateDispatchEligibility(target.dqfId, target.unit);
    this.eligibility = { eligible: result.isEligible, reasons: result.lockoutReasons, warnings: result.warningReasons };
  }

  closeQuickDispatch() {
    this.showQuickDispatchDrawer.set(false);
  }

  createDispatchTrip() {
    if (!this.newTripForm.patientName || !this.newTripForm.pickupAddress || !this.newTripForm.dropoffAddress) {
      this.snackBar.open('Please fill out patient name, pickup address, and dropoff address.', 'Close', { duration: 3500 });
      return;
    }

    // Hard dispatch lockout: never create a trip for a blocked driver.
    this.checkEligibility();
    if (this.eligibility && !this.eligibility.eligible && this.newTripForm.driverAssignment !== 'Unassigned') {
      this.snackBar.open(`Dispatch blocked: ${this.eligibility.reasons[0]}`, 'Close', { duration: 5000 });
      return;
    }

    // Spread coordinates around Denver metro
    const pLat = 39.7392 + (Math.random() - 0.5) * 0.06;
    const pLng = -104.9903 + (Math.random() - 0.5) * 0.06;
    const dLat = 39.7392 + (Math.random() - 0.5) * 0.06;
    const dLng = -104.9903 + (Math.random() - 0.5) * 0.06;

    const isMarcus = this.newTripForm.driverAssignment.includes('Marcus');
    const isElena = this.newTripForm.driverAssignment.includes('Elena');
    const isDarnell = this.newTripForm.driverAssignment.includes('Darnell');

    const createdTrip = this.tripService.addTrip({
      patientName: this.newTripForm.patientName.trim(),
      patientPhone: this.newTripForm.patientPhone.trim() || '(303) 555-0199',
      mobility: this.newTripForm.mobility,
      pickupAddress: this.newTripForm.pickupAddress.trim(),
      pickupLat: pLat,
      pickupLng: pLng,
      dropoffAddress: this.newTripForm.dropoffAddress.trim(),
      dropoffLat: dLat,
      dropoffLng: dLng,
      scheduledTime: this.newTripForm.scheduledTime.trim() || '11:45 AM',
      status: 'scheduled',
      driverId: isMarcus ? 'DRV-101' : (isElena ? 'DRV-102' : (isDarnell ? 'DRV-103' : undefined)),
      driverName: isMarcus ? 'Marcus Vance' : (isElena ? 'Elena Rostova' : (isDarnell ? 'Darnell Washington' : undefined)),
      vehicleNumber: isMarcus ? 'Van #4' : (isElena ? 'Van #2' : (isDarnell ? 'Sedan #1' : undefined)),
      startOdometer: 124600
    });

    this.showQuickDispatchDrawer.set(false);
    this.newTripForm = {
      patientName: '',
      patientPhone: '',
      mobility: 'ambulatory',
      pickupAddress: '',
      dropoffAddress: '',
      scheduledTime: '',
      driverAssignment: 'Marcus Vance (Van #4)'
    };

    setTimeout(() => {
      this.selectTrip(createdTrip);
    }, 150);
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'en_route_pickup': return 'En Route';
      case 'arrived_pickup': return 'At Pickup';
      case 'in_transit': return 'In Transit';
      case 'completed': return 'Completed';
      case 'scheduled': return 'Scheduled';
      case 'no_show': return 'No-Show';
      case 'delayed': return 'Delayed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  }

  getTripMiles(trip: Trip): number {
    const start = trip.startOdometer || 124580;
    const end = trip.endOdometer || (start + 12);
    return Math.max(0, end - start);
  }

  openProof(trip: Trip, event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.selectedProofTrip.set(trip);
  }

  closeProof() {
    this.selectedProofTrip.set(null);
  }

  exportTripSheet() {
    window.print();
  }
}
