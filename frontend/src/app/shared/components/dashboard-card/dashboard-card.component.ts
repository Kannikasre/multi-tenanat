import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-dashboard-card',
  template: `
    <article class="card" [ngClass]="tone">
      <div class="card-header">
        <div>
          <p class="label">{{ label }}</p>
          <h3>{{ title }}</h3>
        </div>
        <div class="badge" *ngIf="badge">{{ badge }}</div>
      </div>
      <div class="value"><ng-content></ng-content></div>
      <p class="caption" *ngIf="caption">{{ caption }}</p>
    </article>
  `,
  styles: [
    `
      .card { background: #fff; border: 1px solid rgba(148,163,184,.18); border-radius: 18px; box-shadow: 0 18px 40px rgba(15,23,42,.06); padding: 22px; }
      .card-header { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
      .label { margin: 0 0 6px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); }
      h3 { margin: 0; font-size: 18px; color: var(--text); }
      .value { margin-top: 14px; color: var(--text); }
      .caption { margin: 12px 0 0; color: var(--muted); font-size: 13px; }
      .badge { font-size: 12px; font-weight: 700; border-radius: 999px; padding: 7px 11px; background: rgba(36,107,255,.12); color: #246bff; }
      .tone-blue .badge { background: rgba(36,107,255,.12); color: #246bff; }
      .tone-green .badge { background: rgba(22,197,93,.12); color: #16c55d; }
      .tone-orange .badge { background: rgba(255,122,26,.12); color: #ff7a1a; }
    `,
  ],
})
export class DashboardCardComponent {
  @Input() title = '';
  @Input() label = '';
  @Input() caption = '';
  @Input() badge = '';
  @Input() tone: 'tone-blue' | 'tone-green' | 'tone-orange' = 'tone-blue';
}