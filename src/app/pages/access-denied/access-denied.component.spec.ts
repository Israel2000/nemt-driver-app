import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { AccessDeniedComponent } from './access-denied.component';
import { AuthService } from '../../services/auth.service';

describe('AccessDeniedComponent', () => {
  let component: AccessDeniedComponent;
  let fixture: ComponentFixture<AccessDeniedComponent>;
  let authService: AuthService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccessDeniedComponent],
      providers: [
        AuthService,
        provideRouter([]),
        provideNoopAnimations()
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    // Sign in as non-admin driver
    authService.quickUserDemoLogin();

    fixture = TestBed.createComponent(AccessDeniedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    authService.logout();
  });

  it('should create the access denied component', () => {
    expect(component).toBeTruthy();
  });

  it('should display non-admin user role in template', () => {
    expect(component.currentUser?.role).toBe('driver');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.denied-title')?.textContent).toContain('Administrator Clearance Required');
  });

  it('should switch account and navigate to login on button click', () => {
    component.switchAccount();
    expect(authService.isAuthenticated()).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
