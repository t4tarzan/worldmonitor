use spacetimedb::{ReducerContext, Table};
use crate::tables::agents::{agent, agent_finding, Agent, AgentFinding};
use crate::tables::intelligence::{intel_event, country_cii};

fn now_ms(ctx: &ReducerContext) -> u64 {
    ctx.timestamp.to_micros_since_unix_epoch() as u64 / 1_000
}

fn ensure_agent(ctx: &ReducerContext, id: &str, kind: &str) {
    if ctx.db.agent().agent_id().find(&id.to_string()).is_none() {
        ctx.db.agent().insert(Agent {
            agent_id: id.to_string(),
            agent_type: kind.to_string(),
            status: "active".to_string(),
            last_run_ms: now_ms(ctx),
            findings_count: 0,
            error_message: String::new(),
        });
    }
}

fn touch_agent(ctx: &ReducerContext, id: &str) {
    if let Some(a) = ctx.db.agent().agent_id().find(&id.to_string()) {
        ctx.db.agent().agent_id().update(Agent {
            last_run_ms: now_ms(ctx),
            error_message: String::new(),
            ..a
        });
    }
}

fn bump_findings(ctx: &ReducerContext, id: &str) {
    if let Some(a) = ctx.db.agent().agent_id().find(&id.to_string()) {
        ctx.db.agent().agent_id().update(Agent { findings_count: a.findings_count + 1, ..a });
    }
}

fn emit_finding(
    ctx: &ReducerContext,
    agent_id: &str,
    severity: u8,
    title: String,
    desc: String,
    evidence: String,
    confidence: f32,
    countries: String,
) {
    ctx.db.agent_finding().insert(AgentFinding {
        finding_id: 0,
        agent_id: agent_id.to_string(),
        severity: severity.clamp(1, 5),
        title,
        description: desc,
        evidence,
        confidence: confidence.clamp(0.0, 1.0),
        country_codes: countries,
        acknowledged: false,
        created_ms: now_ms(ctx),
    });
    bump_findings(ctx, agent_id);
}

fn is_paused(ctx: &ReducerContext, id: &str) -> bool {
    ctx.db.agent().agent_id().find(&id.to_string())
        .map(|a| a.status == "paused")
        .unwrap_or(false)
}

#[spacetimedb::reducer]
pub fn register_agent(ctx: &ReducerContext, agent_id: String, agent_type: String) {
    ensure_agent(ctx, &agent_id, &agent_type);
}

#[spacetimedb::reducer]
pub fn set_agent_status(ctx: &ReducerContext, agent_id: String, status: String) {
    if !matches!(status.as_str(), "active" | "paused") { return; }
    if let Some(a) = ctx.db.agent().agent_id().find(&agent_id) {
        ctx.db.agent().agent_id().update(Agent { status, ..a });
    }
}

#[spacetimedb::reducer]
pub fn register_finding(
    ctx: &ReducerContext,
    agent_id: String,
    severity: u8,
    title: String,
    description: String,
    evidence: String,
    confidence: f32,
    country_codes: String,
) {
    emit_finding(ctx, &agent_id, severity, title, description, evidence, confidence, country_codes);
}

#[spacetimedb::reducer]
pub fn acknowledge_finding(ctx: &ReducerContext, finding_id: u64) {
    if let Some(f) = ctx.db.agent_finding().finding_id().find(&finding_id) {
        ctx.db.agent_finding().finding_id().update(AgentFinding { acknowledged: true, ..f });
    }
}

/// Threat Hunter: geo-convergence — call from VPS cron every 5 min
#[spacetimedb::reducer]
pub fn run_threat_hunter(ctx: &ReducerContext) {
    const ID: &str = "threat_hunter";
    ensure_agent(ctx, ID, ID);
    if is_paused(ctx, ID) { return; }

    let now = now_ms(ctx);
    let two_h_ago = now.saturating_sub(7_200_000);

    use std::collections::HashMap;
    let mut cells: HashMap<(i32, i32), Vec<String>> = HashMap::new();
    for e in ctx.db.intel_event().iter() {
        if e.timestamp_ms > two_h_ago {
            cells.entry((e.lat.floor() as i32, e.lon.floor() as i32))
                .or_default()
                .push(e.event_type.clone());
        }
    }

    for ((clat, clon), types) in &cells {
        let mut unique: Vec<String> = types.clone();
        unique.sort();
        unique.dedup();
        if unique.len() < 3 { continue; }

        let already = ctx.db.agent_finding().iter().any(|f| {
            f.agent_id == ID
                && f.evidence.contains(&format!("\"lat\":{}", clat))
                && f.created_ms > two_h_ago
        });
        if already { continue; }

        let countries: std::collections::HashSet<String> = ctx.db.intel_event().iter()
            .filter(|e| {
                e.lat.floor() as i32 == *clat
                && e.lon.floor() as i32 == *clon
                && e.timestamp_ms > two_h_ago
            })
            .map(|e| e.country_code.clone())
            .collect();

        let sev = if unique.len() >= 5 { 4u8 } else { 3u8 };
        let conf = (unique.len() as f32 / 6.0).min(1.0);
        emit_finding(
            ctx, ID, sev,
            format!("Geo-convergence ({},{}) — {} types", clat, clon, unique.len()),
            format!("Multi-signal: {}. {} total events.", unique.join(", "), types.len()),
            format!("{{\"lat\":{},\"lon\":{},\"types\":{:?},\"count\":{}}}", clat, clon, unique, types.len()),
            conf,
            countries.into_iter().collect::<Vec<_>>().join(","),
        );
    }
    touch_agent(ctx, ID);
}

/// Correlator: military + cyber + conflict in same country within 24h
#[spacetimedb::reducer]
pub fn run_correlator(ctx: &ReducerContext) {
    const ID: &str = "correlator";
    ensure_agent(ctx, ID, ID);
    if is_paused(ctx, ID) { return; }

    let now = now_ms(ctx);
    let day_ago = now.saturating_sub(86_400_000);

    use std::collections::HashMap;
    let mut by_country: HashMap<String, Vec<String>> = HashMap::new();
    for e in ctx.db.intel_event().iter() {
        if e.timestamp_ms > day_ago {
            by_country.entry(e.country_code.clone()).or_default().push(e.event_type.clone());
        }
    }

    for (country, types) in &by_country {
        let mil   = types.iter().any(|t| t == "military" || t == "flight");
        let cyber = types.iter().any(|t| t == "cyber");
        let conf  = types.iter().any(|t| t == "conflict");
        if !(mil && cyber && conf) { continue; }

        let already = ctx.db.agent_finding().iter().any(|f| {
            f.agent_id == ID && f.country_codes.contains(country.as_str()) && f.created_ms > day_ago
        });
        if already { continue; }

        emit_finding(
            ctx, ID, 4,
            format!("Multi-domain correlation: {}", country),
            format!("Simultaneous military, cyber, and conflict in {} within 24h ({} events).", country, types.len()),
            format!("{{\"country\":\"{}\",\"streams\":[\"military\",\"cyber\",\"conflict\"],\"count\":{}}}", country, types.len()),
            0.75,
            country.clone(),
        );
    }
    touch_agent(ctx, ID);
}

/// Forecast: rising CII trend → escalation probability
#[spacetimedb::reducer]
pub fn run_forecast(ctx: &ReducerContext) {
    const ID: &str = "forecast";
    ensure_agent(ctx, ID, ID);
    if is_paused(ctx, ID) { return; }

    let now = now_ms(ctx);
    let two_h_ago = now.saturating_sub(7_200_000);

    for cii in ctx.db.country_cii().iter() {
        if cii.trend <= 5.0 || cii.score <= 60.0 { continue; }

        let already = ctx.db.agent_finding().iter().any(|f| {
            f.agent_id == ID && f.country_codes.contains(cii.country_code.as_str()) && f.created_ms > two_h_ago
        });
        if already { continue; }

        let prob = (cii.score / 100.0 * (1.0 + cii.trend / 50.0)).min(1.0);
        let sev  = if prob > 0.8 { 4u8 } else if prob > 0.6 { 3u8 } else { 2u8 };
        emit_finding(
            ctx, ID, sev,
            format!("Escalation forecast: {} (p={:.0}%)", cii.country_code, prob * 100.0),
            format!("CII {:.1}, trend +{:.1}. Escalation p={:.0}%.", cii.score, cii.trend, prob * 100.0),
            format!("{{\"country\":\"{}\",\"cii\":{},\"trend\":{},\"prob\":{}}}", cii.country_code, cii.score, cii.trend, prob),
            prob,
            cii.country_code.clone(),
        );
    }
    touch_agent(ctx, ID);
}
