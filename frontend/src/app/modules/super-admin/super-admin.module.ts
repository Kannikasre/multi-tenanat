import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { SharedModule } from '../../shared/shared.module';

import { SuperAdminDashboardComponent } from './dashboard/dashboard.component';

const routes: Routes = [{ path: 'dashboard', component: SuperAdminDashboardComponent }];

@NgModule({
  declarations: [SuperAdminDashboardComponent],
  imports: [CommonModule, SharedModule, MatCardModule, RouterModule.forChild(routes)],
})
export class SuperAdminModule {}
