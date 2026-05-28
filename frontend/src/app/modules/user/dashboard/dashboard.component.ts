import { Component, OnInit } from '@angular/core';

import { BackendService, TaskRecord } from '../../../core/services/backend.service';

@Component({
  selector: 'app-user-dashboard',
  template: `
    <section class="page" id="tasks">
      <header class="page-header">
        <div>
          <h1>My Tasks</h1>
          <p>View and update your assigned tasks</p>
        </div>

        <button class="primary-button" (click)="toggleCreateForm()">+ New Task</button>
      </header>

      <div class="stats-grid">
        <app-dashboard-card label="Tasks" title="Active Tasks" badge="active" tone="tone-orange">{{ activeTasks }}</app-dashboard-card>
        <app-dashboard-card label="Tasks" title="In Progress" badge="working" tone="tone-blue">{{ inProgressTasks }}</app-dashboard-card>
        <app-dashboard-card label="Tasks" title="Completed" badge="done" tone="tone-green">{{ completedTasks }}</app-dashboard-card>
      </div>

      <div class="panel create-panel" *ngIf="showCreateForm">
        <div class="panel-head">
          <h2>Create task</h2>
          <p>Add a new personal task item.</p>
        </div>

        <div class="form-grid">
          <label>
            <span>Title</span>
            <input [(ngModel)]="createTitle" placeholder="Prepare monthly report" />
          </label>

          <label>
            <span>Task date</span>
            <input [(ngModel)]="createTaskDate" type="date" />
          </label>

          <label>
            <span>Hours spent</span>
            <input [(ngModel)]="createHoursSpent" type="number" min="0" step="0.25" />
          </label>

          <label>
            <span>Description</span>
            <input [(ngModel)]="createDescription" placeholder="Short description" />
          </label>
        </div>

        <div class="form-actions">
          <button class="secondary-button" type="button" (click)="toggleCreateForm()">Cancel</button>
          <button class="primary-button" type="button" (click)="createTask()" [disabled]="!createTitle || busy">Create</button>
        </div>
      </div>

      <div class="task-list">
        <article class="task-item" *ngFor="let task of tasks">
          <div>
            <div class="task-top">
              <h3>{{ task.title }}</h3>
              <span class="status" [class.pending]="task.status === 'pending'" [class.progress]="task.status === 'in_progress'" [class.done]="task.status === 'completed'">
                {{ task.status.replace('_', ' ') }}
              </span>
            </div>
            <p>{{ task.description || 'No description provided' }}</p>
            <small *ngIf="task.task_date">Due: {{ task.task_date }}</small>
          </div>

          <div class="task-actions">
            <button class="ghost-button blue" (click)="setStatus(task, 'pending')">Update Status</button>
            <button class="ghost-button orange" (click)="setStatus(task, 'in_progress')">Start Task</button>
            <button class="ghost-button green" (click)="setStatus(task, 'completed')">Mark Complete</button>
          </div>
        </article>
      </div>
    </section>

    <app-loading-spinner *ngIf="loading"></app-loading-spinner>
  `,
  styles: [
    `
      .page { display: grid; gap: 18px; }
      .page-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; }
      h1, h2, h3, p { margin: 0; }
      h1 { font-size: 28px; }
      .page-header p { color: var(--muted); margin-top: 6px; }
      .primary-button, .secondary-button, .ghost-button { border: 0; border-radius: 10px; padding: 12px 16px; font-weight: 700; cursor: pointer; }
      .primary-button { background: #ff7a1a; color: #fff; box-shadow: 0 12px 24px rgba(255,122,26,.25); }
      .secondary-button { background: #e8eef9; color: var(--text); }
      .stats-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
      .panel, .task-item { background: #fff; border: 1px solid rgba(148,163,184,.18); border-radius: 18px; box-shadow: 0 18px 40px rgba(15,23,42,.06); }
      .create-panel { padding: 20px; display: grid; gap: 16px; }
      .panel-head p { color: var(--muted); margin-top: 4px; }
      .form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
      label { display: grid; gap: 8px; color: #25344f; font-weight: 600; }
      input { border: 1px solid rgba(148,163,184,.3); border-radius: 12px; padding: 12px 14px; font: inherit; background: #fff; }
      .form-actions { display: flex; justify-content: flex-end; gap: 10px; }
      .task-list { display: grid; gap: 12px; }
      .task-item { padding: 18px; display: flex; justify-content: space-between; gap: 18px; }
      .task-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 6px; }
      .task-item p, .task-item small { color: var(--muted); }
      .task-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
      .status { font-size: 12px; border-radius: 999px; padding: 6px 10px; background: #e5efff; color: #246bff; font-weight: 700; white-space: nowrap; }
      .status.pending { background: #fef3c7; color: #92400e; }
      .status.progress { background: #dbeafe; color: #246bff; }
      .status.done { background: #dcfce7; color: #15803d; }
      .ghost-button { background: #eff6ff; color: #246bff; }
      .ghost-button.orange { background: #fff7ed; color: #ff7a1a; }
      .ghost-button.green { background: #ecfdf3; color: #16c55d; }
      @media (max-width: 1100px) { .stats-grid, .form-grid { grid-template-columns: 1fr; } .task-item, .page-header { flex-direction: column; align-items: start; } .task-actions { justify-content: start; } }
    `,
  ],
})
export class UserDashboardComponent implements OnInit {
  loading = true;
  busy = false;
  showCreateForm = false;
  createTitle = '';
  createDescription = '';
  createTaskDate = '';
  createHoursSpent = '';
  tasks: TaskRecord[] = [];

  constructor(private readonly backend: BackendService) {}

  get activeTasks(): number {
    return this.tasks.filter((task) => task.status !== 'completed').length;
  }

  get inProgressTasks(): number {
    return this.tasks.filter((task) => task.status === 'in_progress').length;
  }

  get completedTasks(): number {
    return this.tasks.filter((task) => task.status === 'completed').length;
  }

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading = true;
    try {
      this.tasks = await this.backend.getMyTasks();
    } catch (error) {
      console.error(error);
    } finally {
      this.loading = false;
    }
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.createTitle = '';
      this.createDescription = '';
      this.createTaskDate = '';
      this.createHoursSpent = '';
    }
  }

  async createTask(): Promise<void> {
    if (!this.createTitle) return;
    this.busy = true;
    try {
      await this.backend.createTask({
        title: this.createTitle.trim(),
        description: this.createDescription.trim(),
        task_date: this.createTaskDate || undefined,
        hours_spent: this.createHoursSpent || undefined,
      });
      this.toggleCreateForm();
      await this.load();
    } catch (error) {
      console.error(error);
    } finally {
      this.busy = false;
    }
  }

  async setStatus(task: TaskRecord, status: 'pending' | 'in_progress' | 'completed'): Promise<void> {
    await this.backend.updateTask(task.id, { status });
    await this.load();
  }
}