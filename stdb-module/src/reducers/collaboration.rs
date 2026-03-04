use spacetimedb::{ReducerContext, Table};
use crate::tables::collaboration::{
    analyst_session, shared_annotation, chat_message, alert_assignment,
    AnalystSession, SharedAnnotation, ChatMessage, AlertAssignment,
};

fn now_ms(ctx: &ReducerContext) -> u64 {
    ctx.timestamp.to_micros_since_unix_epoch() as u64 / 1_000
}

#[spacetimedb::reducer]
pub fn join_session(
    ctx: &ReducerContext,
    user_id: String,
    display_name: String,
    color: String,
    variant: String,
) {
    let now = now_ms(ctx);
    match ctx.db.analyst_session().identity().find(&ctx.sender) {
        Some(existing) => {
            ctx.db.analyst_session().identity().update(AnalystSession {
                user_id,
                display_name,
                color,
                variant,
                last_active_ms: now,
                ..existing
            });
        }
        None => {
            ctx.db.analyst_session().insert(AnalystSession {
                identity: ctx.sender,
                user_id,
                display_name,
                color,
                cursor_lat: 0.0,
                cursor_lon: 0.0,
                active_panel: String::new(),
                variant,
                joined_ms: now,
                last_active_ms: now,
            });
        }
    }
}

#[spacetimedb::reducer]
pub fn leave_session(ctx: &ReducerContext) {
    ctx.db.analyst_session().identity().delete(&ctx.sender);
}

#[spacetimedb::reducer]
pub fn move_cursor(ctx: &ReducerContext, lat: f64, lon: f64, panel: String) {
    if let Some(session) = ctx.db.analyst_session().identity().find(&ctx.sender) {
        ctx.db.analyst_session().identity().update(AnalystSession {
            cursor_lat: lat,
            cursor_lon: lon,
            active_panel: panel,
            last_active_ms: now_ms(ctx),
            ..session
        });
    }
}

#[spacetimedb::reducer]
pub fn add_annotation(
    ctx: &ReducerContext,
    creator_id: String,
    creator_name: String,
    lat: f64,
    lon: f64,
    text: String,
    kind: String,
    geometry: String,
    event_id: u64,
) {
    ctx.db.shared_annotation().insert(SharedAnnotation {
        annotation_id: 0,
        creator_id,
        creator_name,
        lat,
        lon,
        text,
        kind,
        geometry,
        event_id,
        created_ms: now_ms(ctx),
    });
}

#[spacetimedb::reducer]
pub fn delete_annotation(ctx: &ReducerContext, annotation_id: u64, requester_id: String) {
    if let Some(ann) = ctx.db.shared_annotation().annotation_id().find(&annotation_id) {
        if ann.creator_id == requester_id {
            ctx.db.shared_annotation().annotation_id().delete(&annotation_id);
        }
    }
}

#[spacetimedb::reducer]
pub fn post_chat(
    ctx: &ReducerContext,
    room_id: String,
    author_id: String,
    author_name: String,
    text: String,
    anchored_event_id: u64,
) {
    if text.trim().is_empty() { return; }
    ctx.db.chat_message().insert(ChatMessage {
        message_id: 0,
        room_id,
        author_id,
        author_name,
        text: text.chars().take(2000).collect(),
        anchored_event_id,
        sent_ms: now_ms(ctx),
    });
}

#[spacetimedb::reducer]
pub fn assign_alert(
    ctx: &ReducerContext,
    alert_id: u64,
    assigned_to: String,
    assigned_by: String,
    priority: u8,
    notes: String,
) {
    let now = now_ms(ctx);
    match ctx.db.alert_assignment().alert_id().find(&alert_id) {
        Some(existing) => {
            ctx.db.alert_assignment().alert_id().update(AlertAssignment {
                assigned_to,
                assigned_by,
                status: "investigating".to_string(),
                priority,
                notes,
                updated_ms: now,
                ..existing
            });
        }
        None => {
            ctx.db.alert_assignment().insert(AlertAssignment {
                alert_id,
                assigned_to,
                assigned_by,
                status: "pending".to_string(),
                priority,
                notes,
                updated_ms: now,
            });
        }
    }
}

#[spacetimedb::reducer]
pub fn resolve_alert(ctx: &ReducerContext, alert_id: u64, status: String, notes: String) {
    if !matches!(status.as_str(), "resolved" | "dismissed") { return; }
    if let Some(assignment) = ctx.db.alert_assignment().alert_id().find(&alert_id) {
        ctx.db.alert_assignment().alert_id().update(AlertAssignment {
            status,
            notes,
            updated_ms: now_ms(ctx),
            ..assignment
        });
    }
}
