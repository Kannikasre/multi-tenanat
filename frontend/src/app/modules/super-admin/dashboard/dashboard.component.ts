import { Component, OnInit } from '@angular/core';

import { AuthService } from '../../../core/services/auth.service';
import {
  BackendService,
  OrganizationSummary,
  TaskRecord,
  UserRecord,
} from '../../../core/services/backend.service';

interface OrgView extends OrganizationSummary {
  adminCount: number;
  userCount: number;
  taskCount: number;
}

interface DirectoryEntry {
  orgName: string;
  orgId: number;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
}

@Component({
  selector: 'app-super-admin-dashboard',
  template: `
    <section class="page" id="organizations">
      <header class="page-header">
        <div>
          <h1>Organizations</h1>
          <p>Manage all organizations in the system</p>
        </div>

        <button class="primary-button" (click)="toggleCreateForm()">+ Create Organization</button>
      </header>

      <div class="stats-grid">
        <app-dashboard-card label="Overview" title="Organizations" badge="live" tone="tone-blue">{{ organizations.length }}</app-dashboard-card>
        <app-dashboard-card label="Overview" title="Admins" badge="users" tone="tone-green">{{ adminDirectory.length }}</app-dashboard-card>
        <app-dashboard-card label="Overview" title="Users" badge="users" tone="tone-orange">{{ userDirectory.length }}</app-dashboard-card>
      </div>

      <div class="panel create-panel" *ngIf="showCreateForm">
        <div class="panel-head">
          <h2>Create organization</h2>
          <p>Send the organization code directly to the admin email after creation.</p>
        </div>

        <div class="form-grid">
          <label>
            <span>Organization name</span>
            <input [(ngModel)]="createName" placeholder="Acme Corporation" />
          </label>

          <label>
            <span>Admin email</span>
            <input [(ngModel)]="createAdminEmail" placeholder="admin@acme.com" />
          </label>
        </div>

        <div class="form-actions">
          <button class="secondary-button" type="button" (click)="toggleCreateForm()">Cancel</button>
          <button class="primary-button" type="button" (click)="createOrganization()" [disabled]="!createName || !createAdminEmail || busy">Create</button>
        </div>
      </div>

      <div class="org-grid">
        <article class="org-card" *ngFor="let org of organizations">
          <div class="card-top">
            <div class="org-icon">🏢</div>
            <span class="status" [class.active]="org.is_active">{{ org.is_active ? 'active' : 'inactive' }}</span>
          </div>

          <h3>{{ org.name }}</h3>

          <dl>
            <div><dt>Admins:</dt><dd>{{ org.adminCount }}</dd></div>
            <div><dt>Users:</dt><dd>{{ org.userCount }}</dd></div>
            <div><dt>Tasks:</dt><dd>{{ org.taskCount }}</dd></div>
          </dl>

          <div class="action-row">
            <button class="ghost-button blue" (click)="renameOrganization(org)">Edit</button>
            <button class="ghost-button red" (click)="deactivateOrganization(org)">Delete</button>
          </div>
        </article>
      </div>
    </section>

    <section class="page secondary" id="admins">
      <header class="section-header">
        <div>
          <h2>Admins</h2>
          <p>Organization-level administrators grouped by organization</p>
        </div>
      </header>

      <div class="list-card" *ngFor="let admin of adminDirectory">
        <div>
          <strong>{{ admin.full_name }}</strong>
          <p>{{ admin.email }}</p>
        </div>
        <span>{{ admin.orgName }}</span>
      </div>
    </section>

    <section class="page secondary" id="users">
      <header class="section-header">
        <div>
          <h2>Users</h2>
          <p>All tenant users across organizations</p>
        </div>
      </header>

      <div class="list-card" *ngFor="let user of userDirectory">
        <div>
          <strong>{{ user.full_name }}</strong>
          <p>{{ user.email }}</p>
        </div>
        <span>{{ user.orgName }}</span>
      </div>
    </section>

    <app-loading-spinner *ngIf="loading"></app-loading-spinner>
  `,
  styles: [
    `
      .page { display: grid; gap: 18px; margin-bottom: 28px; }
      .page-header, .section-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; }
      h1, h2, h3, p { margin: 0; }
      h1 { font-size: 28px; }
      .page-header p, .section-header p { color: var(--muted); margin-top: 6px; }
      .primary-button, .secondary-button, .ghost-button { border: 0; border-radius: 10px; padding: 12px 16px; font-weight: 700; cursor: pointer; }
      .primary-button { background: #246bff; color: #fff; box-shadow: 0 12px 24px rgba(36,107,255,.25); }
      .secondary-button { background: #e8eef9; color: var(--text); }
      .stats-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
      .panel, .org-card, .list-card { background: #fff; border: 1px solid rgba(148,163,184,.18); border-radius: 18px; box-shadow: 0 18px 40px rgba(15,23,42,.06); }
      .create-panel { padding: 20px; display: grid; gap: 16px; }
      .panel-head p { color: var(--muted); margin-top: 4px; }
      .form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
      label { display: grid; gap: 8px; color: #25344f; font-weight: 600; }
      input { border: 1px solid rgba(148,163,184,.3); border-radius: 12px; padding: 12px 14px; font: inherit; }
      .form-actions { display: flex; justify-content: flex-end; gap: 10px; }
      .org-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
      .org-card { padding: 18px; display: grid; gap: 14px; }
      .card-top { display: flex; justify-content: space-between; align-items: flex-start; }
      .org-icon { width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center; background: #dbeafe; color: #246bff; font-size: 20px; }
      .status { font-size: 12px; border-radius: 999px; padding: 6px 10px; background: #fde68a; color: #8a5b00; font-weight: 700; }
      .status.active { background: #dcfce7; color: #15803d; }
      dl { display: grid; gap: 8px; margin: 0; }
      dl div { display: flex; justify-content: space-between; gap: 16px; color: #334155; }
      dt, dd { margin: 0; }
      .action-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      .ghost-button { background: #eff6ff; color: #246bff; }
      .ghost-button.red { background: #fff1f2; color: #ef4444; }
      .list-card { padding: 16px 18px; display: flex; align-items: center; justify-content: space-between; gap: 18px; }
      .list-card p { color: var(--muted); margin-top: 4px; }
      .secondary { margin-top: 10px; }
      @media (max-width: 1100px) { .org-grid, .stats-grid, .form-grid { grid-template-columns: 1fr; } .page-header, .section-header { align-items: start; flex-direction: column; } }
    `,
  ],
})
export class SuperAdminDashboardComponent implements OnInit {
  loading = true;
  busy = false;
  showCreateForm = false;
  createName = '';
  createAdminEmail = '';
  organizations: OrgView[] = [];
  adminDirectory: DirectoryEntry[] = [];
  userDirectory: DirectoryEntry[] = [];

  constructor(private readonly backend: BackendService, private readonly auth: AuthService) {}

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading = true;
    try {
      const organizations = await this.backend.getOrganizations();
      const orgViews: OrgView[] = [];
      const admins: DirectoryEntry[] = [];
      const users: DirectoryEntry[] = [];

      for (const organization of organizations) {
        const orgUsers = await this.backend.getOrgUsers(organization.id);
        const orgTasks = await this.backend.getOrganizationTasks(organization.id);
        orgViews.push({
          ...organization,
          adminCount: orgUsers.filter((user) => user.role === 'org_admin').length,
          userCount: orgUsers.filter((user) => user.role === 'user').length,
          taskCount: orgTasks.length,
        });

        orgUsers.forEach((user) => {
          const entry = { ...user, orgName: organization.name, orgId: organization.id };
          if (user.role === 'org_admin') {
            admins.push(entry);
          }
          if (user.role === 'user') {
            users.push(entry);
          }
        });
      }

      this.organizations = orgViews;
      this.adminDirectory = admins;
      this.userDirectory = users;
    } catch (error) {
      console.error(error);
    } finally {
      this.loading = false;
    }
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.createName = '';
      this.createAdminEmail = '';
    }
  }

  async createOrganization(): Promise<void> {
    if (!this.createName || !this.createAdminEmail) return;
    this.busy = true;
    try {
      await this.backend.createOrganization(this.createName.trim(), this.createAdminEmail.trim());
      this.toggleCreateForm();
      await this.load();
    } catch (error) {
      console.error(error);
    } finally {
      this.busy = false;
    }
  }

  async renameOrganization(org: OrgView): Promise<void> {
    const name = window.prompt('New organization name', org.name);
    if (!name || !name.trim()) return;
    await this.backend.updateOrganization(org.id, { name: name.trim() });
    await this.load();
  }

  async deactivateOrganization(org: OrgView): Promise<void> {
    if (!window.confirm(`Deactivate ${org.name}?`)) return;
    await this.backend.deleteOrganization(org.id);
    await this.load();
  }
}