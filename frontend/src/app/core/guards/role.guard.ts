import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { TokenService } from '../services/token.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private token: TokenService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const expected = route.data['roles'] as string[] | undefined;
    const t = this.token.getToken();
    if (!t) {
      this.router.navigate(['/auth/login']);
      return false;
    }
    try {
      const payload = JSON.parse(atob(t.split('.')[1]));
      const role = payload.role as string | undefined;
      if (!expected || expected.includes(role || '')) return true;
    } catch {}
    this.router.navigate(['/auth/login']);
    return false;
  }
}
