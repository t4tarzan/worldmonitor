import { h, replaceChildren } from '@/utils/dom-utils';
import type { DbConnection } from '@/stdb/generated';
import type { EventContext } from '@/stdb/generated';
import { subscribeAgents, getAgents, getFindings } from '@/stdb/subscriptions';
import type { Agent, AgentFinding } from '@/stdb/subscriptions';

export class AgentDashboard {
  readonly element: HTMLElement;
  private conn: DbConnection;
  private agents: Agent[] = [];
  private findings: AgentFinding[] = [];
  private agentListEl: HTMLElement;
  private findingsEl: HTMLElement;

  constructor(conn: DbConnection) {
    this.conn = conn;

    this.agentListEl = h('div', { class: 'agent-list' });
    this.findingsEl = h('div', { class: 'findings-list' });

    this.element = h('div', { class: 'agent-dashboard' },
      h('div', { class: 'agent-dashboard-header' }, '🤖 Agent Dashboard'),
      h('section', { class: 'agent-section' },
        h('h4', { class: 'agent-section-title' }, 'Registered Agents'),
        this.agentListEl,
      ),
      h('section', { class: 'agent-section' },
        h('h4', { class: 'agent-section-title' }, 'Findings'),
        this.findingsEl,
      ),
    );

    subscribeAgents(conn);

    conn.db.agent.onInsert((_ctx: EventContext, a: Agent) => this.upsertAgent(a));
    conn.db.agent.onUpdate((_ctx: EventContext, _old: Agent, a: Agent) => this.upsertAgent(a));

    conn.db.agent_finding.onInsert((_ctx: EventContext, f: AgentFinding) => {
      this.findings.unshift(f);
      if (this.findings.length > 100) this.findings.pop();
      this.renderFindings();
    });
    conn.db.agent_finding.onUpdate((_ctx: EventContext, _old: AgentFinding, f: AgentFinding) => {
      const idx = this.findings.findIndex(x => x.findingId === f.findingId);
      if (idx >= 0) this.findings[idx] = f;
      this.renderFindings();
    });

    this.agents = getAgents(conn);
    this.findings = getFindings(conn).slice(0, 100);
    this.renderAgents();
    this.renderFindings();
  }

  mount(container: HTMLElement): void {
    container.appendChild(this.element);
  }

  private upsertAgent(a: Agent): void {
    const idx = this.agents.findIndex(x => x.agentId === a.agentId);
    if (idx >= 0) this.agents[idx] = a;
    else this.agents.push(a);
    this.renderAgents();
  }

  private statusDot(status: string): string {
    return status === 'active' ? '🟢' : status === 'paused' ? '🟡' : '🔴';
  }

  private severityLabel(sev: number): string {
    return ['', 'INFO', 'LOW', 'MED', 'HIGH', 'CRIT'][sev] ?? '?';
  }

  private severityClass(sev: number): string {
    return ['', 'sev-info', 'sev-low', 'sev-med', 'sev-high', 'sev-crit'][sev] ?? '';
  }

  private renderAgents(): void {
    if (this.agents.length === 0) {
      replaceChildren(this.agentListEl, h('p', { class: 'empty-state' }, 'No agents registered'));
      return;
    }
    const rows = this.agents.map(a => {
      const toggleBtn = h('button', {
        class: 'agent-toggle-btn',
        title: a.status === 'active' ? 'Pause' : 'Resume',
      }, a.status === 'active' ? '⏸' : '▶');
      toggleBtn.addEventListener('click', () =>
        this.conn.reducers.setAgentStatus({ agentId: a.agentId, status: a.status === 'active' ? 'paused' : 'active' }));
      return h('div', { class: `agent-row ${a.status}` },
        h('span', { class: 'agent-dot' }, this.statusDot(a.status)),
        h('span', { class: 'agent-id' }, a.agentId),
        h('span', { class: 'agent-type' }, a.agentType),
        h('span', { class: 'agent-findings' }, `${a.findingsCount} findings`),
        toggleBtn,
      );
    });
    replaceChildren(this.agentListEl, ...rows);
  }

  private renderFindings(): void {
    if (this.findings.length === 0) {
      replaceChildren(this.findingsEl, h('p', { class: 'empty-state' }, 'No findings yet'));
      return;
    }
    const rows = this.findings.map(f => {
      const ackBtn = h('button', {
        class: `finding-ack-btn${f.acknowledged ? ' done' : ''}`,
        title: f.acknowledged ? 'Acknowledged' : 'Acknowledge',
        disabled: f.acknowledged ? '' : undefined,
      }, f.acknowledged ? '✓' : 'ACK');
      if (!f.acknowledged) {
        ackBtn.addEventListener('click', () =>
          this.conn.reducers.acknowledgeFinding({ findingId: f.findingId }));
      }
      return h('div', { class: `finding-row${f.acknowledged ? ' acked' : ''}` },
        h('span', { class: `finding-sev ${this.severityClass(f.severity)}` }, this.severityLabel(f.severity)),
        h('span', { class: 'finding-agent' }, f.agentId),
        h('div', { class: 'finding-title' }, f.title),
        h('div', { class: 'finding-desc' }, f.description),
        h('span', { class: 'finding-conf' }, `${Math.round(Number(f.confidence) * 100)}%`),
        ackBtn,
      );
    });
    replaceChildren(this.findingsEl, ...rows);
  }

  show(): void { this.element.classList.remove('hidden'); }
  hide(): void { this.element.classList.add('hidden'); }
}
