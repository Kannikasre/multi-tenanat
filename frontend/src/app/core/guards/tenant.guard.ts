import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { TokenService } from '../services/token.service';

@Injectable({ providedIn: 'root' })
export class TenantGuard implements CanActivate {
  constructor(private token: TokenService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const orgId = route.params['orgId'] || route.data['orgId'];
    const t = this.token.getToken();
    if (!t) {
      this.router.navigate(['/auth/login']);
      return false;
    }
    try {
      const payload = JSON.parse(atob(t.split('.')[1]));
      const userOrg = payload.org_id as number | undefined;
      if (!orgId || userOrg === undefined) return true;
      if (Number(orgId) === Number(userOrg)) return true;
    } catch {}
    this.router.navigate(['/auth/login']);
    return false;
  }
}
