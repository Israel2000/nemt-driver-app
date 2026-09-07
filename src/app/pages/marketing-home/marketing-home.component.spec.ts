import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MarketingHomeComponent } from './marketing-home.component';

describe('MarketingHomeComponent', () => {
  let component: MarketingHomeComponent;
  let fixture: ComponentFixture<MarketingHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarketingHomeComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MarketingHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the marketing home component', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle annual and monthly billing mode', () => {
    expect(component.isAnnualBilling).toBeFalse();
    component.toggleBilling(true);
    expect(component.isAnnualBilling).toBeTrue();
    component.toggleBilling(false);
    expect(component.isAnnualBilling).toBeFalse();
  });

  it('should toggle FAQ accordion items', () => {
    expect(component.activeFaqIndex).toBe(0);
    // Clicking the same FAQ item toggles it closed
    component.toggleFaq(0);
    expect(component.activeFaqIndex).toBeNull();

    // Clicking item 2 opens it
    component.toggleFaq(2);
    expect(component.activeFaqIndex).toBe(2);
  });

  it('should display hero title in template', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.hero-heading')?.textContent).toContain('Hire Drivers 80% Faster');
  });

  it('should render all pricing cards', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const cards = compiled.querySelectorAll('.pricing-card');
    expect(cards.length).toBe(3);
  });
});
