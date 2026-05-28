import { Component } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  template: `<div class="spinner"><mat-progress-spinner mode="indeterminate"></mat-progress-spinner></div>`,
  styles: [`.spinner{display:flex;justify-content:center;padding:16px}`],
})
export class LoadingSpinnerComponent {}
