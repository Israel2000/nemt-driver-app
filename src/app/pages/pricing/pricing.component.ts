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

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-500 selection:text-white">

      <section class="pt-14 pb-12 bg-gradient-to-b from-blue-50/70 via-white to-slate-50 border-b border-slate-200/70">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider mb-4">
            Transparent Fleet Plans
          </div>
          <h1 class="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight max-w-3xl mx-auto">
            Predictable, Scalable Pricing for Fleets of Any Size
          </h1>
          <p class="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            No setup fees. No multi-month contracts. Cancel anytime.
          </p>

          <!-- Monthly / Annual toggle (annual = 20% off, billed annually) -->
          <div class="mt-8 inline-flex items-center rounded-full bg-white border border-slate-200 shadow-sm p-1">
            <button type="button" (click)="isAnnualBilling = false"
              class="px-5 py-2 rounded-full text-sm font-bold transition"
              [class.bg-blue-600]="!isAnnualBilling" [class.text-white]="!isAnnualBilling"
              [class.text-slate-600]="isAnnualBilling">Monthly</button>
            <button type="button" (click)="isAnnualBilling = true"
              class="px-5 py-2 rounded-full text-sm font-bold transition flex items-center gap-1.5"
              [class.bg-blue-600]="isAnnualBilling" [class.text-white]="isAnnualBilling"
              [class.text-slate-600]="!isAnnualBilling">Annual
              <span class="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full"
                [class.bg-emerald-100]="isAnnualBilling" [class.text-emerald-700]="isAnnualBilling"
                [class.bg-emerald-50]="!isAnnualBilling" [class.text-emerald-600]="!isAnnualBilling">SAVE 20%</span>
            </button>
          </div>
          @if (isAnnualBilling) {
            <p class="mt-3 text-xs font-semibold text-emerald-700">Annual billing: two months free on every plan — charged once a year.</p>
          }
        </div>
      </section>

      <section class="py-16 bg-slate-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto mb-16">

            @for (plan of plans; track plan.name) {
              <div class="rounded-3xl p-8 border shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                [class.bg-white]="!plan.featured" [class.border-slate-200]="!plan.featured"
                [class.border-2]="plan.featured" [class.border-blue-600]="plan.featured"
                [class.shadow-xl]="plan.featured" [class.relative]="plan.featured" [class.lg:-translate-y-2]="plan.featured">
                @if (plan.featured) {
                  <div class="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-blue-600 text-white font-bold text-[11px] uppercase tracking-wider shadow-sm">
                    Most Popular
                  </div>
                }
                <div class="space-y-6">
                  <div>
                    <span class="text-xs font-bold uppercase tracking-widest"
                      [class.text-blue-600]="plan.featured" [class.text-slate-500]="!plan.featured">{{ plan.name }}</span>
                    <div class="flex items-baseline gap-1 mt-2">
                      <span class="text-4xl font-black text-slate-900">{{ priceFor(plan) | currency:'USD':'symbol':'1.0-0' }}</span>
                      <span class="text-slate-500 font-semibold text-sm">/month</span>
                    </div>
                    @if (isAnnualBilling) {
                      <p class="text-xs text-emerald-700 font-semibold mt-1">
                        {{ annualTotal(plan) | currency:'USD':'symbol':'1.0-0' }} billed annually — you save {{ (plan.monthly * 12 - annualTotal(plan)) | currency:'USD':'symbol':'1.0-0' }}/yr
                      </p>
                    }
                    <p class="text-xs text-slate-500 mt-2">{{ plan.blurb }}</p>
                  </div>

                  <div class="space-y-3 border-t border-slate-100 pt-6 text-xs sm:text-sm text-slate-700">
                    @for (f of plan.features; track f) {
                      <div class="flex items-center gap-2.5">
                        <span class="text-blue-600 font-bold">✓</span> {{ f }}
                      </div>
                    }
                  </div>
                </div>

                <div class="pt-8">
                  <a routerLink="/admin/signup"
                     class="w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-center block shadow-sm transition"
                     [class.bg-blue-600]="plan.featured" [class.hover:bg-blue-700]="plan.featured"
                     [class.text-white]="plan.featured" [class.shadow-lg]="plan.featured"
                     [class.bg-slate-900]="!plan.featured" [class.hover:bg-slate-800]="!plan.featured"
                     [class.text-white]="!plan.featured">
                    {{ plan.cta }}
                  </a>
                </div>
              </div>
            }

          </div>

          <!-- Trial banner -->
          <div class="rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-950 text-white p-8 sm:p-12 shadow-2xl border border-slate-800 text-center relative overflow-hidden max-w-5xl mx-auto">
            <div class="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <div class="relative z-10 max-w-3xl mx-auto space-y-6">
              <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
                Zero Risk Onboarding
              </div>
              <h2 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Ready to deploy your dispatch console and driver web app?
              </h2>
              <p class="text-sm sm:text-base text-slate-300">
                Join fleets across Colorado and nationwide operating with 100% audit confidence. 14-day zero-risk trial.
              </p>
              <div class="flex items-center justify-center gap-6 text-xs sm:text-sm text-slate-300 flex-wrap pt-2">
                <span class="flex items-center gap-1.5"><span class="text-emerald-400 font-bold">✓</span> 14-Day Free Trial</span>
                <span class="flex items-center gap-1.5"><span class="text-emerald-400 font-bold">✓</span> No Credit Card Required</span>
                <span class="flex items-center gap-1.5"><span class="text-emerald-400 font-bold">✓</span> Cancel Anytime</span>
              </div>
              <div class="pt-4">
                <a routerLink="/admin/signup"
                   class="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-base shadow-xl shadow-blue-600/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer">
                  <span>Start Free Fleet Trial</span>
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <p class="text-center text-xs text-slate-500 mt-8">
            Questions about which plan fits your fleet? <a routerLink="/about" class="font-bold text-blue-600 hover:underline">Talk to the team →</a>
          </p>
        </div>
      </section>

    </div>
  `
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
