import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface HomeSlide {
  eyebrow: string;
  title: string;
  caption: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {
  /** Small hero slider — mock UI from the app itself, no stock photos/video. */
  readonly slides: HomeSlide[] = [
    {
      eyebrow: 'Dispatch console',
      title: 'Live map, live trips',
      caption: 'Dispatch sees every vehicle and trip status the moment a driver taps it.'
    },
    {
      eyebrow: 'Driver web app',
      title: 'One tap per step',
      caption: 'En Route → Arrived → Boarded → Complete, in the phone browser — nothing to install.'
    },
    {
      eyebrow: 'Audit proof bundle',
      title: 'Signed, stamped, billable',
      caption: 'GPS, timestamps, odometer and both signatures on every completed trip.'
    }
  ];

  currentSlide = 0;
  sliderPaused = false;
  private sliderTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.startSlider();
  }

  ngOnDestroy(): void {
    this.stopSlider();
  }

  startSlider(): void {
    this.stopSlider();
    this.sliderTimer = setInterval(() => {
      if (!this.sliderPaused) {
        this.nextSlide();
      }
    }, 5000);
  }

  stopSlider(): void {
    if (this.sliderTimer) {
      clearInterval(this.sliderTimer);
      this.sliderTimer = null;
    }
  }

  nextSlide(): void {
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
  }

  prevSlide(): void {
    this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
  }

  pauseSlider(): void {
    this.sliderPaused = true;
  }

  resumeSlider(): void {
    this.sliderPaused = false;
  }
}
