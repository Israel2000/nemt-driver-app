import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

/*
 * Contact page — standalone page at /contact. The contact form moved here
 * whole from the About page (same fields, same localStorage save
 * 'nemt_contact_messages', same reference format). No phone/email invented:
 * the form is the contact method. Self-contained real CSS (DM Sans only) —
 * this project has no Tailwind installed, so Tailwind classes do not render.
 */
@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatSnackBarModule
  ],
  template: `
    <div class="contact-page">
      <section class="contact-hero">
        <div class="contact-container contact-center">
          <span class="contact-badge">Contact</span>
          <h1 class="contact-h1">Contact the team</h1>
          <p class="contact-lead">
            Questions about plans, onboarding, or whether FleetOS fits your fleet?
            Write to us — we answer within one business day.
          </p>
        </div>
      </section>

      <section class="contact-section">
        <div class="contact-container-narrow">
          @if (messageSent) {
            <div class="contact-success">
              <div class="contact-success-icon"><mat-icon>check</mat-icon></div>
              <h3 class="contact-h3">Message received — thank you, {{ contactName || 'friend' }}.</h3>
              <p class="contact-body">We will reply to {{ contactEmail }} within one business day. Your reference: <strong>{{ sentReference }}</strong></p>
              <button mat-stroked-button color="primary" (click)="resetContactForm()" class="contact-btn-secondary">Send another message</button>
            </div>
          } @else {
            <form (ngSubmit)="submitContact()" class="contact-form">
              <mat-form-field appearance="outline" class="contact-field">
                <mat-label>Your name</mat-label>
                <input matInput [(ngModel)]="contactName" name="contactName" required placeholder="Jane Rivera" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="contact-field">
                <mat-label>Work email</mat-label>
                <input matInput type="email" [(ngModel)]="contactEmail" name="contactEmail" required placeholder="jane@yourfleet.com" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="contact-field">
                <mat-label>Fleet size</mat-label>
                <mat-select [(ngModel)]="contactFleetSize" name="contactFleetSize">
                  <mat-option value="1-5 vehicles">1–5 vehicles</mat-option>
                  <mat-option value="6-20 vehicles">6–20 vehicles</mat-option>
                  <mat-option value="21-50 vehicles">21–50 vehicles</mat-option>
                  <mat-option value="50+ vehicles">50+ vehicles</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" class="contact-field">
                <mat-label>How can we help?</mat-label>
                <textarea matInput rows="4" [(ngModel)]="contactMessage" name="contactMessage" required
                  placeholder="We run 8 wheelchair vans in Denver and need help with Medicaid audit prep..."></textarea>
              </mat-form-field>
              @if (contactError) {
                <p class="contact-error">{{ contactError }}</p>
              }
              <button mat-flat-button color="primary" type="submit" class="contact-submit">Send message</button>
              <p class="contact-note">Demo contact form — messages are saved in this browser only until the backend contact inbox is connected.</p>
            </form>
          }
          <p class="contact-center contact-back">
            Prefer to look around first? <a routerLink="/pricing" class="contact-link">See pricing</a>
            or <a routerLink="/about" class="contact-link">read about FleetOS</a>.
          </p>
        </div>
      </section>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; font-family: "DM Sans", sans-serif; color: #0f172a; background: #ffffff; }
    :host * { font-family: "DM Sans", sans-serif; box-sizing: border-box; }
    .contact-page { background: #f8fafc; color: #0f172a; min-height: 100vh; }
    .contact-container { max-width: 1120px; margin: 0 auto; padding-left: 16px; padding-right: 16px; }
    .contact-container-narrow { max-width: 768px; margin: 0 auto; padding-left: 16px; padding-right: 16px; }
    .contact-center { text-align: center; }
    .contact-hero { padding: 56px 0 48px; background: #eff6ff; border-bottom: 1px solid #e2e8f0; }
    .contact-badge {
      display: inline-block; padding: 4px 12px; border-radius: 9999px;
      background: #dbeafe; color: #1e40af; font-size: 12px; font-weight: 700;
      letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 16px;
    }
    .contact-h1 { margin: 0; font-size: 36px; line-height: 1.2; font-weight: 800; letter-spacing: -0.02em; color: #0f172a; }
    .contact-lead { max-width: 640px; margin: 16px auto 0; font-size: 17px; line-height: 1.6; color: #475569; }
    .contact-section { padding-top: 64px; padding-bottom: 64px; }
    .contact-form {
      display: flex; flex-direction: column; gap: 20px;
      padding: 24px; border: 1px solid #e2e8f0; border-radius: 24px;
      background: #ffffff; box-shadow: 0 1px 2px rgba(15,23,42,0.05);
    }
    .contact-field { width: 100%; }
    .contact-error { margin: 0; font-size: 14px; font-weight: 600; color: #e11d48; }
    .contact-submit { width: 100%; padding-top: 12px; padding-bottom: 12px; font-weight: 700; }
    .contact-note { margin: 0; font-size: 11px; color: #94a3b8; text-align: center; }
    .contact-success {
      padding: 32px; border: 1px solid #a7f3d0; border-radius: 16px;
      background: #ecfdf5; text-align: center;
    }
    .contact-success-icon {
      width: 48px; height: 48px; margin: 0 auto 16px; border-radius: 9999px;
      background: #059669; color: #ffffff; display: flex; align-items: center; justify-content: center;
    }
    .contact-h3 { margin: 0 0 8px; font-size: 18px; font-weight: 700; color: #064e3b; }
    .contact-body { margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #065f46; }
    .contact-btn-secondary { font-weight: 700; }
    .contact-back { margin-top: 32px; font-size: 15px; color: #475569; }
    .contact-link { font-weight: 700; color: #2563eb; text-decoration: none; }
    .contact-link:hover { color: #1d4ed8; text-decoration: underline; }
    @media (min-width: 640px) {
      .contact-container, .contact-container-narrow { padding-left: 24px; padding-right: 24px; }
      .contact-section { padding-top: 80px; padding-bottom: 80px; }
      .contact-h1 { font-size: 44px; }
      .contact-form { padding: 32px; }
    }
    @media (min-width: 1024px) {
      .contact-container, .contact-container-narrow { padding-left: 32px; padding-right: 32px; }
    }
  `]
})
export class ContactComponent {
  // Contact form (frontend-only: stored in localStorage until the backend inbox lands)
  contactName = '';
  contactEmail = '';
  contactFleetSize = '6-20 vehicles';
  contactMessage = '';
  contactError = '';
  messageSent = false;
  sentReference = '';

  constructor(private snackBar: MatSnackBar) {}

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
