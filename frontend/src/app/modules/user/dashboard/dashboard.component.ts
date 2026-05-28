import { Component } from '@angular/core';

@Component({
  selector: 'app-user-dashboard',
  template: `
    <div class="grid">
      <app-dashboard-card title="My Tasks">8</app-dashboard-card>
      <app-dashboard-card title="Pending">3</app-dashboard-card>
      <app-dashboard-card title="Completed">5</app-dashboard-card>
    </div>
  `,
  styles: ['.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px}'],
})
export class UserDashboardComponent {}
