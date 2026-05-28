import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { DashboardLayoutComponent } from './components/dashboard-layout/dashboard-layout.component';
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';
import { DashboardCardComponent } from './components/dashboard-card/dashboard-card.component';

@NgModule({
  declarations: [DashboardLayoutComponent, LoadingSpinnerComponent, DashboardCardComponent],
  imports: [CommonModule, RouterModule],
  exports: [DashboardLayoutComponent, LoadingSpinnerComponent, DashboardCardComponent],
})
export class SharedModule {}
