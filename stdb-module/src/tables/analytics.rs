/// Analyst activity log
#[spacetimedb::table(name = analyst_activity, public)]
#[derive(Clone, Debug)]
pub struct AnalystActivity {
    #[primary_key]
    #[auto_inc]
    pub activity_id: u64,
    pub user_id: String,
    pub action: String,
    pub target_id: String,
    pub variant: String,
    pub timestamp_ms: u64,
}
