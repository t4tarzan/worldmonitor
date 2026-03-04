use spacetimedb::Identity;

/// Active analyst presence session
#[spacetimedb::table(name = analyst_session, public)]
#[derive(Clone, Debug)]
pub struct AnalystSession {
    #[primary_key]
    pub identity: Identity,
    pub user_id: String,
    pub display_name: String,
    pub color: String,
    pub cursor_lat: f64,
    pub cursor_lon: f64,
    pub active_panel: String,
    /// world | tech | finance | happy | crisis | corporate | osint
    pub variant: String,
    pub joined_ms: u64,
    pub last_active_ms: u64,
}

/// Shared map annotation
#[spacetimedb::table(name = shared_annotation, public)]
#[derive(Clone, Debug)]
pub struct SharedAnnotation {
    #[primary_key]
    #[auto_inc]
    pub annotation_id: u64,
    pub creator_id: String,
    pub creator_name: String,
    pub lat: f64,
    pub lon: f64,
    pub text: String,
    /// marker | area | note | evidence
    pub kind: String,
    pub geometry: String,
    pub event_id: u64,
    pub created_ms: u64,
}

/// Contextual chat message
#[spacetimedb::table(name = chat_message, public)]
#[derive(Clone, Debug)]
pub struct ChatMessage {
    #[primary_key]
    #[auto_inc]
    pub message_id: u64,
    pub room_id: String,
    pub author_id: String,
    pub author_name: String,
    pub text: String,
    pub anchored_event_id: u64,
    pub sent_ms: u64,
}

/// Alert triage assignment
#[spacetimedb::table(name = alert_assignment, public)]
#[derive(Clone, Debug)]
pub struct AlertAssignment {
    #[primary_key]
    pub alert_id: u64,
    pub assigned_to: String,
    pub assigned_by: String,
    /// pending | investigating | resolved | dismissed
    pub status: String,
    pub priority: u8,
    pub notes: String,
    pub updated_ms: u64,
}
