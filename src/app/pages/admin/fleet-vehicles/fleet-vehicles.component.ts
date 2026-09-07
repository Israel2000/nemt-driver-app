import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

export interface FleetVehicle {
  unitNumber: string;
  type: 'Wheelchair Ramp Van' | 'Bariatric Stretcher Van' | 'Ambulatory Sedan';
  makeModel: string;
  vin: string;
  licensePlate: string;
  status: 'In Service' | 'Inspection Due' | 'In Maintenance';
  dotInspectionDue: string;
  assignedDriver: string;
  mileage: number;
}

@Component({
  selector: 'app-fleet-vehicles',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './fleet-vehicles.component.html',
  styleUrls: ['./fleet-vehicles.component.css']
})
export class FleetVehiclesComponent {
  fleetVehicles: FleetVehicle[] = [
    {
      unitNumber: 'VAN-101',
      type: 'Wheelchair Ramp Van',
      makeModel: '2023 Ford Transit 350 HD',
      vin: '1FTBR1Y85PKA19482',
      licensePlate: 'GA-NEMT01',
      status: 'In Service',
      dotInspectionDue: '2026-11-15',
      assignedDriver: 'Marcus Sterling',
      mileage: 42180
    },
    {
      unitNumber: 'VAN-102',
      type: 'Bariatric Stretcher Van',
      makeModel: '2022 Ram ProMaster 2500',
      vin: '3C6TRVDG2NE194819',
      licensePlate: 'GA-NEMT02',
      status: 'In Service',
      dotInspectionDue: '2026-10-01',
      assignedDriver: 'Elena Rostova',
      mileage: 58920
    },
    {
      unitNumber: 'VAN-103',
      type: 'Wheelchair Ramp Van',
      makeModel: '2021 Mercedes-Benz Sprinter',
      vin: 'WD3PF4CD6MP029184',
      licensePlate: 'GA-NEMT03',
      status: 'Inspection Due',
      dotInspectionDue: '2026-09-12',
      assignedDriver: 'David Chen',
      mileage: 74210
    },
    {
      unitNumber: 'SED-201',
      type: 'Ambulatory Sedan',
      makeModel: '2024 Toyota Camry Hybrid',
      vin: '4T1C11AK8RU192841',
      licensePlate: 'GA-AMB04',
      status: 'In Service',
      dotInspectionDue: '2027-02-28',
      assignedDriver: 'Reserve / Rotational',
      mileage: 18450
    }
  ];

  vehicleColumns = ['unit', 'type', 'makeModel', 'vinPlate', 'status', 'inspection', 'driver'];

  constructor(private snackBar: MatSnackBar) {}

  scheduleInspection(vehicle: FleetVehicle): void {
    this.snackBar.open(`DOT safety inspection scheduled for ${vehicle.unitNumber} (${vehicle.makeModel}).`, 'OK', { duration: 3500 });
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }
}
