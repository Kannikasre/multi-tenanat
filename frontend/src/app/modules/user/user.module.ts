import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { UserDashboardComponent } from './dashboard/dashboard.component';

const routes: Routes = [{ path: 'dashboard', component: UserDashboardComponent }];

@NgModule({ declarations: [UserDashboardComponent], imports: [CommonModule, SharedModule, RouterModule.forChild(routes)] })
export class UserModule {}
