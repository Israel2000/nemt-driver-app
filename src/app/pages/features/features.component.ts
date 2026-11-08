import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-500 selection:text-white">

      <!-- Page header -->
      <section class="pt-14 pb-12 bg-gradient-to-b from-blue-50/70 via-white to-slate-50 border-b border-slate-200/70">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider mb-4">
            End-to-End Capabilities
          </div>
          <h1 class="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight max-w-3xl mx-auto">
            Everything Your Fleet Needs to Operate at Full Capacity
          </h1>
          <p class="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Engineered to satisfy strict state Medicaid regulations while maximizing driver utilization across every daily shift.
          </p>
        </div>
      </section>

      <!-- 3 feature cards -->
      <section id="features" class="py-16 bg-slate-50 scroll-mt-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">

            <div class="fleet-card bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-400 transition-all duration-300 flex flex-col justify-between group">
              <div class="space-y-4">
                <div class="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-xs">
                  <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A2 2 0 013 15.485V5.515a2 2 0 011.553-1.959L9 2m0 18l6 3m-6-3V2m6 21l5.447-2.724A2 2 0 0021 18.485V8.515a2 2 0 00-1.553-1.959L15 4m0 17V4m0 0L9 2"/>
                  </svg>
                </div>
                <h3 class="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Live Desktop Dispatch Console</h3>
                <p class="text-sm text-slate-600 leading-relaxed">Interactive Leaflet map, live driver GPS pings, and instant will-call reassignments. Pinpoint delays before they impact schedules.</p>
                <ul class="pt-2 space-y-2 text-xs text-slate-600">
                  <li class="flex items-center gap-2"><span class="text-blue-600 font-bold">✓</span> Real-time polyline telemetry routing</li>
                  <li class="flex items-center gap-2"><span class="text-blue-600 font-bold">✓</span> Centered quick dispatch modal overlay</li>
                  <li class="flex items-center gap-2"><span class="text-blue-600 font-bold">✓</span> Van-level driver status monitoring</li>
                </ul>
              </div>
              <div class="pt-6 mt-6 border-t border-slate-100">
                <a routerLink="/admin/dispatch" class="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5">
                  <span>Explore Dispatch Console</span> &rarr;
                </a>
              </div>
            </div>

            <div class="fleet-card bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-400 transition-all duration-300 flex flex-col justify-between group">
              <div class="space-y-4">
                <div class="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-xs">
                  <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                  </svg>
                </div>
                <h3 class="text-xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">Driver Web App</h3>
                <p class="text-sm text-slate-600 leading-relaxed">Turn-by-turn routing, one-tap trip status progression, and in-app signoffs — in any browser, with nothing to install. Keeps field operators focused strictly on safe driving.</p>
                <ul class="pt-2 space-y-2 text-xs text-slate-600">
                  <li class="flex items-center gap-2"><span class="text-emerald-600 font-bold">✓</span> Google Maps / Waze direction launcher</li>
                  <li class="flex items-center gap-2"><span class="text-emerald-600 font-bold">✓</span> 1-Tap En Route &rarr; Arrived &rarr; Boarded</li>
                  <li class="flex items-center gap-2"><span class="text-emerald-600 font-bold">✓</span> Digital signature canvas on device</li>
                </ul>
              </div>
              <div class="pt-6 mt-6 border-t border-slate-100">
                <a routerLink="/driver/login" class="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1.5">
                  <span>View Driver Workflow</span> &rarr;
                </a>
              </div>
            </div>

            <div class="fleet-card bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-400 transition-all duration-300 flex flex-col justify-between group">
              <div class="space-y-4">
                <div class="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-xs">
                  <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <h3 class="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Pre-Trip Readiness Verification</h3>
                <p class="text-sm text-slate-600 leading-relaxed">Mandatory daily odometer checks and vehicle safety compliance checklists before unlocking manifest access.</p>
                <ul class="pt-2 space-y-2 text-xs text-slate-600">
                  <li class="flex items-center gap-2"><span class="text-indigo-600 font-bold">✓</span> Certified beginning mileage audit records</li>
                  <li class="flex items-center gap-2"><span class="text-indigo-600 font-bold">✓</span> Daily DVIR pre-trip vehicle walkaround</li>
                  <li class="flex items-center gap-2"><span class="text-indigo-600 font-bold">✓</span> 30-Day CPR &amp; DOT physical sentinels</li>
                </ul>
              </div>
              <div class="pt-6 mt-6 border-t border-slate-100">
                <a routerLink="/admin/overview" class="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5">
                  <span>Inspect Readiness Radar</span> &rarr;
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      <!-- How a trip flows -->
      <section class="py-16 bg-white border-y border-slate-200/80">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center max-w-3xl mx-auto mb-12">
            <h2 class="text-3xl font-extrabold tracking-tight">How a trip flows through FleetOS</h2>
            <p class="mt-3 text-slate-600">From application to audit-ready proof — every step lives in the same system.</p>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            @for (step of flowSteps; track step.n) {
              <a [routerLink]="step.link" class="rounded-2xl border border-slate-200 bg-slate-50 p-5 hover:border-blue-400 hover:shadow-md transition block">
                <div class="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-extrabold text-sm mb-3">{{ step.n }}</div>
                <h3 class="font-bold text-sm">{{ step.title }}</h3>
                <p class="text-xs text-slate-600 leading-relaxed mt-1">{{ step.text }}</p>
              </a>
            }
          </div>
        </div>
      </section>

      <!-- Audit Shield -->
      <section id="audit-shield" class="py-20 bg-white scroll-mt-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center max-w-3xl mx-auto mb-16">
            <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-3">
              Continuous Regulatory Defense
            </div>
            <h2 class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Medicaid Audit Shield: Zero Billing Denials
            </h2>
            <p class="mt-3 text-base sm:text-lg text-slate-600 leading-relaxed">
              Brokers and state auditors routinely claw back thousands for missing signatures and undocumented drop-offs. FleetOS makes every trip airtight.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div class="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-400 transition shadow-xs space-y-3">
              <h3 class="text-lg font-bold text-slate-900">Driver Qualification Files</h3>
              <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">Every driver file — license, MVR, CPR, DOT medical card, PASS certification — tracked with expiration dates and renewal uploads in one vault.</p>
            </div>
            <div class="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-400 transition shadow-xs space-y-3">
              <h3 class="text-lg font-bold text-slate-900">GPS-Stamped Odometer Logs</h3>
              <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">Starting and ending mileage captured with GPS timestamps on every run, so loaded vs. unloaded miles are provable, not estimated.</p>
            </div>
            <div class="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-400 transition shadow-xs space-y-3">
              <h3 class="text-lg font-bold text-slate-900">1-Click State Audit Package</h3>
              <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">Trip logs, signatures, DVIRs, and credential records compiled into a single audit binder, ready in under 5 seconds.</p>
            </div>
          </div>

          <div class="rounded-3xl bg-slate-950 text-white p-8 sm:p-10 max-w-5xl mx-auto">
            <span class="text-xs uppercase tracking-widest font-bold text-slate-400">Why Fleets Switch</span>
            <h3 class="text-2xl font-bold text-white mt-1 mb-6">Paperwork Vulnerability vs. FleetOS Defense</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
              <div class="space-y-3">
                <p class="font-bold text-slate-300"><span class="text-rose-500 font-bold">✕</span> The Old Paper Way</p>
                <p class="text-slate-400"><span class="text-rose-500 font-bold">✕</span> Paper clipboards lost between dialysis centers &amp; clinics</p>
                <p class="text-slate-400"><span class="text-rose-500 font-bold">✕</span> Denied Medicaid claims due to missing patient signatures</p>
                <p class="text-slate-400"><span class="text-rose-500 font-bold">✕</span> Surprise state audit panic hunting through binders</p>
                <p class="text-slate-400"><span class="text-rose-500 font-bold">✕</span> Paying admin salaries just to track CPR card expirations</p>
              </div>
              <div class="space-y-3">
                <p class="font-bold text-slate-300"><span class="text-emerald-400 font-bold">✓</span> The NEMT FleetOS Standard</p>
                <p class="text-slate-300"><span class="text-emerald-400 font-bold">✓</span> GPS-timestamped digital proof of delivery on every run</p>
                <p class="text-slate-300"><span class="text-emerald-400 font-bold">✓</span> In-app finger signature and odometer capture</p>
                <p class="text-slate-300"><span class="text-emerald-400 font-bold">✓</span> 1-Click audit binder export ready in under 5 seconds</p>
                <p class="text-slate-300"><span class="text-emerald-400 font-bold">✓</span> Automated alerts before credentials lapse</p>
              </div>
            </div>
            <div class="pt-8 text-center">
              <a routerLink="/admin/audit-shield" class="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg transition">
                <span>See the Audit Shield in action</span> &rarr;
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="py-16 bg-slate-50 border-t border-slate-200/80">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight">See the features live in the demo</h2>
          <p class="mt-3 text-slate-600">Open the dispatch console or the driver web app — no account needed to look around.</p>
          <div class="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a routerLink="/admin/dispatch" class="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition">Open Dispatch Console</a>
            <a routerLink="/pricing" class="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-300 shadow-sm transition">See Pricing</a>
          </div>
        </div>
      </section>

    </div>
  `
})
export class FeaturesComponent {
  flowSteps = [
    { n: 1, title: 'Driver applies', text: 'Public application with license, 7-year history, and digital signature.', link: '/apply' },
    { n: 2, title: 'Admin reviews', text: 'Candidate pipeline, MVR status, and one-click approve or reject.', link: '/admin/candidates' },
    { n: 3, title: 'Driver verifies', text: 'Pre-trip DVIR, odometer, and credential check before the shift unlocks.', link: '/driver/login' },
    { n: 4, title: 'Dispatch & drive', text: 'Live GPS dispatch, one-tap trip stepper, and navigation in the browser.', link: '/driver/trips' },
    { n: 5, title: 'Proof & audit', text: 'Signatures, odometer logs, and the 1-click audit package.', link: '/admin/audit-shield' }
  ];
}
