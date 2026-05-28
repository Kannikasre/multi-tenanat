import { Component } from '@angular/core';

@Component({
  selector: 'app-landing',
  template: `
    <main class="landing">
      <section class="hero">
        <p class="eyebrow">Multi-tenant SaaS Platform</p>
        <h1>Select your role to access the dashboard</h1>
        <p class="subtitle">Choose a role below to continue into the right workspace.</p>
      </section>

      <section class="cards">
        <a class="role-card super" routerLink="/auth/login" [queryParams]="{ role: 'super_admin' }">
          <div class="icon blue">🛡</div>
          <h2>Super Admin</h2>
          <p class="role-subtitle">Full system access</p>
          <ul>
            <li>Manage Organizations</li>
            <li>Manage Admins & Users</li>
            <li>Full CRUD Operations</li>
          </ul>
          <span class="button blue">Login as Super Admin</span>
        </a>

        <a class="role-card admin" routerLink="/auth/login" [queryParams]="{ role: 'org_admin' }">
          <div class="icon green">👥</div>
          <h2>Admin</h2>
          <p class="role-subtitle">Organization management</p>
          <ul>
            <li>Manage Users</li>
            <li>Assign Tasks</li>
            <li>Update Tasks</li>
          </ul>
          <span class="button green">Login as Admin</span>
        </a>

        <a class="role-card user" routerLink="/auth/login" [queryParams]="{ role: 'user' }">
          <div class="icon orange">👤</div>
          <h2>User</h2>
          <p class="role-subtitle">Task execution</p>
          <ul>
            <li>View Tasks</li>
            <li>Update Task Status</li>
            <li>Mark Completed</li>
          </ul>
          <span class="button orange">Login as User</span>
        </a>
      </section>
    </main>
  `,
  styles: [
    `
      :host { display: block; min-height: 100vh; }
      .landing { min-height: 100vh; display: flex; flex-direction: column; align-items: center; gap: 42px; padding: 72px 24px 64px; background: radial-gradient(circle at top, #ffffff 0%, #eef3f9 45%, #eef3f9 100%); color: var(--text); }
      .hero { text-align: center; max-width: 760px; }
      .eyebrow { font-size: 38px; font-weight: 800; margin: 0 0 12px; letter-spacing: -0.03em; }
      h1 { margin: 0; font-size: 18px; font-weight: 500; color: var(--muted); }
      .subtitle { margin: 8px 0 0; color: var(--muted); }
      .cards { width: min(1170px, 100%); display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
      .role-card { background: rgba(255,255,255,.96); border: 1px solid rgba(148,163,184,.16); border-radius: 18px; box-shadow: var(--shadow); padding: 28px 28px 30px; text-decoration: none; color: inherit; display: flex; flex-direction: column; align-items: center; min-height: 340px; transition: transform .18s ease, box-shadow .18s ease; }
      .role-card:hover { transform: translateY(-3px); box-shadow: 0 24px 70px rgba(15,23,42,.16); }
      .icon { width: 74px; height: 74px; border-radius: 50%; display: grid; place-items: center; font-size: 30px; margin-bottom: 18px; }
      .blue { background: #dbeafe; color: #2563eb; }
      .green { background: #dcfce7; color: #16a34a; }
      .orange { background: #ffedd5; color: #f97316; }
      h2 { margin: 0; font-size: 22px; }
      .role-subtitle { margin: 8px 0 10px; color: var(--muted); }
      ul { margin: 0 0 26px; padding-left: 20px; color: #5d718d; line-height: 1.7; }
      .button { margin-top: auto; display: inline-flex; align-items: center; justify-content: center; width: 100%; max-width: 200px; padding: 13px 18px; border-radius: 10px; color: #fff; font-weight: 700; }
      .button.blue { background: #3274ff; }
      .button.green { background: #16c55d; }
      .button.orange { background: #ff7a1a; }
      @media (max-width: 980px) { .cards { grid-template-columns: 1fr; } .hero { padding-top: 0; } .eyebrow { font-size: 28px; } }
    `,
  ],
})
export class LandingComponent {}