import { Component } from '@angular/core';

@Component({
  selector: 'app-org-admin-dashboard',
  template: `
    <div class="grid">
      <app-dashboard-card title="Total Users">120</app-dashboard-card>
      <app-dashboard-card title="Pending Tasks">24</app-dashboard-card>
      <app-dashboard-card title="Completed Tasks">1,032</app-dashboard-card>
    </div>
  `,
  styles: ['.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px}'],
})
export class OrgAdminDashboardComponent {}
