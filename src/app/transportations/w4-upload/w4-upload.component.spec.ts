import { ComponentFixture, TestBed } from '@angular/core/testing';

import { W4UploadComponent } from './w4-upload.component';

describe('W4UploadComponent', () => {
  let component: W4UploadComponent;
  let fixture: ComponentFixture<W4UploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [W4UploadComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(W4UploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
