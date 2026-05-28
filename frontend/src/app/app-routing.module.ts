import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LandingComponent } from './landing/landing.component';

const routes: Routes = [
  { path: '', component: LandingComponent },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then((m) => m.AuthModule),
  },
  {
    path: 'super-admin',
    loadChildren: () => import('./modules/super-admin/super-admin.module').then((m) => m.SuperAdminModule),
  },
  {
    path: 'org-admin',
    loadChildren: () => import('./modules/org-admin/org-admin.module').then((m) => m.OrgAdminModule),
  },
  {
    path: 'user',
    loadChildren: () => import('./modules/user/user.module').then((m) => m.UserModule),
  },
  { path: '**', redirectTo: '' },
];

@NgModule({ imports: [RouterModule.forRoot(routes)], exports: [RouterModule] })
export class AppRoutingModule {}
