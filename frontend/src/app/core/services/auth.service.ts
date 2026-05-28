import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { TokenService } from './token.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storageKey = 'multitenant.auth.session';

  constructor(private readonly api: ApiService, private readonly token: TokenService, private readonly router: Router) {}

  async loginSuperAdmin(email: string, password: string): Promise<void> {
    const resp = await firstValueFrom(this.api.post<any>('/auth/super/login', { email, password }));
    this.saveSession(resp.access_token);
  }

  async loginOrgMember(role: 'org_admin' | 'user', email: string, password: string, orgCode: string): Promise<void> {
    const resp = await firstValueFrom(this.api.post<any>('/auth/org/login', { email, password, org_code: orgCode }));
    this.saveSession(resp.access_token);
  }

  logout(): void {
    this.token.clear();
    localStorage.removeItem(this.storageKey);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return this.session()?.accessToken ?? this.token.getToken();
  }

  isAuthenticated(): boolean {
    const t = this.getToken();
    return !!t && !this.token.isExpired(t);
  }

  session(): { accessToken: string; role: string; claims: Record<string, unknown> } | null {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as { accessToken: string; role: string; claims: Record<string, unknown> };
    } catch {
      localStorage.removeItem(this.storageKey);
      return null;
    }
  }

  currentRole(): string | null {
    return this.session()?.role ?? this.tokenRole();
  }

  currentOrgId(): number | null {
    const orgId = this.session()?.claims?.['org_id'];
    return typeof orgId === 'number' ? orgId : Number(orgId) || null;
  }

  private saveSession(accessToken: string): void {
    this.token.saveToken(accessToken);
    const claims = this.decodeToken(accessToken);
    const role = String(claims['role'] ?? '');
    localStorage.setItem(this.storageKey, JSON.stringify({ accessToken, role, claims }));
  }

  private decodeToken(token: string): Record<string, unknown> {
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

  private tokenRole(): string | null {
    const session = this.session();
    return session?.role ?? null;
  }
}
