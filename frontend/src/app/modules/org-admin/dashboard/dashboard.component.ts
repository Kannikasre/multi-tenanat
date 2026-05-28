import { Component, OnInit } from '@angular/core';

import { AuthService } from '../../../core/services/auth.service';
import { BackendService, TaskRecord, UserRecord } from '../../../core/services/backend.service';

interface UserView extends UserRecord {
  activeTaskCount: number;
  completedTaskCount: number;
}

@Component({
  selector: 'app-org-admin-dashboard',
  template: `
    <section class="page" id="users">
      <header class="page-header">
        <div>
          <h1>Users</h1>
          <p>Manage users in your organization</p>
        </div>

        <button class="primary-button" (click)="toggleCreateForm()">+ Add User</button>
      </header>

      <div class="stats-grid">
        <app-dashboard-card label="Team" title="Users" badge="live" tone="tone-green">{{ users.length }}</app-dashboard-card>
        <app-dashboard-card label="Team" title="Active Tasks" badge="today" tone="tone-orange">{{ activeTasks }}</app-dashboard-card>
        <app-dashboard-card label="Team" title="Completed" badge="done" tone="tone-blue">{{ completedTasks }}</app-dashboard-card>
      </div>

      <div class="panel create-panel" *ngIf="showCreateForm">
        <div class="panel-head">
          <h2>Create user</h2>
          <p>Add a new organization member or org admin.</p>
        </div>

        <div class="form-grid">
          <label>
            <span>Full name</span>
            <input [(ngModel)]="createFullName" placeholder="Alice Brown" />
          </label>

          <label>
            <span>Email</span>
            <input [(ngModel)]="createEmail" placeholder="alice@company.com" />
          </label>

          <label>
            <span>Password</span>
            <input [(ngModel)]="createPassword" placeholder="Temporary password" type="password" />
          </label>

          <label>
            <span>Role</span>
            <select [(ngModel)]="createRole">
              <option value="user">User</option>
              <option value="org_admin">Admin</option>
            </select>
          </label>
        </div>

        <div class="form-actions">
          <button class="secondary-button" type="button" (click)="toggleCreateForm()">Cancel</button>
          <button class="primary-button" type="button" (click)="createUser()" [disabled]="!createFullName || !createEmail || !createPassword || busy">Create</button>
        </div>
      </div>

      <div class="user-grid">
        <article class="user-card" *ngFor="let user of users">
          <div class="card-top">
            <div class="avatar">👥</div>
            <span class="role-chip" [class.admin]="user.role === 'org_admin'">{{ user.role === 'org_admin' ? 'Admin' : 'User' }}</span>
          </div>

          <h3>{{ user.full_name }}</h3>
          <p class="email">{{ user.email }}</p>

          <dl>
            <div><dt>Active Tasks:</dt><dd>{{ user.activeTaskCount }}</dd></div>
            <div><dt>Completed:</dt><dd>{{ user.completedTaskCount }}</dd></div>
          </dl>

          <div class="action-row">
            <button class="ghost-button green" (click)="editUser(user)">Edit</button>
            <button class="ghost-button red" (click)="deleteUser(user)">Delete</button>
          </div>
        </article>
      </div>
    </section>

    <section class="page secondary" id="tasks">
      <header class="section-header">
        <div>
          <h2>Tasks</h2>
          <p>Organization tasks and their current status</p>
        </div>
      </header>

      <div class="task-list">
        <article class="task-item" *ngFor="let task of tasks">
          <div>
            <div class="task-title">{{ task.title }}</div>
            <p>{{ task.description || 'No description provided' }}</p>
            <small *ngIf="task.user_full_name">Assigned to {{ task.user_full_name }}</small>
          </div>

          <div class="task-actions">
            <span class="status" [class.pending]="task.status === 'pending'" [class.progress]="task.status === 'in_progress'" [class.done]="task.status === 'completed'">
              {{ task.status }}
            </span>
            <button class="ghost-button blue" (click)="setTaskStatus(task, 'pending')">Pending</button>
            <button class="ghost-button blue" (click)="setTaskStatus(task, 'in_progress')">In Progress</button>
            <button class="ghost-button green" (click)="setTaskStatus(task, 'completed')">Complete</button>
          </div>
        </article>
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
      .primary-button { background: #16c55d; color: #fff; box-shadow: 0 12px 24px rgba(22,197,93,.25); }
      .secondary-button { background: #e8eef9; color: var(--text); }
      .stats-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
      .panel, .user-card, .task-item { background: #fff; border: 1px solid rgba(148,163,184,.18); border-radius: 18px; box-shadow: 0 18px 40px rgba(15,23,42,.06); }
      .create-panel { padding: 20px; display: grid; gap: 16px; }
      .panel-head p { color: var(--muted); margin-top: 4px; }
      .form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
      label { display: grid; gap: 8px; color: #25344f; font-weight: 600; }
      input, select { border: 1px solid rgba(148,163,184,.3); border-radius: 12px; padding: 12px 14px; font: inherit; background: #fff; }
      .form-actions { display: flex; justify-content: flex-end; gap: 10px; }
      .user-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 18px; }
      .user-card { padding: 18px; display: grid; gap: 14px; }
      .card-top { display: flex; justify-content: space-between; align-items: flex-start; }
      .avatar { width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center; background: #dcfce7; color: #16c55d; font-size: 20px; }
      .role-chip, .status { font-size: 12px; border-radius: 999px; padding: 6px 10px; background: #e5efff; color: #246bff; font-weight: 700; }
      .role-chip.admin { background: #dcfce7; color: #15803d; }
      .email { color: var(--muted); }
      dl { display: grid; gap: 8px; margin: 0; }
      dl div { display: flex; justify-content: space-between; gap: 16px; color: #334155; }
      dt, dd { margin: 0; }
      .action-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      .ghost-button { background: #eff6ff; color: #246bff; }
      .ghost-button.green { background: #ecfdf3; color: #16c55d; }
      .ghost-button.red { background: #fff1f2; color: #ef4444; }
      .task-list { display: grid; gap: 12px; }
      .task-item { padding: 18px; display: flex; align-items: center; justify-content: space-between; gap: 18px; }
      .task-title { font-weight: 700; font-size: 16px; margin-bottom: 6px; }
      .task-item p, .task-item small { color: var(--muted); }
      .task-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
      .status.pending { background: #fef3c7; color: #92400e; }
      .status.progress { background: #dbeafe; color: #246bff; }
      .status.done { background: #dcfce7; color: #15803d; }
      @media (max-width: 1100px) { .user-grid, .stats-grid, .form-grid { grid-template-columns: 1fr; } .task-item, .page-header, .section-header { align-items: start; flex-direction: column; } .task-actions { justify-content: start; } }
    `,
  ],
})
export class OrgAdminDashboardComponent implements OnInit {
  loading = true;
  busy = false;
  showCreateForm = false;
  createFullName = '';
  createEmail = '';
  createPassword = '';
  createRole: 'user' | 'org_admin' = 'user';
  users: UserView[] = [];
  tasks: TaskRecord[] = [];
  orgId: number | null = null;

  constructor(private readonly backend: BackendService, private readonly auth: AuthService) {}

  get activeTasks(): number {
    return this.tasks.filter((task) => task.status !== 'completed').length;
  }

  get completedTasks(): number {
    return this.tasks.filter((task) => task.status === 'completed').length;
  }

  ngOnInit(): void {
    this.orgId = this.auth.currentOrgId();
    void this.load();
  }

  async load(): Promise<void> {
    if (!this.orgId) return;
    this.loading = true;
    try {
      const [users, tasks] = await Promise.all([this.backend.getOrgUsers(this.orgId), this.backend.getOrganizationTasks(this.orgId)]);
      this.tasks = tasks;
      this.users = users.map((user) => ({
        ...user,
        activeTaskCount: tasks.filter((task) => task.user_id === user.id && task.status !== 'completed').length,
        completedTaskCount: tasks.filter((task) => task.user_id === user.id && task.status === 'completed').length,
      }));
    } catch (error) {
      console.error(error);
    } finally {
      this.loading = false;
    }
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.createFullName = '';
      this.createEmail = '';
      this.createPassword = '';
      this.createRole = 'user';
    }
  }

  async createUser(): Promise<void> {
    if (!this.orgId || !this.createFullName || !this.createEmail || !this.createPassword) return;
    this.busy = true;
    try {
      await this.backend.createUser(this.orgId, {
        full_name: this.createFullName.trim(),
        email: this.createEmail.trim(),
        password: this.createPassword,
        role: this.createRole,
      });
      this.toggleCreateForm();
      await this.load();
    } catch (error) {
      console.error(error);
    } finally {
      this.busy = false;
    }
  }

  async editUser(user: UserView): Promise<void> {
    if (!this.orgId) return;
    const name = window.prompt('Full name', user.full_name) || user.full_name;
    const email = window.prompt('Email', user.email) || user.email;
    const role = (window.prompt('Role (user or org_admin)', user.role) || user.role).toLowerCase();
    await this.backend.updateUser(this.orgId, user.id, { full_name: name, email, role });
    await this.load();
  }

  async deleteUser(user: UserView): Promise<void> {
    if (!this.orgId || !window.confirm(`Deactivate ${user.full_name}?`)) return;
    await this.backend.deleteUser(this.orgId, user.id);
    await this.load();
  }

  async setTaskStatus(task: TaskRecord, status: 'pending' | 'in_progress' | 'completed'): Promise<void> {
    await this.backend.updateTask(task.id, { status });
    await this.load();
  }
}