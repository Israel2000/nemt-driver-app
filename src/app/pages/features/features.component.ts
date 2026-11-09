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
      <section class="feat-hero">
        <div class="feat-glow" aria-hidden="true"></div>
        <div class="feat-hero-inner">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider mb-4">
            Platform Capabilities
          </div>
          <h1 class="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight max-w-3xl mx-auto">
            Everything a Medicaid fleet needs, in one place.
          </h1>
          <p class="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            From real-time GPS dispatch boards to 1-click audit binders, explore how FleetOS keeps your vehicles moving and compliant.
          </p>
        </div>
      </section>

      <!-- 2 feature cards (Israel's design) -->
      <section id="features" class="feat-cards-section">
        <div class="feat-container">
          <div class="feat-grid">

            <div class="fleet-card feat-card">
              <div class="feat-icon">📍</div>
              <h3 class="feat-h3">Live Dispatch Command</h3>
              <p class="feat-text">
                Real-time map telemetry, drag-and-drop trip assignments, and instant status updates between dispatch coordinators and drivers in the field.
              </p>
              <ul class="feat-list">
                <li><span class="feat-check">✓</span> Live interactive fleet map</li>
                <li><span class="feat-check">✓</span> Automated late-trip alerts</li>
              </ul>
            </div>

            <div class="fleet-card feat-card">
              <div class="feat-icon">🛡️</div>
              <h3 class="feat-h3">Medicaid Audit Shield</h3>
              <p class="feat-text">
                Automatically bind GPS coordinates, dual digital signatures, and odometer readings to every trip record to completely eliminate claim denials.
              </p>
              <ul class="feat-list">
                <li><span class="feat-check">✓</span> 1-Click PDF audit binder export</li>
                <li><span class="feat-check">✓</span> Proactive credential lockout radar</li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      <!-- How a trip flows (Israel's 5-step design, real CSS — no Tailwind in this project) -->
      <section class="feat-flow">
        <div class="feat-container">
          <div class="feat-flow-header">
            <span class="feat-badge">Workflow Architecture</span>
            <h2 class="feat-flow-h2">How a trip flows through FleetOS</h2>
            <p class="feat-flow-sub">From application to audit-ready proof — every step lives in the same system.</p>
          </div>
          <div class="feat-flow-grid">
            @for (step of flowSteps; track step.n) {
              <a [routerLink]="step.link" class="fleet-card feat-flow-card" [class.feat-flow-card-final]="step.final">
                <div class="feat-flow-top">
                  <div class="feat-flow-num" [class.feat-flow-num-final]="step.final">{{ step.n }}</div>
                  @if (step.final) {
                    <span class="feat-flow-final-pill">Final</span>
                  } @else {
                    <span class="feat-flow-arrow" [class.feat-flow-arrow-green]="step.n === 4" aria-hidden="true">&rarr;</span>
                  }
                </div>
                <h3 class="feat-flow-title">{{ step.title }}</h3>
                <p class="feat-flow-text">{{ step.text }}</p>
                <div class="feat-flow-tag" [class.feat-flow-tag-final]="step.final">{{ step.tag }}</div>
              </a>
              @if (!$last) {
                <div class="feat-flow-arrow-down" aria-hidden="true">&darr;</div>
              }
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
  `,
  styles: [`
    :host { display: block; width: 100%; font-family: "DM Sans", sans-serif; color: #0f172a; background: #ffffff; }
    :host * { font-family: "DM Sans", sans-serif; box-sizing: border-box; }
    /* Features header (Israel's design, real CSS — no Tailwind in this project) */
    .feat-hero { position: relative; overflow: hidden; padding: 80px 16px 64px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; text-align: center; }
    .feat-glow {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: min(500px, 90vw); height: 300px; border-radius: 9999px;
      background: radial-gradient(circle, rgba(37, 99, 235, 0.12) 0%, rgba(37, 99, 235, 0) 70%);
      filter: blur(100px); pointer-events: none; z-index: 0;
    }
    .feat-hero-inner { position: relative; z-index: 1; max-width: 1120px; margin: 0 auto; text-align: center; }
    .feat-badge {
      display: inline-block; padding: 6px 14px; border-radius: 9999px;
      background: #dbeafe; color: #1e40af; font-size: 12px; font-weight: 700;
      letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 16px;
      box-shadow: 0 1px 2px rgba(15,23,42,0.05);
    }
    .feat-h1 {
      max-width: 768px; margin: 0 auto 16px; font-size: 36px; line-height: 1.2;
      font-weight: 800; letter-spacing: -0.02em; color: #0f172a;
    }
    .feat-lead { max-width: 640px; margin: 0 auto; font-size: 18px; line-height: 1.6; color: #475569; }
    /* 2-card grid: 1 column on phones, 2 side-by-side from 768px up */
    .feat-cards-section { padding: 64px 0 96px; background: #f8fafc; }
    .feat-container { max-width: 1120px; margin: 0 auto; padding-left: 16px; padding-right: 16px; }
    .feat-grid { display: grid; grid-template-columns: 1fr; gap: 32px; }
    .feat-card { padding: 32px; border-radius: 24px; background: #ffffff; }
    /* Re-assert Israel's fleet-card values: component-encapsulated rules would
       otherwise override the global .fleet-card background/border. */
    .feat-card.fleet-card {
      background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
      border: 1px solid rgba(226, 232, 240, 0.8);
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .feat-card.fleet-card:hover {
      transform: translateY(-4px);
      border-color: rgba(37, 99, 235, 0.3);
      box-shadow: 0 20px 40px -15px rgba(37, 99, 235, 0.12);
    }
    .feat-icon {
      width: 48px; height: 48px; border-radius: 16px; background: #eff6ff; color: #2563eb;
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; font-weight: 700; margin-bottom: 24px;
      box-shadow: inset 0 2px 4px rgba(15,23,42,0.06);
    }
    .feat-h3 { margin: 0 0 12px; font-size: 24px; line-height: 1.3; font-weight: 700; color: #0f172a; }
    .feat-text { margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #475569; }
    .feat-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; font-size: 14px; font-weight: 500; color: #334155; }
    .feat-list li { display: flex; align-items: center; gap: 8px; }
    .feat-check { color: #2563eb; font-weight: 700; flex-shrink: 0; }
    /* How a trip flows — 5 connected step cards (Israel's design, real CSS) */
    .feat-flow { padding: 64px 0; background: #ffffff; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; }
    .feat-flow-header { max-width: 640px; margin: 0 auto 48px; text-align: center; }
    .feat-flow-h2 { margin: 0 0 12px; font-size: 30px; line-height: 1.2; font-weight: 800; letter-spacing: -0.02em; color: #0f172a; }
    .feat-flow-sub { margin: 0; font-size: 15px; line-height: 1.6; color: #475569; }
    .feat-flow-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
    .feat-flow-card {
      display: flex; flex-direction: column; justify-content: space-between;
      padding: 20px; border-radius: 16px; background: #ffffff; text-decoration: none;
    }
    .feat-flow-card.fleet-card {
      background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
      border: 1px solid rgba(226, 232, 240, 0.8);
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .feat-flow-card.fleet-card:hover {
      transform: translateY(-4px);
      border-color: rgba(37, 99, 235, 0.3);
      box-shadow: 0 20px 40px -15px rgba(37, 99, 235, 0.12);
    }
    .feat-flow-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .feat-flow-num {
      width: 32px; height: 32px; border-radius: 12px; background: #2563eb; color: #ffffff;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; font-weight: 700; box-shadow: 0 1px 2px rgba(15,23,42,0.1); flex-shrink: 0;
    }
    .feat-flow-num-final { background: #059669; }
    .feat-flow-arrow { display: none; font-size: 18px; font-weight: 700; line-height: 1; color: #cbd5e1; transition: color 0.2s ease; }
    .feat-flow-card:hover .feat-flow-arrow { color: #2563eb; }
    .feat-flow-card:hover .feat-flow-arrow-green { color: #059669; }
    .feat-flow-final-pill {
      font-size: 12px; font-weight: 700; color: #059669; background: #ecfdf5;
      padding: 2px 8px; border-radius: 9999px;
    }
    .feat-flow-title { margin: 0 0 4px; font-size: 14px; font-weight: 700; color: #0f172a; }
    .feat-flow-text { margin: 0; font-size: 12px; line-height: 1.6; color: #475569; }
    .feat-flow-tag {
      margin-top: 16px; padding-top: 12px; border-top: 1px solid #f1f5f9;
      font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #2563eb;
    }
    .feat-flow-tag-final { color: #059669; }
    .feat-flow-arrow-down {
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; font-weight: 800; line-height: 1; color: #2563eb; padding: 2px 0;
    }
    @media (min-width: 640px) {
      .feat-flow-grid { grid-template-columns: 1fr 1fr; }
      .feat-flow-arrow-down { display: none; }
      .feat-flow-h2 { font-size: 36px; }
    }
    @media (min-width: 1024px) {
      .feat-flow-grid { grid-template-columns: repeat(5, 1fr); }
      .feat-flow-arrow { display: inline; }
    }
    @media (min-width: 640px) {
      .feat-hero { padding-left: 24px; padding-right: 24px; }
      .feat-container { padding-left: 24px; padding-right: 24px; }
      .feat-h1 { font-size: 44px; }
    }
    @media (min-width: 768px) {
      .feat-grid { grid-template-columns: 1fr 1fr; }
    }
    @media (min-width: 1024px) {
      .feat-hero { padding-left: 32px; padding-right: 32px; }
      .feat-container { padding-left: 32px; padding-right: 32px; }
      .feat-h1 { font-size: 48px; }
    }
  `]
})
export class FeaturesComponent {
  flowSteps = [
    { n: 1, title: 'Driver applies', text: 'Public application with license, history, and signature.', tag: 'Onboarding', final: false, link: '/apply' },
    { n: 2, title: 'Admin reviews', text: 'Candidate pipeline, MVR status, and quick approval.', tag: 'Verification', final: false, link: '/admin/candidates' },
    { n: 3, title: 'Driver verifies', text: 'Pre-trip DVIR, odometer, and credential check before shift.', tag: 'Shift Lock', final: false, link: '/driver/login' },
    { n: 4, title: 'Dispatch & drive', text: 'Live GPS dispatch, trip stepper, and browser navigation.', tag: 'Operations', final: false, link: '/driver/trips' },
    { n: 5, title: 'Proof & audit', text: 'Signatures, odometer logs, and 1-click audit package.', tag: 'Audit Shield', final: true, link: '/admin/audit-shield' }
  ];
}
