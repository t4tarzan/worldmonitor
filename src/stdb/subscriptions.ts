import type { DbConnection, SubscriptionHandle, EventContext } from './generated';
import type {
  Agent,
  AgentFinding,
  AlertAssignment,
  AnalystSession,
  ChatMessage,
  CountryCii,
  IntelEvent,
  SharedAnnotation,
  WorldBrief,
} from './generated/types';

export type {
  Agent, AgentFinding, AlertAssignment, AnalystSession,
  ChatMessage, CountryCii, IntelEvent, SharedAnnotation, WorldBrief,
};

const handles: SubscriptionHandle[] = [];

function sub(conn: DbConnection, query: string): SubscriptionHandle {
  const h = conn.subscriptionBuilder().subscribe(query);
  handles.push(h);
  return h;
}

export function subscribeIntelligence(conn: DbConnection): void {
  sub(conn, 'SELECT * FROM intel_event');
  sub(conn, 'SELECT * FROM country_cii');
  sub(conn, 'SELECT * FROM alert_state');
  sub(conn, 'SELECT * FROM world_brief');
}

export function subscribeCollaboration(conn: DbConnection): void {
  sub(conn, 'SELECT * FROM analyst_session');
  sub(conn, 'SELECT * FROM shared_annotation');
  sub(conn, 'SELECT * FROM alert_assignment');
}

export function subscribeChat(conn: DbConnection, roomId: string): void {
  sub(conn, `SELECT * FROM chat_message WHERE room_id = '${roomId}'`);
}

export function subscribeAgents(conn: DbConnection): void {
  sub(conn, 'SELECT * FROM agent');
  sub(conn, 'SELECT * FROM agent_finding');
}

export function subscribeAll(conn: DbConnection): void {
  subscribeIntelligence(conn);
  subscribeCollaboration(conn);
  subscribeAgents(conn);
}

export function unsubscribeAll(): void {
  handles.forEach(h => h.unsubscribe());
  handles.length = 0;
}

// Callbacks wrap the (ctx, row) SDK signature into simpler (row) or (row, prev) forms

export function onCiiUpdate(
  conn: DbConnection,
  cb: (newRow: CountryCii, oldRow: CountryCii) => void,
): void {
  conn.db.country_cii.onUpdate((_ctx: EventContext, old: CountryCii, next: CountryCii) => cb(next, old));
}

export function onCiiInsert(conn: DbConnection, cb: (row: CountryCii) => void): void {
  conn.db.country_cii.onInsert((_ctx: EventContext, row: CountryCii) => cb(row));
}

export function onIntelEventInsert(conn: DbConnection, cb: (row: IntelEvent) => void): void {
  conn.db.intel_event.onInsert((_ctx: EventContext, row: IntelEvent) => cb(row));
}

export function onSessionChange(
  conn: DbConnection,
  onJoin: (row: AnalystSession) => void,
  onLeave: (row: AnalystSession) => void,
  onUpdate: (newRow: AnalystSession, oldRow: AnalystSession) => void,
): void {
  conn.db.analyst_session.onInsert((_ctx: EventContext, row: AnalystSession) => onJoin(row));
  conn.db.analyst_session.onDelete((_ctx: EventContext, row: AnalystSession) => onLeave(row));
  conn.db.analyst_session.onUpdate((_ctx: EventContext, old: AnalystSession, next: AnalystSession) => onUpdate(next, old));
}

export function onAnnotationChange(
  conn: DbConnection,
  onAdd: (row: SharedAnnotation) => void,
  onRemove: (row: SharedAnnotation) => void,
): void {
  conn.db.shared_annotation.onInsert((_ctx: EventContext, row: SharedAnnotation) => onAdd(row));
  conn.db.shared_annotation.onDelete((_ctx: EventContext, row: SharedAnnotation) => onRemove(row));
}

export function onChatMessage(conn: DbConnection, cb: (row: ChatMessage) => void): void {
  conn.db.chat_message.onInsert((_ctx: EventContext, row: ChatMessage) => cb(row));
}

export function onFinding(conn: DbConnection, cb: (row: AgentFinding) => void): void {
  conn.db.agent_finding.onInsert((_ctx: EventContext, row: AgentFinding) => cb(row));
}

export function onWorldBrief(conn: DbConnection, cb: (row: WorldBrief) => void): void {
  conn.db.world_brief.onInsert((_ctx: EventContext, row: WorldBrief) => cb(row));
}

export function getCurrentSessions(conn: DbConnection): AnalystSession[] {
  return [...conn.db.analyst_session.iter()];
}

export function getCountryCii(conn: DbConnection, code: string): CountryCii | undefined {
  return conn.db.country_cii.countryCode.find(code) ?? undefined;
}

export function getAllCii(conn: DbConnection): CountryCii[] {
  return [...conn.db.country_cii.iter()];
}

export function getRecentEvents(conn: DbConnection, sinceMs: number): IntelEvent[] {
  return [...conn.db.intel_event.iter()].filter(e => Number(e.timestampMs) > sinceMs);
}

export function getAnnotations(conn: DbConnection): SharedAnnotation[] {
  return [...conn.db.shared_annotation.iter()];
}

export function getAlertAssignments(conn: DbConnection): AlertAssignment[] {
  return [...conn.db.alert_assignment.iter()];
}

export function getFindings(conn: DbConnection): AgentFinding[] {
  return [...conn.db.agent_finding.iter()];
}

export function getAgents(conn: DbConnection): Agent[] {
  return [...conn.db.agent.iter()];
}

export function getLatestBrief(conn: DbConnection): WorldBrief | undefined {
  const briefs = [...conn.db.world_brief.iter()];
  return briefs.sort((a, b) => Number(b.generatedMs) - Number(a.generatedMs))[0];
}
