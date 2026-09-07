import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';

import { ComplianceService } from '../../services/compliance.service';
import { VehicleComplianceRecord, DVIRChecklist } from '../../models/compliance.model';

@Component({
  selector: 'app-driver-dvir',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatRadioModule,
    MatSnackBarModule,
    MatDividerModule
  ],
  templateUrl: './driver-dvir.component.html',
  styleUrls: ['./driver-dvir.component.css']
})
export class DriverDvirComponent implements OnInit, AfterViewInit {
  @ViewChild('signatureCanvas') signatureCanvasRef!: ElementRef<HTMLCanvasElement>;

  vehicles: VehicleComplianceRecord[] = [];
  selectedUnitNumber = 'VAN-101';
  inspectionType: 'pre_trip' | 'post_trip' = 'pre_trip';

  driverName = 'Marcus Vance';
  driverId = 'DRV-101';
  odometer: number = 42350;

  // Inspection Checklist Booleans (default to true for quick pre-trip flow)
  brakesServiceAndParking = true;
  tiresTreadAndPressure = true;
  lightsHeadBrakeTurnHazard = true;
  hornAndWipers = true;
  mirrorsAndWindshield = true;
  wheelchairLiftDeploymentCycle = true;
  wheelchairLiftManualBackupPump = true;
  qStraintTieDownsAndLapBelts = true;
  fireExtinguisherCharged = true;
  firstAidAndBbpSpillKitStocked = true;
  cleanlinessAndSanitization = true;
  hvacClimateControlOperating = true;

  defectsIdentified = false;
  defectNotes = '';
  vehicleSafeToOperate = true;

  // Signature state
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private isDrawing = false;
  hasSignature = false;

  submissionSuccess = false;
  submittedDvirId = '';

  constructor(
    private complianceService: ComplianceService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.complianceService.vehicleRecords$.subscribe(records => {
      this.vehicles = records;
      const v = this.complianceService.getVehicleByUnit(this.selectedUnitNumber);
      if (v) {
        this.odometer = v.lastOdometer || 42350;
      }
    });
  }

  ngAfterViewInit(): void {
    this.initCanvas();
  }

  onVehicleChange(): void {
    const v = this.complianceService.getVehicleByUnit(this.selectedUnitNumber);
    if (v) {
      this.odometer = v.lastOdometer || 42000;
    }
  }

  private initCanvas(): void {
    if (!this.signatureCanvasRef) return;
    this.canvas = this.signatureCanvasRef.nativeElement;
    const context = this.canvas.getContext('2d');
    if (!context) return;
    this.ctx = context;

    // High-DPI calibration
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);

    this.ctx.lineWidth = 2.5;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.strokeStyle = '#0f172a';
  }

  startDrawing(event: MouseEvent | TouchEvent): void {
    this.isDrawing = true;
    const pos = this.getCanvasPosition(event);
    this.ctx.beginPath();
    this.ctx.moveTo(pos.x, pos.y);
    event.preventDefault();
  }

  draw(event: MouseEvent | TouchEvent): void {
    if (!this.isDrawing) return;
    const pos = this.getCanvasPosition(event);
    this.ctx.lineTo(pos.x, pos.y);
    this.ctx.stroke();
    this.hasSignature = true;
    event.preventDefault();
  }

  stopDrawing(): void {
    if (this.isDrawing) {
      this.isDrawing = false;
      this.ctx.closePath();
    }
  }

  clearSignature(): void {
    if (!this.ctx) return;
    const rect = this.canvas.getBoundingClientRect();
    this.ctx.clearRect(0, 0, rect.width, rect.height);
    this.hasSignature = false;
  }

  private getCanvasPosition(event: MouseEvent | TouchEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if (event instanceof MouseEvent) {
      clientX = event.clientX;
      clientY = event.clientY;
    } else if (event.touches && event.touches.length > 0) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  onChecklistToggle(): void {
    // If any safety item is false, automatically flag defects
    const anyDefect =
      !this.brakesServiceAndParking ||
      !this.tiresTreadAndPressure ||
      !this.lightsHeadBrakeTurnHazard ||
      !this.hornAndWipers ||
      !this.mirrorsAndWindshield ||
      !this.wheelchairLiftDeploymentCycle ||
      !this.wheelchairLiftManualBackupPump ||
      !this.qStraintTieDownsAndLapBelts ||
      !this.fireExtinguisherCharged ||
      !this.firstAidAndBbpSpillKitStocked ||
      !this.hvacClimateControlOperating;

    this.defectsIdentified = anyDefect;
    if (anyDefect) {
      this.vehicleSafeToOperate = false;
    }
  }

  submitInspection(): void {
    if (!this.driverName || !this.odometer) {
      this.snackBar.open('Please fill in driver name and current odometer reading.', 'Close', {
        duration: 3500
      });
      return;
    }

    if (!this.hasSignature) {
      this.snackBar.open('Driver electronic signature is required for DVIR attestation.', 'Close', {
        duration: 3500
      });
      return;
    }

    const dvirId = `DVIR-${Date.now().toString().slice(-6)}`;
    const sigUrl = this.canvas.toDataURL('image/png');

    const checklist: DVIRChecklist = {
      id: dvirId,
      inspectionType: this.inspectionType,
      unitNumber: this.selectedUnitNumber,
      driverId: this.driverId,
      driverName: this.driverName,
      timestamp: new Date().toISOString(),
      odometer: Number(this.odometer),
      brakesServiceAndParking: this.brakesServiceAndParking,
      tiresTreadAndPressure: this.tiresTreadAndPressure,
      lightsHeadBrakeTurnHazard: this.lightsHeadBrakeTurnHazard,
      hornAndWipers: this.hornAndWipers,
      mirrorsAndWindshield: this.mirrorsAndWindshield,
      wheelchairLiftDeploymentCycle: this.wheelchairLiftDeploymentCycle,
      wheelchairLiftManualBackupPump: this.wheelchairLiftManualBackupPump,
      qStraintTieDownsAndLapBelts: this.qStraintTieDownsAndLapBelts,
      fireExtinguisherCharged: this.fireExtinguisherCharged,
      firstAidAndBbpSpillKitStocked: this.firstAidAndBbpSpillKitStocked,
      cleanlinessAndSanitization: this.cleanlinessAndSanitization,
      hvacClimateControlOperating: this.hvacClimateControlOperating,
      defectsIdentified: this.defectsIdentified,
      defectNotes: this.defectNotes,
      vehicleSafeToOperate: this.vehicleSafeToOperate,
      driverSignatureDataUrl: sigUrl,
      driverPrintedName: this.driverName
    };

    this.complianceService.submitDVIR(checklist);
    this.submittedDvirId = dvirId;
    this.submissionSuccess = true;

    this.snackBar.open(
      `DVIR ${this.inspectionType.toUpperCase()} submitted! Vehicle status updated in fleet console.`,
      'Great',
      { duration: 4500 }
    );
  }

  resetForm(): void {
    this.submissionSuccess = false;
    this.clearSignature();
    this.defectNotes = '';
    this.defectsIdentified = false;
    this.vehicleSafeToOperate = true;
  }
}
