import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { OrgAdminDashboardComponent } from './dashboard/dashboard.component';

const routes: Routes = [{ path: 'dashboard', component: OrgAdminDashboardComponent }];

@NgModule({ declarations: [OrgAdminDashboardComponent], imports: [CommonModule, SharedModule, RouterModule.forChild(routes)] })
export class OrgAdminModule {}
