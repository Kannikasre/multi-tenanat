import { Component } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  template: `
    <nav class="sidebar-nav">
      <ul>
        <li><a href="#/super-admin/dashboard">Super Admin</a></li>
        <li><a href="#/org-admin/dashboard">Org Admin</a></li>
        <li><a href="#/user/dashboard">User</a></li>
      </ul>
    </nav>
  `,
  styles: [":host{display:block;padding:8px} .sidebar-nav ul{list-style:none;padding:0} .sidebar-nav li{margin:8px 0}"],
})
export class SidebarComponent {}
