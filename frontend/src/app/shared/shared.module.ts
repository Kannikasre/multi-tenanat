import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';
import { DashboardCardComponent } from './components/dashboard-card/dashboard-card.component';

@NgModule({
  declarations: [LoadingSpinnerComponent, DashboardCardComponent],
  imports: [CommonModule, RouterModule, MatToolbarModule, MatIconModule, MatSidenavModule, MatListModule, MatCardModule, MatProgressSpinnerModule, MatButtonModule, MatDialogModule],
  exports: [
    LoadingSpinnerComponent,
    DashboardCardComponent,
    MatToolbarModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatDialogModule,
  ],
})
export class SharedModule {}
