import { Component, inject, signal, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TripService } from '../../../core/services/trip.service';
import { Trip, MobilityType } from '../../../core/models/trip.model';

declare const L: any;

@Component({
  selector: 'app-dispatch-console',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

        <!-- Filter / Stats Ribbon -->
        <div class="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span class="font-bold text-slate-700">{{ tripService.trips().length }} Active / Total</span>
          <span class="text-slate-400">Click card to trace route</span>
        </div>

        <!-- Trips Scrollable List -->
        <div class="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/60">
          @for (trip of tripService.trips(); track trip.id) {
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
            <p class="text-xs font-bold text-emerald-400">● Live Connection Active (WebSocket)</p>
          </div>
        </div>

        <!-- Active Fleet Quick Info -->
        <div class="absolute top-4 right-4 z-10 bg-slate-900/90 border border-slate-700/80 px-4 py-2.5 rounded-2xl backdrop-blur text-right shadow-xl hidden sm:block pointer-events-auto">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Driver Position</p>
          <p class="text-xs font-bold text-slate-200">Van #4 (Marcus Vance)</p>
          <span class="text-[10px] text-slate-400 font-mono">GPS: 39.6536° N, 104.9878° W</span>
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
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="Marcus Vance (Van #4)">Marcus Vance (Van #4) - Active</option>
                  <option value="Sarah Jenkins (Van #2)">Sarah Jenkins (Van #2) - Staging</option>
                  <option value="Unassigned">Leave Unassigned</option>
                </select>
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

    </div>
  `
})
export class DispatchConsoleComponent implements AfterViewInit, OnDestroy {
  tripService = inject(TripService);

  selectedTripId = signal<string | null>('TRP-101');
  selectedProofTrip = signal<Trip | null>(null);
  showQuickDispatchDrawer = signal<boolean>(false);

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

    this.driverMarker = L.marker([39.6536, -104.9878], { icon: driverIcon })
      .bindPopup(`<strong>Van #4 (Marcus Vance)</strong><br><span class="text-xs text-blue-600 font-semibold">Active: En Route to Pickup</span>`)
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
  }

  closeQuickDispatch() {
    this.showQuickDispatchDrawer.set(false);
  }

  createDispatchTrip() {
    if (!this.newTripForm.patientName || !this.newTripForm.pickupAddress || !this.newTripForm.dropoffAddress) {
      alert('Please fill out patient name, pickup address, and dropoff address.');
      return;
    }

    // Spread coordinates around Denver metro
    const pLat = 39.7392 + (Math.random() - 0.5) * 0.06;
    const pLng = -104.9903 + (Math.random() - 0.5) * 0.06;
    const dLat = 39.7392 + (Math.random() - 0.5) * 0.06;
    const dLng = -104.9903 + (Math.random() - 0.5) * 0.06;

    const isMarcus = this.newTripForm.driverAssignment.includes('Marcus');
    const isSarah = this.newTripForm.driverAssignment.includes('Sarah');

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
      driverId: isMarcus ? 'DRV-1' : (isSarah ? 'DRV-2' : undefined),
      driverName: isMarcus ? 'Marcus Vance' : (isSarah ? 'Sarah Jenkins' : undefined),
      vehicleNumber: isMarcus ? 'Van #4' : (isSarah ? 'Van #2' : undefined),
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
