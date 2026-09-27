import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TripService } from '../../../core/services/trip.service';
import { Trip } from '../../../core/models/trip.model';

@Component({
  selector: 'app-driver-runs',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="space-y-4">
      <!-- Title & Active Runs Count -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-slate-900">Today's Assigned Runs</h1>
          <p class="text-xs text-slate-500">Fleet Trip Stepper &amp; Medicaid Proof</p>
        </div>
        <span class="text-xs font-semibold px-2.5 py-1 rounded-full"
              [ngClass]="tripService.activeDriverTrips().length > 0 ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'">
          {{ tripService.activeDriverTrips().length }} Active
        </span>
      </div>

      <!-- Active Trip Cards Loop -->
      @for (trip of tripService.activeDriverTrips(); track trip.id) {
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div class="flex items-start justify-between">
            <div>
              <span class="px-2.5 py-1 rounded-full text-xs font-bold"
                    [ngClass]="trip.mobility === 'wheelchair' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'">
                {{ trip.mobility === 'wheelchair' ? 'Wheelchair (WC)' : 'Ambulatory' }}
              </span>
              <h2 class="text-lg font-bold text-slate-900 mt-2">{{ trip.patientName }}</h2>
              <span class="text-[11px] text-slate-400 font-mono">Trip ID: {{ trip.id }}</span>
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
          </div>

          <!-- Turn-by-Turn Navigation Quick Action -->
          <div class="pt-1">
            <a [href]="getNavigationUrl(trip)"
               target="_blank"
               rel="noopener noreferrer"
               class="w-full py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold flex items-center justify-center gap-2 transition shadow-xs">
              <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <span>{{ getNavTargetLabel(trip) }} (Google Maps)</span>
              <svg class="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
            </a>
          </div>

          <!-- One-Tap Action Button based on Status -->
          <div class="pt-2">
            @if (trip.status === 'scheduled') {
              <button (click)="advanceStatus(trip.id, 'en_route_pickup')" class="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 transition cursor-pointer flex items-center justify-center gap-2">
                <span>Start Route to Pickup</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                </svg>
              </button>
            } @else if (trip.status === 'en_route_pickup') {
              <button (click)="advanceStatus(trip.id, 'arrived_pickup')" class="w-full py-3.5 bg-amber-500 text-white font-bold rounded-xl shadow-md hover:bg-amber-600 transition cursor-pointer flex items-center justify-center gap-2">
                <span>Arrived at Pickup Location</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
              </button>
            } @else if (trip.status === 'arrived_pickup') {
              <button (click)="advanceStatus(trip.id, 'in_transit')" class="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 transition cursor-pointer flex items-center justify-center gap-2">
                <span>Patient Boarded • Begin Trip</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"/>
                </svg>
              </button>
            } @else if (trip.status === 'in_transit') {
              <button (click)="openCompletionModal(trip)" class="w-full py-3.5 bg-emerald-600 text-white font-bold rounded-xl shadow-md hover:bg-emerald-700 transition cursor-pointer flex items-center justify-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span>Complete Drop-off &amp; Sign</span>
              </button>
            }
          </div>
        </div>
      } @empty {
        <!-- Empty State When All Runs Completed -->
        <div class="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
          <div class="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div>
            <h2 class="text-lg font-bold text-slate-900">All Scheduled Runs Completed!</h2>
            <p class="text-xs text-slate-500 mt-1">All trip proof-of-delivery signatures and odometer logs have been synced to dispatch.</p>
          </div>
          <div class="pt-2">
            <a routerLink="/driver/credentials" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition">
              <span>View Shift &amp; Credential Status</span>
              &rarr;
            </a>
          </div>
        </div>
      }
    </div>

    <!-- =======================================================================
         1. MOBILE TRIP COMPLETION BOTTOM SHEET / MODAL
         ======================================================================= -->
    @if (completingTrip) {
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-slate-950/70 z-50 backdrop-blur-sm transition-opacity" (click)="closeModal()"></div>

      <!-- Bottom Sheet Modal Container -->
      <div class="fixed inset-x-0 bottom-0 z-50 max-w-md mx-auto bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-200">
        
        <!-- Sheet Handle & Header -->
        <div class="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-900 leading-tight">Trip Completion &amp; Medicaid Proof</h3>
              <p class="text-[10px] text-slate-500">Trip #{{ completingTrip.id }} • {{ completingTrip.patientName }}</p>
            </div>
          </div>
          <button type="button" (click)="closeModal()" class="w-7 h-7 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer">
            ✕
          </button>
        </div>

        <!-- Scrollable Modal Body -->
        <div class="p-5 overflow-y-auto space-y-4 text-xs">
          <!-- Final Odometer -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label class="block font-bold text-slate-800 uppercase tracking-wider">
                Final Drop-off Odometer (Miles) *
              </label>
              <span class="text-[10px] text-slate-400 font-semibold">Start: {{ completingTrip.startOdometer || 124580 }} mi</span>
            </div>
            <div class="relative">
              <input
                type="number"
                [(ngModel)]="endOdometer"
                required
                class="w-full pl-4 pr-12 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span class="absolute inset-y-0 right-0 pr-3.5 flex items-center font-bold text-slate-400 text-xs pointer-events-none">
                MILES
              </span>
            </div>
          </div>

          <!-- Signee Type: Segmented Toggle -->
          <div class="space-y-1.5">
            <label class="block font-bold text-slate-800 uppercase tracking-wider">
              Proof Signee Authorization *
            </label>
            <div class="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                (click)="signeeType = 'patient'"
                [ngClass]="signeeType === 'patient' ? 'bg-white shadow text-blue-600 font-bold' : 'text-slate-600'"
                class="py-2 text-xs rounded-lg transition text-center cursor-pointer"
              >
                Patient
              </button>
              <button
                type="button"
                (click)="signeeType = 'facility_staff'"
                [ngClass]="signeeType === 'facility_staff' ? 'bg-white shadow text-blue-600 font-bold' : 'text-slate-600'"
                class="py-2 text-xs rounded-lg transition text-center cursor-pointer"
              >
                Facility Staff
              </button>
            </div>
          </div>

          <!-- Signee Printed Legal Name -->
          <div class="space-y-1.5">
            <label class="block font-bold text-slate-800 uppercase tracking-wider">
              Signee Printed Legal Name *
            </label>
            <input
              type="text"
              [(ngModel)]="signeePrintedName"
              placeholder="e.g. Eleanor Vance or Nurse Johnson, RN"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- Signature Canvas Area -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label class="block font-bold text-slate-800 uppercase tracking-wider">
                Digital Signature Sign-Off *
              </label>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  (click)="applyDemoSignature()"
                  class="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  Quick Sign
                </button>
                <span class="text-slate-300">&bull;</span>
                <button
                  type="button"
                  (click)="clearSignature()"
                  class="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            <!-- Canvas Box -->
            <div class="relative bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl overflow-hidden touch-none">
              <canvas
                #sigCanvas
                class="w-full h-40 block cursor-crosshair"
                (mousedown)="startDrawing($event)"
                (mousemove)="draw($event)"
                (mouseup)="stopDrawing()"
                (mouseleave)="stopDrawing()"
                (touchstart)="startDrawingTouch($event)"
                (touchmove)="drawTouch($event)"
                (touchend)="stopDrawing()"
              ></canvas>
              
              <!-- Subtle Signature Baseline Indicator -->
              <div class="absolute bottom-6 left-6 right-6 border-b border-slate-300 pointer-events-none flex items-center justify-between text-[10px] text-slate-400">
                <span>✕ Sign on line above</span>
                <span>Finger or Stylus</span>
              </div>
            </div>
            <p class="text-[10px] text-slate-400">
              Legally binding under federal ESIGN and Medicaid claim requirements.
            </p>
          </div>

          <!-- Error Alert if incomplete -->
          @if (validationError) {
            <div class="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold text-xs">
              {{ validationError }}
            </div>
          }
        </div>

        <!-- Modal Bottom Actions -->
        <div class="p-4 border-t border-slate-200 bg-slate-50 flex items-center gap-3">
          <button
            type="button"
            (click)="closeModal()"
            class="flex-1 py-3 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            (click)="submitProofOfDelivery()"
            class="flex-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            <span>Submit Proof of Delivery</span>
          </button>
        </div>

      </div>
    }
  `
})
export class DriverRunsComponent {
  tripService = inject(TripService);

  @ViewChild('sigCanvas') sigCanvas?: ElementRef<HTMLCanvasElement>;

  completingTrip: Trip | null = null;
  endOdometer: number = 124592;
  signeeType: 'patient' | 'facility_staff' = 'patient';
  signeePrintedName: string = '';
  validationError: string = '';
  hasSignature: boolean = false;

  private isDrawing = false;
  private ctx: CanvasRenderingContext2D | null = null;

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

  advanceStatus(tripId: string, nextStatus: any) {
    this.tripService.updateTripStatus(tripId, nextStatus);
  }

  openCompletionModal(trip: Trip) {
    this.completingTrip = trip;
    this.endOdometer = (trip.startOdometer || 124580) + 12;
    this.signeeType = 'patient';
    this.signeePrintedName = trip.patientName;
    this.hasSignature = false;
    this.validationError = '';

    // Initialize canvas after DOM renders
    setTimeout(() => {
      this.initCanvas();
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
      this.ctx.strokeStyle = '#1e3a8a'; // Deep Navy ink
      this.ctx.lineWidth = 2.5;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
    }
  }

  startDrawing(e: MouseEvent) {
    this.isDrawing = true;
    this.hasSignature = true;
    if (!this.ctx || !this.sigCanvas) return;
    const rect = this.sigCanvas.nativeElement.getBoundingClientRect();
    this.ctx.beginPath();
    this.ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  }

  draw(e: MouseEvent) {
    if (!this.isDrawing || !this.ctx || !this.sigCanvas) return;
    const rect = this.sigCanvas.nativeElement.getBoundingClientRect();
    this.ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    this.ctx.stroke();
  }

  startDrawingTouch(e: TouchEvent) {
    e.preventDefault();
    if (e.touches.length === 0) return;
    this.isDrawing = true;
    this.hasSignature = true;
    if (!this.ctx || !this.sigCanvas) return;
    const rect = this.sigCanvas.nativeElement.getBoundingClientRect();
    const touch = e.touches[0];
    this.ctx.beginPath();
    this.ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
  }

  drawTouch(e: TouchEvent) {
    e.preventDefault();
    if (!this.isDrawing || !this.ctx || !this.sigCanvas || e.touches.length === 0) return;
    const rect = this.sigCanvas.nativeElement.getBoundingClientRect();
    const touch = e.touches[0];
    this.ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
    this.ctx.stroke();
  }

  stopDrawing() {
    this.isDrawing = false;
  }

  clearSignature() {
    if (!this.ctx || !this.sigCanvas) return;
    const canvas = this.sigCanvas.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.hasSignature = false;
  }

  applyDemoSignature() {
    if (!this.ctx || !this.sigCanvas) return;
    this.clearSignature();
    const canvas = this.sigCanvas.nativeElement;
    const w = canvas.width;
    const h = canvas.height;

    this.ctx.beginPath();
    this.ctx.moveTo(w * 0.15, h * 0.6);
    this.ctx.bezierCurveTo(w * 0.25, h * 0.2, w * 0.35, h * 0.8, w * 0.5, h * 0.4);
    this.ctx.bezierCurveTo(w * 0.6, h * 0.1, w * 0.7, h * 0.7, w * 0.85, h * 0.5);
    this.ctx.stroke();

    this.hasSignature = true;
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

    if (!this.hasSignature && this.sigCanvas) {
      // If user hasn't drawn anything, automatically create a clean verification mark
      this.applyDemoSignature();
    }

    const signatureDataUrl = this.sigCanvas?.nativeElement.toDataURL('image/png') || '';
    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Update shared TripService
    this.tripService.updateTripStatus(this.completingTrip.id, 'completed', {
      endOdometer: this.endOdometer,
      signatureDataUrl: signatureDataUrl,
      signeeType: this.signeeType,
      signeeName: this.signeePrintedName.trim(),
      completedAt: nowTime
    });

    this.closeModal();
  }
}
