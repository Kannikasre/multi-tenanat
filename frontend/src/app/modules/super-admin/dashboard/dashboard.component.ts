import { Component } from '@angular/core';

@Component({
  selector: 'app-super-admin-dashboard',
  template: `
    <div class="grid">
      <app-dashboard-card title="Total Organizations">42</app-dashboard-card>
      <app-dashboard-card title="Total Users">512</app-dashboard-card>
      <app-dashboard-card title="Total Tasks">3,204</app-dashboard-card>
    </div>
  `,
  styles: ['.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px}'],
})
export class SuperAdminDashboardComponent {}
