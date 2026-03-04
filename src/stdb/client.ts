import { DbConnection } from './generated';

const STDB_HOST = import.meta.env.VITE_STDB_HOST ?? 'wss://stdb.wnbpc.de';
const STDB_MODULE = import.meta.env.VITE_STDB_MODULE ?? 'worldmonitor';
const TOKEN_KEY = 'stdb_auth_token';

let _conn: DbConnection | null = null;
let _connecting = false;
const _readyCallbacks: Array<(conn: DbConnection) => void> = [];

export function getConnection(): DbConnection | null {
  return _conn;
}

export function isCollabEnabled(): boolean {
  return import.meta.env.VITE_COLLAB_ENABLED === 'true';
}

export function connect(opts?: {
  onConnected?: (conn: DbConnection) => void;
  onDisconnected?: () => void;
}): void {
  if (!isCollabEnabled()) return;
  if (_conn || _connecting) {
    if (_conn && opts?.onConnected) opts.onConnected(_conn);
    return;
  }
  _connecting = true;

  const savedToken = localStorage.getItem(TOKEN_KEY) ?? undefined;

  _conn = DbConnection.builder()
    .withUri(STDB_HOST)
    .withDatabaseName(STDB_MODULE)
    .withToken(savedToken)
    .onConnect((_ctx, _identity, token) => {
      _connecting = false;
      if (token) localStorage.setItem(TOKEN_KEY, token);
      _readyCallbacks.forEach(cb => cb(_conn!));
      _readyCallbacks.length = 0;
      opts?.onConnected?.(_conn!);
    })
    .onDisconnect((_ctx, error) => {
      if (error) console.warn('[stdb] disconnected:', error);
      opts?.onDisconnected?.();
    })
    .onConnectError((_ctx, error) => {
      console.error('[stdb] connection error:', error);
      _connecting = false;
    })
    .build();
}

export function onReady(cb: (conn: DbConnection) => void): void {
  if (_conn) {
    cb(_conn);
  } else {
    _readyCallbacks.push(cb);
  }
}

export function disconnect(): void {
  _conn?.disconnect();
  _conn = null;
  _connecting = false;
}
