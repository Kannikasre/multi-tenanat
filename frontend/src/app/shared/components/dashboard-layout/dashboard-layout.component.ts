import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

type DashboardRole = 'super_admin' | 'org_admin' | 'user';

interface SidebarLink {
  label: string;
  fragment: string;
}

const ROLE_META: Record<DashboardRole, { label: string; theme: string; accent: string; menu: SidebarLink[] }> = {
  super_admin: {
    label: 'Superadmin',
    theme: 'role-super',
    accent: '#246bff',
    menu: [
      { label: 'Organizations', fragment: 'organizations' },
      { label: 'Admins', fragment: 'admins' },
      { label: 'Users', fragment: 'users' },
    ],
  },
  org_admin: {
    label: 'Admin',
    theme: 'role-admin',
    accent: '#16c55d',
    menu: [
      { label: 'Users', fragment: 'users' },
      { label: 'Tasks', fragment: 'tasks' },
    ],
  },
  user: {
    label: 'User',
    theme: 'role-user',
    accent: '#ff6a00',
    menu: [{ label: 'My Tasks', fragment: 'tasks' }],
  },
};

@Component({
  selector: 'app-dashboard-layout',
  template: `
    <div class="shell" [ngClass]="roleMeta.theme">
      <aside class="sidebar">
        <div class="identity">
          <div class="badge" [style.background]="roleMeta.accent + '22'" [style.color]="roleMeta.accent">
            {{ roleMeta.label.charAt(0) }}
          </div>
          <div>
            <div class="eyebrow">Logged in as</div>
            <div class="role-name">{{ roleMeta.label }}</div>
          </div>
        </div>

        <nav class="menu">
          <a
            *ngFor="let item of roleMeta.menu"
            [routerLink]="[]"
            [fragment]="item.fragment"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: false }"
          >
            {{ item.label }}
          </a>
        </nav>

        <button class="logout" (click)="logout()">Logout</button>
      </aside>

      <main class="content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [
    `
      :host { display: block; min-height: 100vh; }
      .shell { min-height: 100vh; display: grid; grid-template-columns: 220px 1fr; background: #eef3f9; }
      .sidebar { background: #0c1630; color: #fff; padding: 18px 16px; display: flex; flex-direction: column; gap: 22px; box-shadow: inset -1px 0 0 rgba(255,255,255,.06); }
      .identity { display: flex; align-items: center; gap: 12px; padding-bottom: 18px; border-bottom: 1px solid rgba(255,255,255,.08); }
      .badge { width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center; font-weight: 800; font-size: 20px; }
      .eyebrow { color: rgba(255,255,255,.55); font-size: 12px; margin-bottom: 2px; }
      .role-name { font-size: 16px; font-weight: 700; }
      .menu { display: flex; flex-direction: column; gap: 8px; }
      .menu a { display: block; padding: 14px 16px; border-radius: 10px; color: rgba(255,255,255,.85); text-decoration: none; font-weight: 600; transition: 160ms ease; }
      .menu a:hover, .menu a.active { color: #fff; transform: translateX(2px); }
      .role-super .menu a.active { background: #246bff; }
      .role-admin .menu a.active { background: #16c55d; }
      .role-user .menu a.active { background: #ff6a00; }
      .logout { margin-top: auto; background: transparent; border: 0; color: #fff; font-weight: 700; padding: 14px 0; text-align: left; cursor: pointer; opacity: .92; }
      .content { min-width: 0; padding: 24px 24px 36px; }
      @media (max-width: 900px) {
        .shell { grid-template-columns: 1fr; }
        .sidebar { position: sticky; top: 0; z-index: 20; }
      }
    `,
  ],
})
export class DashboardLayoutComponent {
  private readonly fallbackRole: DashboardRole = 'user';

  constructor(private readonly auth: AuthService, private readonly router: Router) {}

  get role(): DashboardRole {
    return (this.auth.currentRole() as DashboardRole | null) ?? this.fallbackRole;
  }

  get roleMeta() {
    return ROLE_META[this.role] ?? ROLE_META[this.fallbackRole];
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}