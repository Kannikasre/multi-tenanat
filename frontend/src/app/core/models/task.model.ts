export interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  assignee_id?: number;
  org_id?: number;
  created_at?: string;
}
