import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-dashboard-card',
  template: `
    <mat-card>
      <mat-card-title>{{title}}</mat-card-title>
      <mat-card-content><ng-content></ng-content></mat-card-content>
    </mat-card>
  `,
})
export class DashboardCardComponent {
  @Input() title = '';
}
