import { connect, onReady, isCollabEnabled, type DbConnection } from '@/stdb';
import { subscribeAll, onSessionChange, onCiiUpdate, onIntelEventInsert } from '@/stdb';
import { PresenceBar } from '@/components/PresenceBar';

let _presenceBar: PresenceBar | null = null;
let _initialized = false;

export interface StdbBootstrapOptions {
  userId: string;
  displayName: string;
  color: string;
  variant: string;
  presenceContainer?: HTMLElement;
  onCiiUpdate?: (code: string, score: number, trend: number) => void;
  onIntelEvent?: (type: string, lat: number, lon: number, severity: number) => void;
}

export function initStdb(opts: StdbBootstrapOptions): void {
  if (_initialized || !isCollabEnabled()) return;
  _initialized = true;

  connect({
    onConnected: (conn) => {
      _onConnected(conn, opts);
    },
    onDisconnected: () => {
      _presenceBar = null;
    },
  });
}

function _onConnected(conn: DbConnection, opts: StdbBootstrapOptions): void {
  subscribeAll(conn);

  conn.reducers.joinSession({
    userId: opts.userId,
    displayName: opts.displayName,
    color: opts.color,
    variant: opts.variant,
  });

  window.addEventListener('beforeunload', () => {
    conn.reducers.leaveSession({ userId: opts.userId });
  });

  if (opts.presenceContainer) {
    _presenceBar = new PresenceBar();
    _presenceBar.mount(opts.presenceContainer);

    onSessionChange(
      conn,
      (s) => _presenceBar?.upsert(s),
      (s) => _presenceBar?.remove(s),
      (s) => _presenceBar?.upsert(s),
    );
  }

  if (opts.onCiiUpdate) {
    const cb = opts.onCiiUpdate;
    onCiiUpdate(conn, (newRow) => {
      cb(newRow.countryCode, Number(newRow.score), Number(newRow.trend));
    });
  }

  if (opts.onIntelEvent) {
    const cb = opts.onIntelEvent;
    onIntelEventInsert(conn, (row) => {
      cb(row.eventType, Number(row.lat), Number(row.lon), row.severity);
    });
  }
}

export function getPresenceBar(): PresenceBar | null {
  return _presenceBar;
}

export function getStdbConnection(): DbConnection | null {
  let conn: DbConnection | null = null;
  onReady((c) => { conn = c; });
  return conn;
}
