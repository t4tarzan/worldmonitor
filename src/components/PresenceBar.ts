import { h, replaceChildren } from '@/utils/dom-utils';
import type { AnalystSession } from '@/stdb/subscriptions';

interface PresenceBarOptions {
  onCursorHover?: (session: AnalystSession) => void;
}

export class PresenceBar {
  private el: HTMLElement;
  private sessions: Map<string, AnalystSession> = new Map();
  private opts: PresenceBarOptions;

  constructor(opts: PresenceBarOptions = {}) {
    this.opts = opts;
    this.el = h('div', { class: 'presence-bar', role: 'status', 'aria-label': 'Online analysts' });
  }

  mount(container: HTMLElement): void {
    container.appendChild(this.el);
  }

  upsert(session: AnalystSession): void {
    this.sessions.set(session.identity.toHexString?.() ?? String(session.identity), session);
    this.render();
  }

  remove(session: AnalystSession): void {
    this.sessions.delete(session.identity.toHexString?.() ?? String(session.identity));
    this.render();
  }

  private render(): void {
    const count = this.sessions.size;
    if (count === 0) {
      replaceChildren(this.el);
      this.el.classList.add('hidden');
      return;
    }
    this.el.classList.remove('hidden');

    const avatars = [...this.sessions.values()].slice(0, 8).map(s => {
      const initials = s.displayName
        .split(' ')
        .map(w => w[0] ?? '')
        .join('')
        .toUpperCase()
        .slice(0, 2);
      const avatar = h('button', {
        class: 'presence-avatar',
        style: `background:${s.color};`,
        title: `${s.displayName} · ${s.variant}`,
        'aria-label': s.displayName,
      }, initials);
      avatar.addEventListener('mouseenter', () => this.opts.onCursorHover?.(s));
      return avatar;
    });

    const overflow = count > 8
      ? [h('span', { class: 'presence-overflow' }, `+${count - 8}`)]
      : [];

    const label = h('span', { class: 'presence-label' }, `${count} online`);
    replaceChildren(this.el, ...avatars, ...overflow, label);
  }

  getElement(): HTMLElement {
    return this.el;
  }
}
