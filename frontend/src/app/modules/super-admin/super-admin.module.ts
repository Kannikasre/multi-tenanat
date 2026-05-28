import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { AuthGuard } from '../../core/guards/auth.guard';
import { RoleGuard } from '../../core/guards/role.guard';
import { DashboardLayoutComponent } from '../../shared/components/dashboard-layout/dashboard-layout.component';

import { SuperAdminDashboardComponent } from './dashboard/dashboard.component';

const routes: Routes = [
  {
    path: '',
    component: DashboardLayoutComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['super_admin'] },
    children: [{ path: 'dashboard', component: SuperAdminDashboardComponent }, { path: '', redirectTo: 'dashboard', pathMatch: 'full' }],
  },
];

@NgModule({
  declarations: [SuperAdminDashboardComponent],
  imports: [CommonModule, FormsModule, SharedModule, RouterModule.forChild(routes)],
})
export class SuperAdminModule {}
