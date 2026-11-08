import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatSnackBarModule
  ],
  template: `
    <div class="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-500 selection:text-white">

      <!-- Page header -->
      <section class="pt-14 pb-12 bg-gradient-to-b from-blue-50/70 via-white to-slate-50 border-b border-slate-200/70">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold uppercase tracking-wider mb-4">
            About FleetOS
          </div>
          <h1 class="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight max-w-3xl mx-auto">
            Built by people who have watched NEMT paperwork eat a fleet alive
          </h1>
          <p class="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            NEMT FleetOS is the dispatch, driver, and compliance operating system for non-emergency medical
            transportation providers — built in Colorado, for fleets running 5 to 35 vehicles.
          </p>
        </div>
      </section>

      <!-- Story + values -->
      <section class="py-16 bg-white border-b border-slate-200/80">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div>
            <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight">Why we built this</h2>
            <p class="mt-4 text-slate-600 leading-relaxed">
              A single missing signature can get a whole month of trips denied. A single expired CPR card can
              put a driver on the road illegally — and put the whole company at risk in a Medicaid audit.
              We watched small operators track all of that on clipboards, spreadsheets, and memory, and
              decided the paperwork should defend the fleet instead of threatening it.
            </p>
            <p class="mt-4 text-slate-600 leading-relaxed">
              So FleetOS puts the dispatcher, the driver, and the auditor on the same record: live dispatch
              on desktop, a driver web app that opens in any phone browser, and a credential shield that
              blocks an illegal dispatch before it happens.
            </p>
            <div class="mt-8 flex flex-col sm:flex-row gap-4">
              <a routerLink="/features" class="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition text-center">See what it does</a>
              <a routerLink="/pricing" class="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-300 shadow-sm transition text-center">See pricing</a>
            </div>
          </div>

          <div class="space-y-4">
            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h3 class="font-bold">🛡️ Audit-first, not audit-after</h3>
              <p class="text-sm text-slate-600 mt-1 leading-relaxed">Every trip captures the proof an auditor will ask for — signatures, odometer, GPS times — while it happens, not after.</p>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h3 class="font-bold">📱 No installs, no hardware</h3>
              <p class="text-sm text-slate-600 mt-1 leading-relaxed">Drivers open the web app in the phone they already have. Dispatchers open the console in the browser they already use.</p>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h3 class="font-bold">⏱️ Five minutes to onboard</h3>
              <p class="text-sm text-slate-600 mt-1 leading-relaxed">Create a workspace, invite drivers, and run your first dispatched trip the same day. No setup fees, no contracts.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- How onboarding works -->
      <section class="py-16 bg-slate-50 border-b border-slate-200/80">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center max-w-3xl mx-auto mb-12">
            <h2 class="text-3xl font-extrabold tracking-tight">How onboarding works</h2>
            <p class="mt-3 text-slate-600">From sign-up to your first audited trip in four steps.</p>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            @for (step of onboardingSteps; track step.n) {
              <div class="rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-md transition">
                <div class="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-extrabold text-sm mb-3">{{ step.n }}</div>
                <h3 class="font-bold text-sm">{{ step.title }}</h3>
                <p class="text-xs text-slate-600 leading-relaxed mt-1">{{ step.text }}</p>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- FAQ -->
      <section id="faq" class="py-16 bg-white border-b border-slate-200/80 scroll-mt-20">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-10">
            <h2 class="text-3xl font-extrabold tracking-tight">Frequently Asked Questions</h2>
          </div>
          <div class="space-y-3">
            @for (faq of faqs; track $index) {
              <div class="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden">
                <button type="button" (click)="toggleFaq($index)"
                  class="w-full flex items-center justify-between gap-4 px-5 py-4 text-left font-bold text-sm hover:bg-slate-100 transition">
                  <span>{{ faq.q }}</span>
                  <mat-icon class="shrink-0 text-slate-500">{{ activeFaqIndex === $index ? 'expand_less' : 'expand_more' }}</mat-icon>
                </button>
                @if (activeFaqIndex === $index) {
                  <p class="px-5 pb-5 text-sm text-slate-600 leading-relaxed">{{ faq.a }}</p>
                }
              </div>
            }
          </div>
        </div>
      </section>

      <!-- Contact -->
      <section id="contact" class="py-16 bg-slate-50 border-b border-slate-200/80 scroll-mt-20">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-10">
            <h2 class="text-3xl font-extrabold tracking-tight">Contact the team</h2>
            <p class="mt-3 text-slate-600">Questions about plans, onboarding, or whether FleetOS fits your fleet? Write to us — we answer within one business day.</p>
          </div>

          @if (messageSent) {
            <div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
              <div class="w-12 h-12 mx-auto rounded-full bg-emerald-600 text-white flex items-center justify-center mb-4">
                <mat-icon>check</mat-icon>
              </div>
              <h3 class="font-bold text-lg text-emerald-900">Message received — thank you, {{ contactName || 'friend' }}.</h3>
              <p class="text-sm text-emerald-800 mt-2">We will reply to {{ contactEmail }} within one business day. Your reference: <strong>{{ sentReference }}</strong></p>
              <button mat-stroked-button color="primary" (click)="resetContactForm()" class="mt-6">Send another message</button>
            </div>
          } @else {
            <form (ngSubmit)="submitContact()" class="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-5">
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Your name</mat-label>
                <input matInput [(ngModel)]="contactName" name="contactName" required placeholder="Jane Rivera" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Work email</mat-label>
                <input matInput type="email" [(ngModel)]="contactEmail" name="contactEmail" required placeholder="jane@yourfleet.com" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Fleet size</mat-label>
                <mat-select [(ngModel)]="contactFleetSize" name="contactFleetSize">
                  <mat-option value="1-5 vehicles">1–5 vehicles</mat-option>
                  <mat-option value="6-20 vehicles">6–20 vehicles</mat-option>
                  <mat-option value="21-50 vehicles">21–50 vehicles</mat-option>
                  <mat-option value="50+ vehicles">50+ vehicles</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>How can we help?</mat-label>
                <textarea matInput rows="4" [(ngModel)]="contactMessage" name="contactMessage" required
                  placeholder="We run 8 wheelchair vans in Denver and need help with Medicaid audit prep..."></textarea>
              </mat-form-field>
              @if (contactError) {
                <p class="text-sm font-semibold text-rose-600">{{ contactError }}</p>
              }
              <button mat-flat-button color="primary" type="submit" class="w-full !py-3 font-bold">Send message</button>
              <p class="text-[11px] text-slate-400 text-center">Demo contact form — messages are saved in this browser only until the backend contact inbox is connected.</p>
            </form>
          }
        </div>
      </section>

      <!-- Trust & legal -->
      <section class="py-16 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center max-w-3xl mx-auto mb-12">
            <h2 class="text-3xl font-extrabold tracking-tight">Trust &amp; Legal</h2>
            <p class="mt-3 text-slate-600">The short version of how FleetOS handles your data and your fleet's obligations.</p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div id="privacy" class="rounded-2xl border border-slate-200 bg-slate-50 p-6 scroll-mt-24">
              <h3 class="font-bold">Privacy Policy</h3>
              <p class="text-sm text-slate-600 leading-relaxed mt-2">FleetOS collects only what operating your fleet requires: workspace details, driver qualification records, and trip logs you create. We never sell fleet or rider data, and we never use it for advertising. Full policy text ships with the backend launch.</p>
            </div>
            <div id="terms" class="rounded-2xl border border-slate-200 bg-slate-50 p-6 scroll-mt-24">
              <h3 class="font-bold">Terms of Service</h3>
              <p class="text-sm text-slate-600 leading-relaxed mt-2">Subscriptions are month-to-month or annual, with a 14-day free trial and no setup fees. You can cancel anytime; your records remain exportable. Operators remain responsible for complying with their state Medicaid and broker contracts.</p>
            </div>
            <div id="hipaa" class="rounded-2xl border border-slate-200 bg-slate-50 p-6 scroll-mt-24">
              <h3 class="font-bold">HIPAA Safeguards</h3>
              <p class="text-sm text-slate-600 leading-relaxed mt-2">Trip records contain protected health information. FleetOS is designed around minimum-necessary access, role-based sign-in, and audit trails, and a Business Associate Agreement (BAA) is available on Growth Pro and Enterprise plans.</p>
            </div>
            <div id="security" class="rounded-2xl border border-slate-200 bg-slate-50 p-6 scroll-mt-24">
              <h3 class="font-bold">Security Statement</h3>
              <p class="text-sm text-slate-600 leading-relaxed mt-2">Accounts are protected by authenticated sign-in with role separation between operators, dispatchers, and drivers. In this frontend preview, data is stored locally in your browser; production hosting adds encryption in transit and at rest, backups, and access logging.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  `
})
export class AboutComponent {
  activeFaqIndex: number | null = 0;

  onboardingSteps = [
    { n: 1, title: 'Create your workspace', text: 'Sign up with your company name, fleet size, and plan. Your workspace is ready in minutes.' },
    { n: 2, title: 'Invite your drivers', text: 'Share the public application link or add drivers directly. Their qualification files build themselves.' },
    { n: 3, title: 'Run your first dispatch', text: 'Create trips, assign vans, and watch the live console track every run in real time.' },
    { n: 4, title: 'Stay audit-ready', text: 'Credentials, DVIRs, and proof of delivery are captured automatically — no binder hunts.' }
  ];

  faqs = [
    {
      q: 'How does the NEMT Driver Onboarding portal protect our company during Medicaid audits?',
      a: 'Medicaid and NEMT brokers require a full 7-year address and employment history, valid MVR release, and signed attestation. Our platform enforces all mandatory fields, captures high-DPI digital signatures, and securely stores the applicant’s W-4 tax document in a downloadable compliance dossier.'
    },
    {
      q: 'How does the Credential & Audit Shield alert system work?',
      a: 'The system continuously monitors your active drivers’ state licenses, CPR/First Aid certifications, and DOT physicals. It flags any document expiring within 30 days and turns expired credentials red so you never accidentally dispatch an uncredentialed driver.'
    },
    {
      q: 'Can we post our public driver application link on Indeed, Craigslist, or Facebook?',
      a: 'Yes! Every operator workspace generates a unique public link (e.g. /apply) that you can copy in one click and include directly in your job postings. Applicants can complete the application on mobile, tablet, or desktop.'
    },
    {
      q: 'Is there a contract or setup fee?',
      a: 'No contracts and no setup fees. All subscriptions come with a 14-day free trial. You can upgrade, downgrade, or cancel your monthly or annual subscription at any time.'
    }
  ];

  // Contact form (frontend-only: stored in localStorage until the backend inbox lands)
  contactName = '';
  contactEmail = '';
  contactFleetSize = '6-20 vehicles';
  contactMessage = '';
  contactError = '';
  messageSent = false;
  sentReference = '';

  constructor(private snackBar: MatSnackBar) {}

  toggleFaq(index: number): void {
    this.activeFaqIndex = this.activeFaqIndex === index ? null : index;
  }

  submitContact(): void {
    if (!this.contactName.trim() || !this.contactEmail.trim() || !this.contactEmail.includes('@') || !this.contactMessage.trim()) {
      this.contactError = 'Please fill in your name, a valid email, and a message.';
      return;
    }
    this.contactError = '';
    this.sentReference = 'MSG-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    try {
      const existing = JSON.parse(localStorage.getItem('nemt_contact_messages') || '[]');
      existing.push({
        reference: this.sentReference,
        name: this.contactName.trim(),
        email: this.contactEmail.trim(),
        fleetSize: this.contactFleetSize,
        message: this.contactMessage.trim(),
        sentAt: new Date().toISOString()
      });
      localStorage.setItem('nemt_contact_messages', JSON.stringify(existing));
    } catch {
      // Storage unavailable: the on-screen confirmation is still shown.
    }
    this.messageSent = true;
    this.snackBar.open('Message sent — we will reply within one business day.', 'Great', { duration: 4000 });
  }

  resetContactForm(): void {
    this.contactName = '';
    this.contactEmail = '';
    this.contactMessage = '';
    this.messageSent = false;
    this.sentReference = '';
  }
}
