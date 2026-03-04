import { h } from '@/utils/dom-utils';
import { onReady, isCollabEnabled } from '@/stdb/client';
import { subscribeCollaboration } from '@/stdb/subscriptions';
import { CollabChat } from './CollabChat';
import { AlertTriage } from './AlertTriage';

export class CollabOverlay {
  private chatPanel: CollabChat | null = null;
  private triagePanel: AlertTriage | null = null;
  private chatBtn: HTMLButtonElement;
  private triageBtn: HTMLButtonElement;
  private overlay: HTMLElement;
  private chatVisible = false;
  private triageVisible = false;

  constructor(userId: string, displayName: string) {
    this.chatBtn = h('button', {
      class: 'collab-toggle-btn',
      title: 'Room Chat',
      id: 'collabChatToggle',
    }, '💬') as HTMLButtonElement;

    this.triageBtn = h('button', {
      class: 'collab-toggle-btn',
      title: 'Alert Triage',
      id: 'collabTriageToggle',
    }, '🔔') as HTMLButtonElement;

    this.overlay = h('div', { class: 'collab-overlay', id: 'collabOverlay' });

    if (!isCollabEnabled()) return;

    onReady((conn) => {
      subscribeCollaboration(conn);

      this.chatPanel = new CollabChat(conn, 'global', userId, displayName);
      this.triagePanel = new AlertTriage(conn, userId);

      this.chatPanel.hide();
      this.triagePanel.hide();

      this.overlay.appendChild(this.chatPanel.element);
      this.overlay.appendChild(this.triagePanel.element);

      this.chatBtn.addEventListener('click', () => this.toggleChat());
      this.triageBtn.addEventListener('click', () => this.toggleTriage());
    });
  }

  mount(headerMount: HTMLElement, bodyMount: HTMLElement): void {
    if (!isCollabEnabled()) return;
    headerMount.appendChild(this.triageBtn);
    headerMount.appendChild(this.chatBtn);
    bodyMount.appendChild(this.overlay);
  }

  private toggleChat(): void {
    this.chatVisible = !this.chatVisible;
    this.chatVisible ? this.chatPanel?.show() : this.chatPanel?.hide();
    this.chatBtn.classList.toggle('active', this.chatVisible);
  }

  private toggleTriage(): void {
    this.triageVisible = !this.triageVisible;
    this.triageVisible ? this.triagePanel?.show() : this.triagePanel?.hide();
    this.triageBtn.classList.toggle('active', this.triageVisible);
  }
}
