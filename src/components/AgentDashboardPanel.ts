import { Panel } from './Panel';
import { h, replaceChildren } from '@/utils/dom-utils';
import { onReady, isCollabEnabled } from '@/stdb/client';
import { AgentDashboard } from './AgentDashboard';

export class AgentDashboardPanel extends Panel {
  private dashboard: AgentDashboard | null = null;

  constructor() {
    super({ id: 'agent-dashboard', title: '🤖 Agent Dashboard', className: 'panel-wide' });

    if (!isCollabEnabled()) {
      replaceChildren(this.content,
        h('div', { class: 'empty-state' }, 'Enable VITE_COLLAB_ENABLED=true to activate.'),
      );
      return;
    }

    replaceChildren(this.content,
      h('div', { class: 'empty-state' }, 'Connecting to SpacetimeDB…'),
    );

    onReady((conn) => {
      this.dashboard = new AgentDashboard(conn);
      replaceChildren(this.content, this.dashboard.element);
    });
  }
}
