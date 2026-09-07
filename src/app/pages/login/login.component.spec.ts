import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: AuthService;
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        AuthService,
        provideRouter([]),
        provideNoopAnimations()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    authService.logout();
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    fixture.detectChanges();
  });

  afterEach(() => {
    authService.logout();
    localStorage.clear();
  });

  it('should create the login component', () => {
    expect(component).toBeTruthy();
  });

  it('should trigger quick admin demo login and navigate to admin', () => {
    component.quickAdminDemoLogin();
    expect(authService.isAuthenticated()).toBeTrue();
    expect(authService.hasAdminAccess()).toBeTrue();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/admin');
  });

  it('should trigger quick user demo login and navigate to access-denied', () => {
    component.quickUserDemoLogin();
    expect(authService.isAuthenticated()).toBeTrue();
    expect(authService.hasAdminAccess()).toBeFalse();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/access-denied');
  });

  it('should handle operator login validation when email is missing', () => {
    spyOn(component['snackBar'], 'open');
    component.loginEmail = '';
    component.onLogin();
    expect(component['snackBar'].open).toHaveBeenCalledWith('Please enter your email address.', 'Close', jasmine.any(Object));
  });

  it('should create user account then switch to login tab with prefilled credentials', () => {
    component.selectedTabIndex = 1;
    component.regCompanyName = 'Apex Care Mobility';
    component.regEmail = 'owner@apexmobility.com';
    component.regPassword = 'mypassword';
    component.regRole = 'admin';
    component.regFleetSize = '6-20 vehicles';
    component.regPlan = 'growth';

    component.onRegister();

    // After account creation:
    // 1. User should NOT be automatically logged in yet
    expect(authService.isAuthenticated()).toBeFalse();
    // 2. Tab should switch to Login Tab (index 0)
    expect(component.selectedTabIndex).toBe(0);
    // 3. Email should be pre-filled
    expect(component.loginEmail).toBe('owner@apexmobility.com');

    // 4. User logs in from login page
    component.onLogin();
    expect(authService.isAuthenticated()).toBeTrue();
    expect(authService.hasAdminAccess()).toBeTrue();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/admin');
  });

  it('should redirect non-admin user to access-denied when logging in with driver account', () => {
    // Create driver account
    authService.registerAccount('Test Transit', 'driver@testtransit.com', 'pass123', 'driver');

    component.loginEmail = 'driver@testtransit.com';
    component.loginPassword = 'pass123';
    component.onLogin();

    expect(authService.isAuthenticated()).toBeTrue();
    expect(authService.hasAdminAccess()).toBeFalse();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/access-denied');
  });
});
