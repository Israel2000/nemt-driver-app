import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type SubscriptionTier = 'starter' | 'growth' | 'enterprise';
export type UserRole = 'admin' | 'owner' | 'compliance_manager' | 'driver' | 'staff';

export interface CompanyWorkspace {
  id: string;
  name: string;
  providerId: string;
  fleetSize: string;
  plan: SubscriptionTier;
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
   * Registers a new user account into persistent storage without opening an active session.
   * Directs user back to the login page to authenticate.
   */
  public registerAccount(
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
  public register(companyName: string, email: string, fleetSize: string, plan: SubscriptionTier = 'growth', role: UserRole = 'owner'): boolean {
    const success = this.registerAccount(companyName, email, 'password123', role, undefined, fleetSize, plan);
    if (success) {
      return this.login(email, 'password123');
    }
    return false;
  }

  /**
   * Authenticate with email & optional password
   */
  public login(email: string, password?: string): boolean {
    if (!email || !email.includes('@')) {
      return false;
    }

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

  public quickAdminDemoLogin(): void {
    this.login('admin@nemtos.com', 'admin123');
  }

  public quickUserDemoLogin(): void {
    this.login('driver@nemtos.com', 'driver123');
  }

  public quickDemoLogin(): void {
    this.quickAdminDemoLogin();
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

  private saveSession(user: User, workspace: CompanyWorkspace): void {
    const session: AuthSession = {
      user,
      workspace,
      token: 'jwt-simulated-' + Math.random().toString(36).substring(2, 12)
    };

    try {
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
    } catch (e) {
      console.warn('Error clearing session', e);
    }

    this.currentUserSubject.next(null);
    this.currentWorkspaceSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }
}
