import { h, replaceChildren } from '@/utils/dom-utils';
import type { DbConnection } from '@/stdb/generated';
import type { EventContext } from '@/stdb/generated';
import { getAlertAssignments } from '@/stdb/subscriptions';
import type { AlertAssignment } from '@/stdb/subscriptions';

export class AlertTriage {
  private conn: DbConnection;
  private analystId: string;
  private assignments: AlertAssignment[] = [];
  readonly element: HTMLElement;
  private listEl: HTMLElement;

  constructor(conn: DbConnection, analystId: string) {
    this.conn = conn;
    this.analystId = analystId;

    this.listEl = h('div', { class: 'triage-list' });
    this.element = h('div', { class: 'alert-triage' },
      h('div', { class: 'triage-header' }, '🔔 Alert Triage'),
      this.listEl,
    );

    conn.db.alert_assignment.onInsert((_ctx: EventContext, a: AlertAssignment) => this.upsert(a));
    conn.db.alert_assignment.onUpdate((_ctx: EventContext, _old: AlertAssignment, a: AlertAssignment) => this.upsert(a));
    conn.db.alert_assignment.onDelete((_ctx: EventContext, a: AlertAssignment) => this.remove(a));

    this.assignments = getAlertAssignments(conn);
    this.render();
  }

  mount(container: HTMLElement): void {
    container.appendChild(this.element);
  }

  assignAlert(alertId: bigint, assignedTo: string, priority: number, notes: string): void {
    this.conn.reducers.assignAlert({ alertId, assignedTo, assignedBy: this.analystId, priority, notes });
  }

  private upsert(a: AlertAssignment): void {
    const idx = this.assignments.findIndex(x => x.alertId === a.alertId);
    if (idx >= 0) this.assignments[idx] = a;
    else this.assignments.push(a);
    this.render();
  }

  private remove(a: AlertAssignment): void {
    this.assignments = this.assignments.filter(x => x.alertId !== a.alertId);
    this.render();
  }

  private statusIcon(status: string): string {
    const map: Record<string, string> = {
      pending: '🟡', investigating: '🔵', resolved: '✅', dismissed: '⬜',
    };
    return map[status] ?? '❓';
  }

  private render(): void {
    if (this.assignments.length === 0) {
      replaceChildren(this.listEl, h('p', { class: 'empty-state' }, 'No alerts assigned'));
      return;
    }

    const sorted = [...this.assignments].sort((a, b) => b.priority - a.priority);
    const rows = sorted.map(a => {
      const done = a.status === 'resolved' || a.status === 'dismissed';
      const resolveBtn = h('button', { class: 'triage-btn resolve', title: 'Resolve' }, '✓');
      resolveBtn.addEventListener('click', () =>
        this.conn.reducers.resolveAlert({ alertId: a.alertId, status: 'resolved', notes: '' }));
      const dismissBtn = h('button', { class: 'triage-btn dismiss', title: 'Dismiss' }, '✕');
      dismissBtn.addEventListener('click', () =>
        this.conn.reducers.resolveAlert({ alertId: a.alertId, status: 'dismissed', notes: '' }));

      return h('div', { class: `triage-row${a.assignedTo === this.analystId ? ' mine' : ''}` },
        h('span', { class: 'triage-icon' }, this.statusIcon(a.status)),
        h('span', { class: 'triage-assignee' }, a.assignedTo || '—'),
        h('span', { class: 'triage-notes' }, a.notes || ''),
        h('span', { class: 'triage-priority' }, `P${a.priority}`),
        ...(done ? [] : [resolveBtn, dismissBtn]),
      );
    });
    replaceChildren(this.listEl, ...rows);
  }

  show(): void { this.element.classList.remove('hidden'); }
  hide(): void { this.element.classList.add('hidden'); }
}
