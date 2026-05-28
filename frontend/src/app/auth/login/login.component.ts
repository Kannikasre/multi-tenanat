import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

type LoginRole = 'super_admin' | 'org_admin' | 'user';

const ROLE_COPY: Record<LoginRole, { title: string; subtitle: string; accent: string; action: string; includeOrgCode: boolean }> = {
  super_admin: {
    title: 'Super Admin Sign In',
    subtitle: 'Access the organization management console.',
    accent: '#246bff',
    action: 'Login as Super Admin',
    includeOrgCode: false,
  },
  org_admin: {
    title: 'Admin Sign In',
    subtitle: 'Manage users and tasks within your organization.',
    accent: '#16c55d',
    action: 'Login as Admin',
    includeOrgCode: true,
  },
  user: {
    title: 'User Sign In',
    subtitle: 'Track and update your assigned tasks.',
    accent: '#ff6a00',
    action: 'Login as User',
    includeOrgCode: true,
  },
};

@Component({
  selector: 'app-login',
  template: `
    <main class="login-page" [style.--accent]="copy.accent">
      <a class="back-link" routerLink="/">← Back to role selection</a>

      <section class="login-card">
        <div class="hero-mark"></div>
        <p class="eyebrow">Multi-tenant SaaS Platform</p>
        <h1>{{ copy.title }}</h1>
        <p class="subtitle">{{ copy.subtitle }}</p>

        <form [formGroup]="form" (ngSubmit)="submit()" class="login-form">
          <label>
            <span>Email</span>
            <input type="email" formControlName="email" placeholder="name@company.com" />
          </label>

          <label *ngIf="copy.includeOrgCode">
            <span>Organization Code</span>
            <input type="text" formControlName="orgCode" placeholder="Enter security code" />
          </label>

          <label>
            <span>Password</span>
            <input type="password" formControlName="password" placeholder="••••••••" />
          </label>

          <button type="submit" [disabled]="form.invalid || busy">{{ copy.action }}</button>
          <p class="error" *ngIf="errorMessage">{{ errorMessage }}</p>
        </form>
      </section>
    </main>
  `,
  styles: [
    `
      :host { display: block; min-height: 100vh; }
      .login-page { min-height: 100vh; display: grid; place-items: center; padding: 32px 24px; background:
          radial-gradient(circle at top, rgba(36,107,255,.18), transparent 28%),
          radial-gradient(circle at bottom, rgba(22,197,93,.12), transparent 24%),
          linear-gradient(180deg, #f7f9fc 0%, #eef3f9 100%); }
      .back-link { position: absolute; top: 24px; left: 24px; color: var(--muted); text-decoration: none; font-weight: 600; }
      .login-card { position: relative; width: min(100%, 460px); background: rgba(255,255,255,.94); border: 1px solid rgba(148,163,184,.16); border-radius: 24px; padding: 34px; box-shadow: var(--shadow); text-align: center; overflow: hidden; }
      .hero-mark { position: absolute; inset: -90px auto auto -70px; width: 180px; height: 180px; border-radius: 50%; background: color-mix(in srgb, var(--accent) 10%, white); opacity: .75; }
      .eyebrow { margin: 0 0 10px; color: var(--accent); font-weight: 700; letter-spacing: .08em; text-transform: uppercase; font-size: 12px; }
      h1 { margin: 0; font-size: 28px; letter-spacing: -0.03em; }
      .subtitle { margin: 10px 0 24px; color: var(--muted); }
      .login-form { display: grid; gap: 14px; text-align: left; }
      label { display: grid; gap: 8px; font-weight: 600; color: #25344f; }
      input { width: 100%; border: 1px solid rgba(148,163,184,.32); background: #fff; border-radius: 14px; padding: 14px 16px; font: inherit; color: var(--text); outline: none; transition: border-color .15s ease, box-shadow .15s ease; }
      input:focus { border-color: var(--accent); box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 18%, white); }
      button { margin-top: 6px; border: 0; border-radius: 14px; padding: 15px 18px; color: #fff; background: var(--accent); font-weight: 700; cursor: pointer; box-shadow: 0 14px 30px color-mix(in srgb, var(--accent) 30%, transparent); }
      button:disabled { opacity: .65; cursor: not-allowed; }
      .error { margin: 0; color: #cc2d2d; font-weight: 600; min-height: 1.2em; }
      @media (max-width: 520px) { .login-card { padding: 26px 20px; border-radius: 20px; } .back-link { position: static; justify-self: start; display: inline-flex; margin-bottom: 16px; } }
    `,
  ],
})
export class LoginComponent implements OnInit {
  role: LoginRole = 'super_admin';
  busy = false;
  errorMessage = '';
  copy = ROLE_COPY[this.role];

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    orgCode: [''],
    password: ['', [Validators.required]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    const roleParam = (this.route.snapshot.queryParamMap.get('role') || 'super_admin') as LoginRole;
    this.role = roleParam in ROLE_COPY ? roleParam : 'super_admin';
    this.copy = ROLE_COPY[this.role];
    if (!this.copy.includeOrgCode) {
      this.form.controls.orgCode.setValue('');
      this.form.controls.orgCode.clearValidators();
      this.form.controls.orgCode.updateValueAndValidity();
    } else {
      this.form.controls.orgCode.setValidators([Validators.required]);
      this.form.controls.orgCode.updateValueAndValidity();
    }
  }

  async submit(): Promise<void> {
    if (this.form.invalid) return;

    this.busy = true;
    this.errorMessage = '';

    try {
      const { email, password, orgCode } = this.form.getRawValue();
      if (this.role === 'super_admin') {
        await this.auth.loginSuperAdmin(email, password);
        await this.router.navigate(['/super-admin/dashboard']);
      } else {
        await this.auth.loginOrgMember(this.role, email, password, orgCode || '');
        await this.router.navigate([`/${this.role}/dashboard`]);
      }
    } catch (error) {
      this.errorMessage = 'Login failed. Check your credentials and organization code.';
      console.error(error);
    } finally {
      this.busy = false;
    }
  }
}