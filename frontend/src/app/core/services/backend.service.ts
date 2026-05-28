import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiService } from './api.service';

export interface OrganizationSummary {
  id: number;
  enterprise_id: number;
  name: string;
  schema_name: string;
  created_at?: string;
  is_active: boolean;
}

export interface TaskRecord {
  id: number;
  title: string;
  description?: string | null;
  status: string;
  task_date?: string | null;
  hours_spent?: number | null;
  user_id?: number;
  user_full_name?: string;
  user_email?: string;
  user_role?: string;
  organization?: OrganizationSummary;
}

export interface UserRecord {
  id: number;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at?: string;
  active_tasks?: number;
  completed_tasks?: number;
}

@Injectable({ providedIn: 'root' })
export class BackendService {
  constructor(private readonly api: ApiService) {}

  getOrganizations(): Promise<OrganizationSummary[]> {
    return firstValueFrom(this.api.get<OrganizationSummary[]>('/enterprise/organizations'));
  }

  createOrganization(name: string, orgAdminEmail: string): Promise<OrganizationSummary> {
    return firstValueFrom(this.api.post<OrganizationSummary>('/enterprise/organizations', { name, org_admin_email: orgAdminEmail }));
  }

  updateOrganization(orgId: number, payload: Record<string, unknown>): Promise<OrganizationSummary> {
    return firstValueFrom(this.api.put<OrganizationSummary>(`/enterprise/organizations/${orgId}`, payload));
  }

  deleteOrganization(orgId: number): Promise<{ message: string }> {
    return firstValueFrom(this.api.delete<{ message: string }>(`/enterprise/organizations/${orgId}`));
  }

  regenerateOrganizationCode(orgId: number, orgAdminEmail: string): Promise<{ message: string }> {
    return firstValueFrom(this.api.post<{ message: string }>(`/enterprise/organizations/${orgId}/org-code/regenerate`, { org_admin_email: orgAdminEmail }));
  }

  getOrgUsers(orgId: number): Promise<UserRecord[]> {
    return firstValueFrom(this.api.get<UserRecord[]>(`/orgs/${orgId}/users`));
  }

  createUser(orgId: number, payload: Record<string, unknown>): Promise<UserRecord> {
    return firstValueFrom(this.api.post<UserRecord>(`/orgs/${orgId}/users`, payload));
  }

  updateUser(orgId: number, userId: number, payload: Record<string, unknown>): Promise<UserRecord> {
    return firstValueFrom(this.api.put<UserRecord>(`/orgs/${orgId}/users/${userId}`, payload));
  }

  deleteUser(orgId: number, userId: number): Promise<{ message: string }> {
    return firstValueFrom(this.api.delete<{ message: string }>(`/orgs/${orgId}/users/${userId}`));
  }

  getMyTasks(): Promise<TaskRecord[]> {
    return firstValueFrom(this.api.get<TaskRecord[]>('/tasks/my'));
  }

  createTask(payload: Record<string, unknown>): Promise<TaskRecord> {
    return firstValueFrom(this.api.post<TaskRecord>('/tasks', payload));
  }

  updateTask(taskId: number, payload: Record<string, unknown>): Promise<TaskRecord> {
    return firstValueFrom(this.api.put<TaskRecord>(`/tasks/${taskId}`, payload));
  }

  getEnterpriseTasks(): Promise<TaskRecord[]> {
    return firstValueFrom(this.api.get<TaskRecord[]>('/enterprise/tasks'));
  }

  getOrganizationTasks(orgId: number): Promise<TaskRecord[]> {
    return firstValueFrom(this.api.get<TaskRecord[]>(`/orgs/${orgId}/tasks`));
  }
}