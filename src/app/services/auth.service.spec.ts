import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created and initially unauthenticated', () => {
    expect(service).toBeTruthy();
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('should log in with valid email and persist session', () => {
    const success = service.login('owner@apexmedical.com', 'password123');

    expect(success).toBeTrue();
    expect(service.isAuthenticated()).toBeTrue();
    expect(service.currentUserValue?.email).toBe('owner@apexmedical.com');
  });

  it('should register account without auto-logging in', () => {
    const success = service.registerAccount(
      'Horizon Mobility LLC',
      'dispatcher@horizon.com',
      'secret123',
      'admin',
      'Horizon Dispatcher',
      '1-5 vehicles',
      'starter'
    );

    expect(success).toBeTrue();
    // User should NOT be automatically authenticated yet
    expect(service.isAuthenticated()).toBeFalse();

    // Now logging in with created credentials works
    const loginOk = service.login('dispatcher@horizon.com', 'secret123');
    expect(loginOk).toBeTrue();
    expect(service.isAuthenticated()).toBeTrue();
    expect(service.hasAdminAccess()).toBeTrue();
  });

  it('should distinguish admin vs non-admin driver roles', () => {
    // Admin login
    service.quickAdminDemoLogin();
    expect(service.isAuthenticated()).toBeTrue();
    expect(service.hasAdminAccess()).toBeTrue();

    // Driver login
    service.quickUserDemoLogin();
    expect(service.isAuthenticated()).toBeTrue();
    expect(service.currentUserValue?.role).toBe('driver');
    expect(service.hasAdminAccess()).toBeFalse();
  });

  it('should register a new company workspace and authenticate via backward-compatible register()', () => {
    const success = service.register('Apex Transit LLC', 'ceo@apextransit.com', '6-20 vehicles', 'growth');

    expect(success).toBeTrue();
    expect(service.isAuthenticated()).toBeTrue();
    expect(service.currentWorkspaceValue?.name).toBe('Apex Transit LLC');
    expect(service.currentWorkspaceValue?.plan).toBe('growth');
  });

  it('should clear session on logout', () => {
    service.login('test@example.com');
    expect(service.isAuthenticated()).toBeTrue();

    service.logout();
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.currentUserValue).toBeNull();
  });
});
