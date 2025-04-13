import { Component } from '@angular/core';
import { FormBuilder, Validators, FormGroup, ReactiveFormsModule } from '@angular/forms';

// Angular Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core'; // Needed for datepicker to work
import { MatListModule } from '@angular/material/list';
import { MatRadioModule } from '@angular/material/radio';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-driver-forms',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatListModule,
    MatRadioModule,
    MatLabel,
    MatTableModule
  ],
  templateUrl: './driver-forms.component.html',
  styleUrls: ['./driver-forms.component.css']
})
export class DriverFormsComponent {
  driverForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.driverForm = this.fb.group({
      firstName: ['', Validators.required],
      middleName: [''],
      lastName: ['', Validators.required],
      phone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      dob: ['', Validators.required],
      ssn: ['', Validators.required],
      dateOfApplication: ['', Validators.required],
      positionAppliedFor: ['', Validators.required],
      availableStartDate: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.driverForm.valid) {
      console.log(this.driverForm.value);
    } else {
      console.warn('Form is invalid');
    }
  }
}
