import { Component } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  template: `
    <div class="spinner-wrap">
      <div class="spinner"></div>
    </div>
  `,
  styles: [
    `
      .spinner-wrap { display: flex; justify-content: center; padding: 18px; }
      .spinner { width: 34px; height: 34px; border-radius: 50%; border: 4px solid rgba(36,107,255,.14); border-top-color: #246bff; animation: spin .8s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }
    `,
  ],
})
export class LoadingSpinnerComponent {}