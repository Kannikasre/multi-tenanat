import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { TokenService } from './token.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private api: ApiService, private token: TokenService, private router: Router) {}

  async login(email: string, password: string): Promise<void> {
    const resp = await firstValueFrom(this.api.post<any>('/auth/login', { email, password }));
    this.token.saveToken(resp.access_token);
  }

  logout(): void {
    this.token.clear();
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return this.token.getToken();
  }

  isAuthenticated(): boolean {
    const t = this.getToken();
    return !!t && !this.token.isExpired(t);
  }
}
