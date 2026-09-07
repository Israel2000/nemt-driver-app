import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-marketing-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
  ],
  templateUrl: './marketing-home.component.html',
  styleUrls: ['./marketing-home.component.css']
})
export class MarketingHomeComponent {
  isAnnualBilling = false;
  activeFaqIndex: number | null = 0;

  toggleBilling(annual: boolean): void {
    this.isAnnualBilling = annual;
  }

  toggleFaq(index: number): void {
    this.activeFaqIndex = this.activeFaqIndex === index ? null : index;
  }

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
      a: 'Yes! Every operator workspace generates a unique public link (e.g. /driver) that you can copy in one click and include directly in your job postings. Applicants can complete the application on mobile, tablet, or desktop.'
    },
    {
      q: 'Is there a contract or setup fee?',
      a: 'No contracts and no setup fees. All subscriptions come with a 14-day free trial. You can upgrade, downgrade, or cancel your monthly or annual subscription at any time.'
    }
  ];
}
