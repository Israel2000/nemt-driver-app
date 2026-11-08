import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

/*
 * About page — self-contained real CSS (DM Sans only).
 * This project has no Tailwind installed, so Tailwind utility classes
 * (grid-cols-1, lg:grid-cols-2, sm:px-6, etc.) do NOT render. Every class
 * used in the template below is defined in the styles array, with real
 * media queries. Contact lives on its own page now (/contact).
 */
@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  template: `
    <div class="about-page">

      <!-- Page header -->
      <section class="about-hero">
        <div class="about-container about-center">
          <span class="about-badge">Our Mission</span>
          <h1 class="about-h1">Built for the fleets Medicaid depends on.</h1>
          <p class="about-lead">
            FleetOS was engineered specifically for 5–25 vehicle NEMT operators who live and die by clean trip documentation. We replaced paper logs and clunky desktop software with a lightning-fast browser command system.
          </p>
        </div>
      </section>


      <!-- Core Pillars (Israel's design) -->
      <section class="about-section about-section-white">
        <div class="about-container">
          <div class="about-pillars-grid">
            <div class="fleet-card about-pillar-card">
              <div class="about-pillar-title">Compliance First</div>
              <p class="about-small">GPS, timestamps, and signatures captured automatically so audit binders build themselves.</p>
            </div>
            <div class="fleet-card about-pillar-card">
              <div class="about-pillar-title">Zero Hardware</div>
              <p class="about-small">Runs entirely in standard web browsers across desktop, tablets, and phones.</p>
            </div>
            <div class="fleet-card about-pillar-card">
              <div class="about-pillar-title">Driver Friendly</div>
              <p class="about-small">Large touch targets and intuitive one-tap steps built for drivers on the road.</p>
            </div>
            <div class="fleet-card about-pillar-card">
              <div class="about-pillar-title">Instant Sync</div>
              <p class="about-small">A driver tap updates dispatch in real time, keeping your whole operation synchronized.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Story + values -->
      <section class="about-section about-section-white">
        <div class="about-container about-story-grid">
          <div>
            <h2 class="about-h2">Why we built this</h2>
            <p class="about-body">
              A single missing signature can get a whole month of trips denied. A single expired CPR card can
              put a driver on the road illegally — and put the whole company at risk in a Medicaid audit.
              We watched small operators track all of that on clipboards, spreadsheets, and memory, and
              decided the paperwork should defend the fleet instead of threatening it.
            </p>
            <p class="about-body">
              So FleetOS puts the dispatcher, the driver, and the auditor on the same record: live dispatch
              on desktop, a driver web app that opens in any phone browser, and a credential shield that
              blocks an illegal dispatch before it happens.
            </p>
            <div class="about-cta-row">
              <a routerLink="/features" class="about-btn about-btn-primary">See what it does</a>
              <a routerLink="/pricing" class="about-btn about-btn-secondary">See pricing</a>
            </div>
          </div>

          <div class="about-values">
            <div class="about-value-card">
              <h3 class="about-h3">🛡️ Audit-first, not audit-after</h3>
              <p class="about-small">Every trip captures the proof an auditor will ask for — signatures, odometer, GPS times — while it happens, not after.</p>
            </div>
            <div class="about-value-card">
              <h3 class="about-h3">📱 No installs, no hardware</h3>
              <p class="about-small">Drivers open the web app in the phone they already have. Dispatchers open the console in the browser they already use.</p>
            </div>
            <div class="about-value-card">
              <h3 class="about-h3">⏱️ Five minutes to onboard</h3>
              <p class="about-small">Create a workspace, invite drivers, and run your first dispatched trip the same day. No setup fees, no contracts.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- How onboarding works -->
      <section class="about-section about-section-grey">
        <div class="about-container">
          <div class="about-center about-section-head">
            <h2 class="about-h2">How onboarding works</h2>
            <p class="about-body">From sign-up to your first audited trip in four steps.</p>
          </div>
          <div class="about-steps-grid">
            @for (step of onboardingSteps; track step.n) {
              <div class="about-step-card">
                <div class="about-step-num">{{ step.n }}</div>
                <h3 class="about-h3 about-h3-sm">{{ step.title }}</h3>
                <p class="about-small">{{ step.text }}</p>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- FAQ -->
      <section id="faq" class="about-section about-section-white">
        <div class="about-container-narrow">
          <div class="about-center about-section-head">
            <h2 class="about-h2">Frequently Asked Questions</h2>
          </div>
          <div class="about-faq-list">
            @for (faq of faqs; track $index) {
              <div class="about-faq-item">
                <button type="button" (click)="toggleFaq($index)" class="about-faq-btn">
                  <span>{{ faq.q }}</span>
                  <mat-icon class="about-faq-icon">{{ activeFaqIndex === $index ? 'expand_less' : 'expand_more' }}</mat-icon>
                </button>
                @if (activeFaqIndex === $index) {
                  <p class="about-faq-answer">{{ faq.a }}</p>
                }
              </div>
            }
          </div>
          <p class="about-center about-contact-link">
            Still have a question? <a routerLink="/contact" class="about-link">Contact the team &rarr;</a>
          </p>
        </div>
      </section>

      <!-- Trust & legal -->
      <section class="about-section about-section-white">
        <div class="about-container">
          <div class="about-center about-section-head">
            <h2 class="about-h2">Trust &amp; Legal</h2>
            <p class="about-body">The short version of how FleetOS handles your data and your fleet's obligations.</p>
          </div>
          <div class="about-legal-grid">
            <div id="privacy" class="about-legal-card">
              <h3 class="about-h3">Privacy Policy</h3>
              <p class="about-small">FleetOS collects only what operating your fleet requires: workspace details, driver qualification records, and trip logs you create. We never sell fleet or rider data, and we never use it for advertising. Full policy text ships with the backend launch.</p>
            </div>
            <div id="terms" class="about-legal-card">
              <h3 class="about-h3">Terms of Service</h3>
              <p class="about-small">Subscriptions are month-to-month or annual, with a 14-day free trial and no setup fees. You can cancel anytime; your records remain exportable. Operators remain responsible for complying with their state Medicaid and broker contracts.</p>
            </div>
            <div id="hipaa" class="about-legal-card">
              <h3 class="about-h3">HIPAA Safeguards</h3>
              <p class="about-small">Trip records contain protected health information. FleetOS is designed around minimum-necessary access, role-based sign-in, and audit trails, and a Business Associate Agreement (BAA) is available on Growth Pro and Enterprise plans.</p>
            </div>
            <div id="security" class="about-legal-card">
              <h3 class="about-h3">Security Statement</h3>
              <p class="about-small">Accounts are protected by authenticated sign-in with role separation between operators, dispatchers, and drivers. In this frontend preview, data is stored locally in your browser; production hosting adds encryption in transit and at rest, backups, and access logging.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; font-family: "DM Sans", sans-serif; color: #0f172a; background: #ffffff; }
    :host * { font-family: "DM Sans", sans-serif; box-sizing: border-box; }
    .about-page { background: #f8fafc; color: #0f172a; min-height: 100vh; }
    .about-container { max-width: 1120px; margin: 0 auto; padding-left: 16px; padding-right: 16px; }
    .about-container-narrow { max-width: 768px; margin: 0 auto; padding-left: 16px; padding-right: 16px; }
    .about-center { text-align: center; }
    .about-section { padding-top: 64px; padding-bottom: 64px; border-bottom: 1px solid #e2e8f0; }
    .about-section-white { background: #ffffff; }
    .about-section-grey { background: #f8fafc; }
    .about-section-head { margin-bottom: 40px; }
    .about-badge {
      display: inline-block; padding: 4px 12px; border-radius: 9999px;
      background: #e0e7ff; color: #3730a3; font-size: 12px; font-weight: 700;
      letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 16px;
    }
    .about-hero { padding: 56px 0 48px; background: #eff6ff; border-bottom: 1px solid #e2e8f0; }
    .about-h1 {
      max-width: 768px; margin: 0 auto; font-size: 36px; line-height: 1.2;
      font-weight: 800; letter-spacing: -0.02em; color: #0f172a;
    }
    .about-lead {
      max-width: 640px; margin: 16px auto 0; font-size: 17px; line-height: 1.6;
      font-weight: 400; color: #475569;
    }
    .about-h2 { margin: 0 0 12px; font-size: 28px; line-height: 1.25; font-weight: 800; letter-spacing: -0.02em; color: #0f172a; }
    .about-h3 { margin: 0 0 4px; font-size: 16px; line-height: 1.4; font-weight: 700; color: #0f172a; }
    .about-h3-sm { font-size: 15px; }
    .about-body { margin: 16px 0 0; font-size: 16px; line-height: 1.65; font-weight: 400; color: #475569; }
    .about-body:first-of-type { margin-top: 0; }
    .about-small { margin: 4px 0 0; font-size: 14px; line-height: 1.6; font-weight: 400; color: #475569; }
    .about-link { font-size: 15px; font-weight: 700; color: #2563eb; text-decoration: none; }
    .about-link:hover { color: #1d4ed8; text-decoration: underline; }
    .about-contact-link { margin-top: 32px; font-size: 15px; color: #475569; }
    .about-cta-row { display: flex; flex-direction: column; gap: 12px; margin-top: 32px; }
    .about-btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      padding: 14px 24px; border-radius: 12px; font-size: 14px; font-weight: 700;
      text-decoration: none; cursor: pointer; border: 1px solid transparent;
    }
    .about-btn-primary { background: #2563eb; color: #ffffff; box-shadow: 0 4px 12px rgba(37,99,235,0.3); }
    .about-btn-primary:hover { background: #1d4ed8; }
    .about-btn-secondary { background: #ffffff; color: #0f172a; border-color: #cbd5e1; box-shadow: 0 1px 2px rgba(15,23,42,0.08); }
    .about-btn-secondary:hover { background: #f8fafc; }
    .about-story-grid { display: grid; grid-template-columns: 1fr; gap: 40px; align-items: start; }
    .about-values { display: flex; flex-direction: column; gap: 16px; }
    .about-value-card { padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background: #f8fafc; }
    .about-steps-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
    .about-step-card { padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff; box-shadow: 0 1px 2px rgba(15,23,42,0.05); }
    .about-step-num {
      display: inline-flex; align-items: center; justify-content: center;
      width: 36px; height: 36px; border-radius: 9999px; background: #2563eb;
      color: #ffffff; font-size: 14px; font-weight: 800; margin-bottom: 12px;
    }
    .about-faq-list { display: flex; flex-direction: column; gap: 12px; }
    .about-faq-item { border: 1px solid #e2e8f0; border-radius: 16px; background: #f8fafc; overflow: hidden; }
    .about-faq-btn {
      width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 16px;
      padding: 16px 20px; background: none; border: none; cursor: pointer;
      font-family: "DM Sans", sans-serif; font-size: 14px; font-weight: 700; color: #0f172a; text-align: left;
    }
    .about-faq-btn:hover { background: #f1f5f9; }
    .about-faq-icon { flex-shrink: 0; color: #64748b; }
    .about-faq-answer { margin: 0; padding: 0 20px 20px; font-size: 14px; line-height: 1.6; color: #475569; }
    .about-legal-grid { display: grid; grid-template-columns: 1fr; gap: 24px; }
    .about-legal-card { padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background: #f8fafc; scroll-margin-top: 96px; }
    @media (min-width: 640px) {
      .about-container, .about-container-narrow { padding-left: 24px; padding-right: 24px; }
      .about-section { padding-top: 80px; padding-bottom: 80px; }
      .about-h1 { font-size: 44px; }
      .about-h2 { font-size: 32px; }
      .about-cta-row { flex-direction: row; }
      .about-steps-grid { grid-template-columns: 1fr 1fr; }
      .about-pillars-grid { grid-template-columns: 1fr 1fr; }
    }
    /* Core Pillars grid (Israel's design): 1 col phones, 2 cols tablets, 4 cols desktop */
    .about-pillars-grid { display: grid; grid-template-columns: 1fr; gap: 24px; }
    .about-pillar-card { padding: 24px; border-radius: 16px; background: #ffffff; }
    .about-pillar-card.fleet-card {
      background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
      border: 1px solid rgba(226, 232, 240, 0.8);
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .about-pillar-card.fleet-card:hover {
      transform: translateY(-4px);
      border-color: rgba(37, 99, 235, 0.3);
      box-shadow: 0 20px 40px -15px rgba(37, 99, 235, 0.12);
    }
    .about-pillar-title { font-size: 18px; line-height: 1.4; font-weight: 700; color: #2563eb; margin-bottom: 8px; }
    @media (min-width: 1024px) {
      .about-container, .about-container-narrow { padding-left: 32px; padding-right: 32px; }
      .about-h1 { font-size: 48px; }
      .about-story-grid { grid-template-columns: 1fr 1fr; gap: 48px; }
      .about-steps-grid { grid-template-columns: repeat(4, 1fr); }
      .about-pillars-grid { grid-template-columns: repeat(4, 1fr); }
      .about-legal-grid { grid-template-columns: 1fr 1fr; }
    }
  `]
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

  toggleFaq(index: number): void {
    this.activeFaqIndex = this.activeFaqIndex === index ? null : index;
  }
}
