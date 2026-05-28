import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../environments/environment';

export type Role = 'enterprise_admin' | 'org_admin' | 'user';

export interface AuthSession {
  accessToken: string;
  role: Role;
  claims: Record<string, unknown>;
}

export interface LoginResult {
  access_token: string;
  role?: Role;
  user?: Record<string, unknown>;
}

export interface OrganizationSummary {
  id: number;
  enterprise_id: number;
  name: string;
  schema_name: string;
  created_at?: string;
  is_active: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storageKey = 'multitenant.auth.session';

  constructor(private readonly http: HttpClient) {}

  async loginEnterprise(email: string, password: string): Promise<AuthSession> {
    const response = await firstValueFrom(
      this.http.post<LoginResult>(`${environment.apiBaseUrl}/auth/enterprise/login`, { email, password })
    );
    return this.persistSession(response.access_token, 'enterprise_admin');
  }

  async loginOrg(email: string, password: string, orgCode: string, role: Role): Promise<AuthSession> {
    const response = await firstValueFrom(
      this.http.post<LoginResult>(`${environment.apiBaseUrl}/auth/org/login`, { email, password, org_code: orgCode })
    );
    return this.persistSession(response.access_token, role);
  }

  async getOrganizations(): Promise<OrganizationSummary[]> {
    return firstValueFrom(this.http.get<OrganizationSummary[]>(`${environment.apiBaseUrl}/enterprise/organizations`, this.authOptions()));
  }

  async createOrganization(name: string, orgAdminEmail: string): Promise<OrganizationSummary> {
    return firstValueFrom(
      this.http.post<OrganizationSummary>(
        `${environment.apiBaseUrl}/enterprise/organizations`,
        { name, org_admin_email: orgAdminEmail },
        this.authOptions()
      )
    );
  }

  async regenerateOrganizationCode(orgId: number, orgAdminEmail: string): Promise<{ message: string }> {
    return firstValueFrom(
      this.http.post<{ message: string }>(
        `${environment.apiBaseUrl}/enterprise/organizations/${orgId}/org-code/regenerate`,
        { org_admin_email: orgAdminEmail },
        this.authOptions()
      )
    );
  }

  async getOrgUsers(orgId: number): Promise<Record<string, unknown>[]> {
    return firstValueFrom(this.http.get<Record<string, unknown>[]>(`${environment.apiBaseUrl}/orgs/${orgId}/users`, this.authOptions()));
  }

  async createUser(orgId: number, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    return firstValueFrom(
      this.http.post<Record<string, unknown>>(`${environment.apiBaseUrl}/orgs/${orgId}/users`, payload, this.authOptions())
    );
  }

  async getMyTasks(): Promise<Record<string, unknown>[]> {
    return firstValueFrom(this.http.get<Record<string, unknown>[]>(`${environment.apiBaseUrl}/tasks/my`, this.authOptions()));
  }

  async createTask(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    return firstValueFrom(this.http.post<Record<string, unknown>>(`${environment.apiBaseUrl}/tasks`, payload, this.authOptions()));
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
  }

  loadSession(): AuthSession | null {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as AuthSession;
    } catch {
      localStorage.removeItem(this.storageKey);
      return null;
    }
  }

  getToken(): string | null {
    return this.loadSession()?.accessToken ?? null;
  }

  decodeToken(token: string): Record<string, unknown> {
    const payload = token.split('.')[1] ?? '';
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const normalized = decodeURIComponent(
      json
        .split('')
        .map((character) => `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join('')
    );
    return JSON.parse(normalized) as Record<string, unknown>;
  }

  private persistSession(accessToken: string, fallbackRole: Role): AuthSession {
    const claims = this.decodeToken(accessToken);
    const role = (claims['role'] as Role | undefined) ?? fallbackRole;
    const session: AuthSession = { accessToken, role, claims };
    localStorage.setItem(this.storageKey, JSON.stringify(session));
    return session;
  }

  private authOptions() {
    const token = this.getToken();
    return {
      headers: new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }
}