/// Normalized intelligence event from any data source
#[spacetimedb::table(name = intel_event, public)]
#[derive(Clone, Debug)]
pub struct IntelEvent {
    #[primary_key]
    #[auto_inc]
    pub event_id: u64,
    pub lat: f64,
    pub lon: f64,
    /// conflict | disaster | protest | cyber | military | flight | vessel | outage | climate
    pub event_type: String,
    pub severity: u8,
    pub source: String,
    pub title: String,
    pub country_code: String,
    pub timestamp_ms: u64,
    pub metadata: String,
}

/// Deduplicated live alert
#[spacetimedb::table(name = alert_state, public)]
#[derive(Clone, Debug)]
pub struct AlertState {
    #[primary_key]
    #[auto_inc]
    pub alert_id: u64,
    pub title: String,
    pub event_type: String,
    pub severity: u8,
    pub country_code: String,
    pub lat: f64,
    pub lon: f64,
    pub escalation_count: u32,
    pub source_event_ids: String,
    pub last_updated_ms: u64,
    pub created_ms: u64,
}

/// Live Country Instability Index score
#[spacetimedb::table(name = country_cii, public)]
#[derive(Clone, Debug)]
pub struct CountryCii {
    #[primary_key]
    pub country_code: String,
    pub score: f32,
    pub trend: f32,
    pub event_count: u32,
    pub last_updated_ms: u64,
}

/// LLM-generated world brief (shared across all clients)
#[spacetimedb::table(name = world_brief, public)]
#[derive(Clone, Debug)]
pub struct WorldBrief {
    #[primary_key]
    #[auto_inc]
    pub brief_id: u64,
    pub content: String,
    pub source_count: u32,
    pub model_used: String,
    pub generated_ms: u64,
}
