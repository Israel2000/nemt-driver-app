import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

interface Plan {
  name: string;
  tagline: string;
  monthly: number;
  blurb: string;
  features: string[];
  featured?: boolean;
  cta: string;
}

/*
 * Pricing page — self-contained real CSS (DM Sans only).
 * This project has no Tailwind installed, so the old `grid grid-cols-1
 * lg:grid-cols-3` never rendered and the 3 plan cards always stacked.
 * The plans grid below is real CSS: 3 columns from 768px up (featured
 * card raised), 1 column only on phones. Prices unchanged.
 */
@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="pricing-page">

      <section class="pricing-hero">
        <div class="pricing-container pricing-center">
          <span class="pricing-badge">Transparent Fleet Plans</span>
          <h1 class="pricing-h1">Predictable, Scalable Pricing for Fleets of Any Size</h1>
          <p class="pricing-lead">No setup fees. No multi-month contracts. Cancel anytime.</p>

          <!-- Monthly / Annual toggle (annual = 20% off, billed annually) -->
          <div class="pricing-toggle">
            <button type="button" (click)="isAnnualBilling = false"
              class="pricing-toggle-btn" [class.pricing-toggle-active]="!isAnnualBilling">Monthly</button>
            <button type="button" (click)="isAnnualBilling = true"
              class="pricing-toggle-btn pricing-toggle-annual" [class.pricing-toggle-active]="isAnnualBilling">Annual
              <span class="pricing-save">SAVE 20%</span>
            </button>
          </div>
          @if (isAnnualBilling) {
            <p class="pricing-annual-note">Annual billing: two months free on every plan — charged once a year.</p>
          }
        </div>
      </section>

      <section class="pricing-section">
        <div class="pricing-container">
          <div class="pricing-plans">

            @for (plan of plans; track plan.name) {
              <div class="pricing-plan" [class.pricing-plan-featured]="plan.featured" [class.fleet-card]="!plan.featured" [class.fleet-card-dark]="plan.featured">
                @if (plan.featured) {
                  <div class="pricing-flag">Most Popular</div>
                }
                <div class="pricing-plan-body">
                  <div>
                    <span class="pricing-plan-name" [class.pricing-plan-name-featured]="plan.featured">{{ plan.name }}</span>
                    <div class="pricing-price-row">
                      <span class="pricing-price">{{ priceFor(plan) | currency:'USD':'symbol':'1.0-0' }}</span>
                      <span class="pricing-per">/month</span>
                    </div>
                    @if (isAnnualBilling) {
                      <p class="pricing-annual-line">
                        {{ annualTotal(plan) | currency:'USD':'symbol':'1.0-0' }} billed annually — you save {{ (plan.monthly * 12 - annualTotal(plan)) | currency:'USD':'symbol':'1.0-0' }}/yr
                      </p>
                    }
                    <p class="pricing-blurb">{{ plan.blurb }}</p>
                  </div>

                  <div class="pricing-features">
                    @for (f of plan.features; track f) {
                      <div class="pricing-feature">
                        <span class="pricing-check">✓</span> {{ f }}
                      </div>
                    }
                  </div>
                </div>

                <div class="pricing-plan-cta">
                  <a routerLink="/admin/signup" class="pricing-cta" [class.pricing-cta-featured]="plan.featured">
                    {{ plan.cta }}
                  </a>
                </div>
              </div>
            }

          </div>

          <!-- Trial banner -->
          <div class="pricing-trial">
            <div class="pricing-trial-inner">
              <span class="pricing-trial-badge">Zero Risk Onboarding</span>
              <h2 class="pricing-trial-h2">Ready to deploy your dispatch console and driver web app?</h2>
              <p class="pricing-trial-text">
                Join fleets across Colorado and nationwide operating with 100% audit confidence. 14-day zero-risk trial.
              </p>
              <div class="pricing-trial-points">
                <span><span class="pricing-tick">✓</span> 14-Day Free Trial</span>
                <span><span class="pricing-tick">✓</span> No Credit Card Required</span>
                <span><span class="pricing-tick">✓</span> Cancel Anytime</span>
              </div>
              <div class="pricing-trial-cta">
                <a routerLink="/admin/signup" class="pricing-trial-btn">
                  <span>Start Free Fleet Trial</span>
                  <span aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </div>
          </div>

          <p class="pricing-center pricing-talk">
            Questions about which plan fits your fleet? <a routerLink="/contact" class="pricing-link">Talk to the team →</a>
          </p>
        </div>
      </section>

    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; font-family: "DM Sans", sans-serif; color: #0f172a; background: #ffffff; }
    :host * { font-family: "DM Sans", sans-serif; box-sizing: border-box; }
    .pricing-page { background: #f8fafc; color: #0f172a; min-height: 100vh; }
    .pricing-container { max-width: 1120px; margin: 0 auto; padding-left: 16px; padding-right: 16px; }
    .pricing-center { text-align: center; }
    .pricing-hero { padding: 56px 0 48px; background: #eff6ff; border-bottom: 1px solid #e2e8f0; }
    .pricing-badge {
      display: inline-block; padding: 4px 12px; border-radius: 9999px;
      background: #dbeafe; color: #1e40af; font-size: 12px; font-weight: 700;
      letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 16px;
    }
    .pricing-h1 {
      max-width: 768px; margin: 0 auto; font-size: 36px; line-height: 1.2;
      font-weight: 800; letter-spacing: -0.02em; color: #0f172a;
    }
    .pricing-lead { max-width: 640px; margin: 16px auto 0; font-size: 17px; line-height: 1.6; color: #475569; }
    .pricing-toggle {
      display: inline-flex; align-items: center; margin-top: 32px; padding: 4px;
      border: 1px solid #e2e8f0; border-radius: 9999px; background: #ffffff;
      box-shadow: 0 1px 2px rgba(15,23,42,0.05);
    }
    .pricing-toggle-btn {
      padding: 8px 20px; border: none; border-radius: 9999px; background: none;
      font-family: "DM Sans", sans-serif; font-size: 14px; font-weight: 700;
      color: #475569; cursor: pointer;
    }
    .pricing-toggle-active { background: #2563eb; color: #ffffff; }
    .pricing-toggle-annual { display: inline-flex; align-items: center; gap: 6px; }
    .pricing-save {
      padding: 2px 6px; border-radius: 9999px; background: #ecfdf5;
      color: #047857; font-size: 10px; font-weight: 800;
    }
    .pricing-toggle-active .pricing-save { background: #d1fae5; color: #065f46; }
    .pricing-annual-note { margin: 12px 0 0; font-size: 12px; font-weight: 600; color: #047857; }
    .pricing-section { padding-top: 64px; padding-bottom: 64px; }
    /* Plans: 1 column on phones, 3 side-by-side from 768px up. */
    .pricing-plans {
      display: grid; grid-template-columns: 1fr; gap: 24px;
      max-width: 1024px; margin: 0 auto 64px;
    }
    .pricing-plan {
      position: relative; display: flex; flex-direction: column; justify-content: space-between;
      padding: 32px; border: 1px solid #e2e8f0; border-radius: 24px;
      background: #ffffff; box-shadow: 0 1px 2px rgba(15,23,42,0.05);
    }
    .pricing-plan:hover { box-shadow: 0 8px 24px rgba(15,23,42,0.1); }
    .pricing-plan-featured {
      border: 2px solid #2563eb;
      box-shadow: 0 8px 24px rgba(37,99,235,0.15);
    }
    /* FleetOS card look (from src/styles.css): component-encapsulated plan
       rules would otherwise override the global .fleet-card background/border,
       so re-assert Israel's values here with the combined selectors. */
    .pricing-plan.fleet-card {
      background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
      border: 1px solid rgba(226, 232, 240, 0.8);
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .pricing-plan.fleet-card:hover {
      transform: translateY(-4px);
      border-color: rgba(37, 99, 235, 0.3);
      box-shadow: 0 20px 40px -15px rgba(37, 99, 235, 0.12);
    }
    .pricing-plan.fleet-card-dark {
      background: linear-gradient(145deg, #0f172a 0%, #020617 100%);
      border: 2px solid #2563eb;
      box-shadow: 0 25px 50px -12px rgba(37, 99, 235, 0.25);
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      color: #f1f5f9;
    }
    /* Dark card: light text so price/features stay readable on navy. */
    .pricing-plan.fleet-card-dark .pricing-price { color: #ffffff; }
    .pricing-plan.fleet-card-dark .pricing-per { color: #94a3b8; }
    .pricing-plan.fleet-card-dark .pricing-blurb { color: #cbd5e1; }
    .pricing-plan.fleet-card-dark .pricing-features { color: #e2e8f0; border-top-color: rgba(148, 163, 184, 0.2); }
    .pricing-plan.fleet-card-dark .pricing-plan-name-featured { color: #93c5fd; }
    .pricing-plan.fleet-card-dark .pricing-annual-line { color: #6ee7b7; }
    .pricing-plan.fleet-card-dark .pricing-check { color: #60a5fa; }
    /* Featured card sits raised (-8px at >=768px); hover lifts it further
       instead of dropping it to the snippet's flat -4px. */
    .pricing-plan.fleet-card-dark:hover { transform: translateY(-12px); }
    .pricing-flag {
      position: absolute; top: -14px; left: 50%; transform: translateX(-50%);
      padding: 4px 16px; border-radius: 9999px; background: #2563eb; color: #ffffff;
      font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
      white-space: nowrap; box-shadow: 0 1px 2px rgba(15,23,42,0.1);
    }
    .pricing-plan-body { display: flex; flex-direction: column; gap: 24px; }
    .pricing-plan-name { font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #64748b; }
    .pricing-plan-name-featured { color: #2563eb; }
    .pricing-price-row { display: flex; align-items: baseline; gap: 4px; margin-top: 8px; }
    .pricing-price { font-size: 40px; line-height: 1.1; font-weight: 800; letter-spacing: -0.02em; color: #0f172a; }
    .pricing-per { font-size: 14px; font-weight: 600; color: #64748b; }
    .pricing-annual-line { margin: 4px 0 0; font-size: 12px; font-weight: 600; color: #047857; }
    .pricing-blurb { margin: 8px 0 0; font-size: 12px; line-height: 1.6; color: #64748b; }
    .pricing-features {
      display: flex; flex-direction: column; gap: 12px;
      padding-top: 24px; border-top: 1px solid #f1f5f9;
      font-size: 14px; line-height: 1.5; color: #334155;
    }
    .pricing-feature { display: flex; align-items: flex-start; gap: 10px; }
    .pricing-check { color: #2563eb; font-weight: 700; flex-shrink: 0; }
    .pricing-plan-cta { padding-top: 32px; }
    .pricing-cta {
      display: block; width: 100%; padding: 14px 16px; border-radius: 12px;
      background: #0f172a; color: #ffffff; font-size: 12px; font-weight: 700;
      letter-spacing: 0.08em; text-transform: uppercase; text-align: center;
      text-decoration: none; box-shadow: 0 1px 2px rgba(15,23,42,0.1);
    }
    .pricing-cta:hover { background: #1e293b; }
    .pricing-cta-featured { background: #2563eb; box-shadow: 0 4px 12px rgba(37,99,235,0.3); }
    .pricing-cta-featured:hover { background: #1d4ed8; }
    .pricing-trial {
      max-width: 880px; margin: 0 auto; padding: 48px 32px; border-radius: 24px;
      background: #0f172a; color: #ffffff; text-align: center;
      box-shadow: 0 20px 48px rgba(15,23,42,0.25);
    }
    .pricing-trial-inner { max-width: 640px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; align-items: center; }
    .pricing-trial-badge {
      padding: 4px 14px; border: 1px solid rgba(96,165,250,0.4); border-radius: 9999px;
      background: rgba(37,99,235,0.2); color: #93c5fd; font-size: 12px; font-weight: 700;
      letter-spacing: 0.08em; text-transform: uppercase;
    }
    .pricing-trial-h2 { margin: 0; font-size: 26px; line-height: 1.3; font-weight: 800; letter-spacing: -0.02em; color: #ffffff; }
    .pricing-trial-text { margin: 0; font-size: 15px; line-height: 1.6; color: #cbd5e1; }
    .pricing-trial-points {
      display: flex; align-items: center; justify-content: center; flex-wrap: wrap;
      gap: 8px 24px; font-size: 14px; font-weight: 600; color: #cbd5e1;
    }
    .pricing-tick { color: #34d399; font-weight: 700; }
    .pricing-trial-cta { padding-top: 8px; }
    .pricing-trial-btn {
      display: inline-flex; align-items: center; gap: 10px; padding: 16px 32px;
      border-radius: 12px; background: #2563eb; color: #ffffff;
      font-size: 16px; font-weight: 800; text-decoration: none;
      box-shadow: 0 8px 24px rgba(37,99,235,0.4);
    }
    .pricing-trial-btn:hover { background: #3b82f6; }
    .pricing-talk { margin-top: 32px; font-size: 12px; color: #64748b; }
    .pricing-link { font-weight: 700; color: #2563eb; text-decoration: none; }
    .pricing-link:hover { color: #1d4ed8; text-decoration: underline; }
    @media (min-width: 640px) {
      .pricing-container { padding-left: 24px; padding-right: 24px; }
      .pricing-section { padding-top: 80px; padding-bottom: 80px; }
      .pricing-h1 { font-size: 44px; }
      .pricing-trial-h2 { font-size: 30px; }
    }
    @media (min-width: 768px) {
      .pricing-plans { grid-template-columns: repeat(3, 1fr); align-items: stretch; }
      .pricing-plan-featured { transform: translateY(-8px); }
    }
    @media (min-width: 1024px) {
      .pricing-container { padding-left: 32px; padding-right: 32px; }
      .pricing-h1 { font-size: 48px; }
    }
  `]
})
export class PricingComponent {
  isAnnualBilling = false;

  plans: Plan[] = [
    {
      name: 'Starter Fleet',
      tagline: 'starter',
      monthly: 49,
      blurb: 'For independent operators and startup medical transit fleets.',
      features: [
        'Up to 5 vehicles & drivers',
        'Live dispatch & driver web app',
        'Odometer & signature capture',
        'Turn-by-turn map navigation',
        'Standard email support'
      ],
      cta: 'Start Free Trial'
    },
    {
      name: 'Growth Pro',
      tagline: 'growth',
      monthly: 99,
      blurb: 'The standard operating system for growing Medicaid providers.',
      featured: true,
      features: [
        'Up to 15 vehicles & drivers',
        'Everything in Starter +',
        '1-Click Medicaid Audit Dossier PDF Export',
        'Automated CPR & DOT expiration alerts',
        'Daily vehicle DVIR safety logs',
        'Priority chat & email support'
      ],
      cta: 'Start Free Trial'
    },
    {
      name: 'Enterprise',
      tagline: 'enterprise',
      monthly: 199,
      blurb: 'High-volume fleet control, multi-terminal dispatch, and dedicated SLAs.',
      features: [
        'Up to 35 vehicles (expandable)',
        'Priority live phone dispatch support',
        'Broker integration (MediDrive, Modivcare, MTM)',
        'Custom audit export & billing feeds',
        'Dedicated Compliance Account Manager'
      ],
      cta: 'Contact Sales'
    }
  ];

  /** Monthly-equivalent price shown on the card (annual = 20% off). */
  priceFor(plan: Plan): number {
    return this.isAnnualBilling ? Math.round(plan.monthly * 0.8) : plan.monthly;
  }

  /** Total charged once a year on annual billing. */
  annualTotal(plan: Plan): number {
    return this.priceFor(plan) * 12;
  }
}
