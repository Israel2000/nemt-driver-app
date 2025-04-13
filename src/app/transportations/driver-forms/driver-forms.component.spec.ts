import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DriverFormsComponent } from './driver-forms.component';

describe('DriverFormsComponent', () => {
  let component: DriverFormsComponent;
  let fixture: ComponentFixture<DriverFormsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DriverFormsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DriverFormsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
