import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of, switchMap } from 'rxjs';

export type SubscriptionTier = 'starter' | 'growth' | 'enterprise';
export type UserRole = 'admin' | 'owner' | 'compliance_manager' | 'driver' | 'staff';

export interface CompanyWorkspace {
  id: string;
  name: string;
  providerId: string;
  fleetSize: string;
  plan: SubscriptionTier;
  planTier?: string;
  billingCycle: 'monthly' | 'annual';
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  companyId: string;
}

export interface AuthSession {
  user: User;
  workspace: CompanyWorkspace;
  token: string;
}

export interface RegisteredAccount {
  user: User;
  workspace: CompanyWorkspace;
  password?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly SESSION_KEY = 'nemt_auth_session';
  private readonly ACCOUNTS_KEY = 'nemt_registered_accounts';
  private readonly JWT_KEY = 'nemt_jwt';

  /** Phase 1 backend: the API lives behind the dev proxy (/api -> :8080).
   *  On the Vercel deployment there is no backend yet, so every API call
   *  falls back to the demo auth below — the live demo never breaks. */
  private readonly API_URL = '/api/auth';

  private http = inject(HttpClient);

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  private currentWorkspaceSubject = new BehaviorSubject<CompanyWorkspace | null>(null);
  public currentWorkspace$: Observable<CompanyWorkspace | null> = this.currentWorkspaceSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$: Observable<boolean> = this.isAuthenticatedSubject.asObservable();

  private registeredAccounts: RegisteredAccount[] = [];

  constructor() {
    this.initDefaultAccounts();
    this.restoreSession();
  }

  private initDefaultAccounts(): void {
    const defaultAccounts: RegisteredAccount[] = [
      {
        user: {
          id: 'usr-admin-01',
          email: 'admin@nemtos.com',
          fullName: 'Sarah Jenkins (Fleet Director)',
          role: 'admin',
          companyId: 'ws-metro-01'
        },
        workspace: {
          id: 'ws-metro-01',
          name: 'Metro Care Transit LLC',
          providerId: 'NEMT-CO-88419',
          fleetSize: '6-20 vehicles',
          plan: 'growth',
          billingCycle: 'monthly',
          createdAt: '2024-01-15T08:00:00.000Z'
        },
        password: 'admin'
      },
      {
        user: {
          id: 'usr-driver-01',
          email: 'driver@nemtos.com',
          fullName: 'Marcus Vance (NEMT Driver)',
          role: 'driver',
          companyId: 'ws-metro-01'
        },
        workspace: {
          id: 'ws-metro-01',
          name: 'Metro Care Transit LLC',
          providerId: 'NEMT-CO-88419',
          fleetSize: '6-20 vehicles',
          plan: 'growth',
          billingCycle: 'monthly',
          createdAt: '2024-01-15T08:00:00.000Z'
        },
        password: 'driver'
      },
      {
        user: {
          id: 'usr-operator-01',
          email: 'operator@metrotransit.com',
          fullName: 'Metro Care Operations Lead',
          role: 'owner',
          companyId: 'ws-metro-01'
        },
        workspace: {
          id: 'ws-metro-01',
          name: 'Metro Care Transit LLC',
          providerId: 'NEMT-CO-88419',
          fleetSize: '6-20 vehicles',
          plan: 'growth',
          billingCycle: 'monthly',
          createdAt: '2024-01-15T08:00:00.000Z'
        },
        password: 'demo'
      }
    ];

    try {
      const stored = localStorage.getItem(this.ACCOUNTS_KEY);
      if (stored) {
        this.registeredAccounts = JSON.parse(stored);
      } else {
        this.registeredAccounts = defaultAccounts;
        localStorage.setItem(this.ACCOUNTS_KEY, JSON.stringify(defaultAccounts));
      }
    } catch {
      this.registeredAccounts = defaultAccounts;
    }
  }

  private restoreSession(): void {
    try {
      const stored = localStorage.getItem(this.SESSION_KEY);
      if (stored) {
        const session: AuthSession = JSON.parse(stored);
        this.currentUserSubject.next(session.user);
        this.currentWorkspaceSubject.next(session.workspace);
        this.isAuthenticatedSubject.next(true);
      }
    } catch (e) {
      console.warn('Could not restore auth session', e);
      this.clearSession();
    }
  }

  /**
   * Registers a new user account. Tries the real backend first
   * (POST /api/auth/register, creates workspace + ADMIN user); if the backend
   * is unreachable it falls back to the demo localStorage registration,
   * exactly as before. Does NOT open a session — use register() for that.
   */
  public registerAccount(
    companyName: string,
    email: string,
    password: string,
    role: UserRole = 'admin',
    fullName?: string,
    fleetSize: string = '1-5 vehicles',
    plan: SubscriptionTier = 'growth'
  ): Observable<boolean> {
    if (!companyName || !email || !email.includes('@')) {
      return of(false);
    }
    const cleanEmail = email.trim().toLowerCase();
    return this.http.post<{
      token: string;
      user: { id: string; email: string; fullName: string; role: string; workspaceId: string };
      workspace: CompanyWorkspace;
    }>(`${this.API_URL}/register`, {
      companyName: companyName.trim(),
      email: cleanEmail,
      password,
      fullName: fullName?.trim() || undefined,
      fleetSize,
      plan
    }).pipe(
      map(() => true),
      catchError(() => of(this.demoRegisterAccount(companyName, email, password, role, fullName, fleetSize, plan)))
    );
  }

  /** Demo-only registration (localStorage), used when the API is unreachable. */
  private demoRegisterAccount(
    companyName: string,
    email: string,
    password: string,
    role: UserRole = 'admin',
    fullName?: string,
    fleetSize: string = '1-5 vehicles',
    plan: SubscriptionTier = 'growth'
  ): boolean {
    if (!companyName || !email || !email.includes('@')) {
      return false;
    }

    const cleanEmail = email.trim().toLowerCase();

    const newWorkspace: CompanyWorkspace = {
      id: 'ws-' + Math.random().toString(36).substring(2, 8),
      name: companyName.trim(),
      providerId: 'NEMT-PENDING-' + Math.floor(1000 + Math.random() * 9000),
      fleetSize: fleetSize,
      plan: plan,
      billingCycle: 'monthly',
      createdAt: new Date().toISOString()
    };

    const newUser: User = {
      id: 'usr-' + Math.random().toString(36).substring(2, 8),
      email: cleanEmail,
      fullName: fullName?.trim() || (cleanEmail.split('@')[0].replace('.', ' ').toUpperCase() + ' (' + (role === 'admin' ? 'Admin' : 'Driver') + ')'),
      role: role,
      companyId: newWorkspace.id
    };

    const newAccount: RegisteredAccount = {
      user: newUser,
      workspace: newWorkspace,
      password: password || 'password123'
    };

    // Remove existing if duplicate email
    this.registeredAccounts = this.registeredAccounts.filter(a => a.user.email !== cleanEmail);
    this.registeredAccounts.push(newAccount);

    try {
      localStorage.setItem(this.ACCOUNTS_KEY, JSON.stringify(this.registeredAccounts));
    } catch (e) {
      console.warn('Error saving registered accounts', e);
    }

    return true;
  }

  /**
   * Backward-compatible register that registers AND signs in immediately (used by older tests).
   */
  public register(companyName: string, email: string, fleetSize: string, plan: SubscriptionTier = 'growth', role: UserRole = 'owner', password?: string): Observable<boolean> {
    const pw = password || 'password123';
    return this.registerAccount(companyName, email, pw, role, undefined, fleetSize, plan).pipe(
      switchMap(success => success ? this.login(email, pw) : of(false))
    );
  }

  /**
   * Authenticate with email & password. Tries the real backend first
   * (POST /api/auth/login); on any failure — wrong credentials on the API is
   * NOT a fallback case (401 means the account exists server-side), but a
   * network error / unreachable backend falls back to the demo auth exactly
   * as today, so the Vercel demo keeps working with no backend.
   */
  public login(email: string, password?: string): Observable<boolean> {
    if (!email || !email.includes('@')) {
      return of(false);
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!password) {
      return of(this.demoLogin(cleanEmail, password));
    }

    return this.http.post<{
      token: string;
      user: { id: string; email: string; fullName: string; role: string; workspaceId: string };
      workspace: CompanyWorkspace;
    }>(`${this.API_URL}/login`, { email: cleanEmail, password }).pipe(
      map(res => {
        const role = this.mapApiRole(res.user.role);
        this.saveApiSession(
          { id: res.user.id, email: res.user.email, fullName: res.user.fullName, role, companyId: res.user.workspaceId },
          res.workspace,
          res.token
        );
        return true;
      }),
      catchError(err => {
        // 401 from the API = real rejection, do not fall back to demo.
        if (err?.status === 401) {
          return of(false);
        }
        return of(this.demoLogin(cleanEmail, password));
      })
    );
  }

  /** Maps backend roles (ADMIN/DISPATCHER/DRIVER) to the frontend's UserRole. */
  private mapApiRole(apiRole: string): UserRole {
    switch ((apiRole || '').toUpperCase()) {
      case 'ADMIN': return 'admin';
      case 'DISPATCHER': return 'owner';
      case 'DRIVER': return 'driver';
      default: return 'admin';
    }
  }

  /** Demo-only login (localStorage accounts), used when the API is unreachable. */
  private demoLogin(email: string, password?: string): boolean {
    const cleanEmail = email.trim().toLowerCase();
    const existing = this.registeredAccounts.find(a => a.user.email.toLowerCase() === cleanEmail);

    if (existing) {
      this.saveSession(existing.user, existing.workspace);
      return true;
    }

    // If account was not pre-registered, determine role from email or default to admin
    const isDriverEmail = cleanEmail.includes('driver') || cleanEmail.includes('user') || cleanEmail.includes('staff');
    const role: UserRole = isDriverEmail ? 'driver' : 'admin';

    const autoWorkspace: CompanyWorkspace = {
      id: 'ws-' + Math.random().toString(36).substring(2, 8),
      name: cleanEmail.split('@')[1].split('.')[0].toUpperCase() + ' Transit',
      providerId: 'NEMT-CO-' + Math.floor(10000 + Math.random() * 90000),
      fleetSize: '6-20 vehicles',
      plan: 'growth',
      billingCycle: 'monthly',
      createdAt: new Date().toISOString()
    };

    const autoUser: User = {
      id: 'usr-' + Math.random().toString(36).substring(2, 8),
      email: cleanEmail,
      fullName: cleanEmail.split('@')[0].replace('.', ' ').toUpperCase(),
      role: role,
      companyId: autoWorkspace.id
    };

    this.saveSession(autoUser, autoWorkspace);
    return true;
  }

  /**
   * Check if current authenticated user has administrative privileges for the SaaS OS
   */
  public hasAdminAccess(): boolean {
    const user = this.currentUserSubject.value;
    if (!user) return false;
    return user.role === 'admin' || user.role === 'owner' || user.role === 'compliance_manager';
  }

  public quickAdminDemoLogin(): Observable<boolean> {
    return this.login('admin@nemtos.com', 'admin123');
  }

  public quickUserDemoLogin(): Observable<boolean> {
    return this.login('driver@nemtos.com', 'driver123');
  }

  public quickDemoLogin(): Observable<boolean> {
    return this.quickAdminDemoLogin();
  }

  public logout(): void {
    this.clearSession();
  }

  public isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public get currentWorkspaceValue(): CompanyWorkspace | null {
    return this.currentWorkspaceSubject.value;
  }

  /** The real JWT from the backend (Phase 1), if the current session is an API one. */
  public getToken(): string | null {
    try {
      return localStorage.getItem(this.JWT_KEY);
    } catch {
      return null;
    }
  }

  private saveSession(user: User, workspace: CompanyWorkspace): void {
    const session: AuthSession = {
      user,
      workspace,
      token: 'jwt-simulated-' + Math.random().toString(36).substring(2, 12)
    };

    try {
      // Demo session: drop any stale real JWT so a later API call can't reuse it.
      localStorage.removeItem(this.JWT_KEY);
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    } catch (e) {
      console.warn('Error persisting session', e);
    }

    this.currentUserSubject.next(user);
    this.currentWorkspaceSubject.next(workspace);
    this.isAuthenticatedSubject.next(true);
  }

  /** Session created by the real backend — stores the JWT for later API calls. */
  private saveApiSession(user: User, workspace: CompanyWorkspace, token: string): void {
    const session: AuthSession = { user, workspace, token };

    try {
      localStorage.setItem(this.JWT_KEY, token);
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    } catch (e) {
      console.warn('Error persisting session', e);
    }

    this.currentUserSubject.next(user);
    this.currentWorkspaceSubject.next(workspace);
    this.isAuthenticatedSubject.next(true);
  }

  private clearSession(): void {
    try {
      localStorage.removeItem(this.SESSION_KEY);
      localStorage.removeItem(this.JWT_KEY);
    } catch (e) {
      console.warn('Error clearing session', e);
    }

    this.currentUserSubject.next(null);
    this.currentWorkspaceSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }
}
