/// Registered intelligence agent
#[spacetimedb::table(name = agent, public)]
#[derive(Clone, Debug)]
pub struct Agent {
    #[primary_key]
    pub agent_id: String,
    /// threat_hunter | correlator | forecast | summarizer
    pub agent_type: String,
    /// active | paused | error
    pub status: String,
    pub last_run_ms: u64,
    pub findings_count: u32,
    pub error_message: String,
}

/// Structured finding emitted by an agent
#[spacetimedb::table(name = agent_finding, public)]
#[derive(Clone, Debug)]
pub struct AgentFinding {
    #[primary_key]
    #[auto_inc]
    pub finding_id: u64,
    pub agent_id: String,
    /// 1 (info) – 5 (critical)
    pub severity: u8,
    pub title: String,
    pub description: String,
    pub evidence: String,
    /// 0.0 – 1.0
    pub confidence: f32,
    pub country_codes: String,
    pub acknowledged: bool,
    pub created_ms: u64,
}

/// Reusable response playbook
#[spacetimedb::table(name = playbook, public)]
#[derive(Clone, Debug)]
pub struct Playbook {
    #[primary_key]
    #[auto_inc]
    pub playbook_id: u64,
    pub name: String,
    pub description: String,
    pub trigger_condition: String,
    pub steps: String,
    pub auto_assign_to: String,
    pub created_by: String,
    pub created_ms: u64,
}
