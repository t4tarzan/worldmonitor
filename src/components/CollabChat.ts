import { h, replaceChildren } from '@/utils/dom-utils';
import type { DbConnection } from '@/stdb/generated';
import type { EventContext } from '@/stdb/generated';
import { subscribeChat } from '@/stdb/subscriptions';
import type { ChatMessage } from '@/stdb/subscriptions';

export class CollabChat {
  private conn: DbConnection;
  private roomId: string;
  private authorId: string;
  private authorName: string;
  private messages: ChatMessage[] = [];
  readonly element: HTMLElement;
  private listEl: HTMLElement;
  private inputEl: HTMLInputElement;

  constructor(conn: DbConnection, roomId: string, authorId: string, authorName: string) {
    this.conn = conn;
    this.roomId = roomId;
    this.authorId = authorId;
    this.authorName = authorName;

    this.listEl = h('div', { class: 'chat-list' });
    this.inputEl = h('input', {
      type: 'text',
      class: 'chat-input',
      placeholder: 'Message room…',
      maxlength: '500',
    }) as HTMLInputElement;

    this.inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.send();
    });

    const sendBtn = h('button', { class: 'chat-send-btn', title: 'Send' }, '→');
    sendBtn.addEventListener('click', () => this.send());

    this.element = h('div', { class: 'collab-chat' },
      h('div', { class: 'collab-chat-header' }, '💬 Room Chat'),
      this.listEl,
      h('div', { class: 'chat-input-row' }, this.inputEl, sendBtn),
    );

    subscribeChat(conn, roomId);
    conn.db.chat_message.onInsert((_ctx: EventContext, msg: ChatMessage) => {
      if (msg.roomId === this.roomId) this.push(msg);
    });
  }

  mount(container: HTMLElement): void {
    container.appendChild(this.element);
  }

  private push(msg: ChatMessage): void {
    this.messages.push(msg);
    if (this.messages.length > 200) this.messages.shift();
    this.renderMessages();
  }

  private renderMessages(): void {
    const items = this.messages.map(m => {
      const isMine = m.authorId === this.authorId;
      return h('div', { class: `chat-msg${isMine ? ' mine' : ''}` },
        h('span', { class: 'chat-author' }, m.authorName),
        h('span', { class: 'chat-text' }, m.text),
      );
    });
    replaceChildren(this.listEl, ...items);
    this.listEl.scrollTop = this.listEl.scrollHeight;
  }

  private send(): void {
    const text = this.inputEl.value.trim();
    if (!text) return;
    this.conn.reducers.postChat({ roomId: this.roomId, authorId: this.authorId, authorName: this.authorName, text, anchoredEventId: 0n });
    this.inputEl.value = '';
  }

  show(): void { this.element.classList.remove('hidden'); }
  hide(): void { this.element.classList.add('hidden'); }
}
