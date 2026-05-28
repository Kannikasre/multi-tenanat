import { Component } from '@angular/core';

@Component({
  selector: 'app-navbar',
  template: `
    <header class="navbar">
      <button class="menu-btn" (click)="toggle()">☰</button>
      <span class="title">MultiTenant Task Management</span>
      <div class="spacer"></div>
      <button class="profile-btn">Profile</button>
    </header>
  `,
  styles: [`.spacer{flex:1} .title{font-weight:600} .navbar{display:flex;align-items:center;padding:12px;background:#0b3550;color:#fff}`],
})
export class NavbarComponent {
  toggle() {
    // placeholder for toggling sidebar via service
  }
}
