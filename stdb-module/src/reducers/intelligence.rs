use spacetimedb::{ReducerContext, Table};
use crate::tables::intelligence::{
    intel_event, country_cii, world_brief,
    IntelEvent, CountryCii, WorldBrief,
};

fn now_ms(ctx: &ReducerContext) -> u64 {
    ctx.timestamp.to_micros_since_unix_epoch() as u64 / 1_000
}

#[spacetimedb::reducer]
pub fn ingest_event(
    ctx: &ReducerContext,
    lat: f64,
    lon: f64,
    event_type: String,
    severity: u8,
    source: String,
    title: String,
    country_code: String,
    timestamp_ms: u64,
    metadata: String,
) {
    let now = now_ms(ctx);
    let five_min_ago = now.saturating_sub(300_000);
    let title_prefix: String = title.chars().take(40).collect();

    let duplicate = ctx.db.intel_event().iter().any(|e| {
        e.country_code == country_code
            && e.event_type == event_type
            && e.title.chars().take(40).collect::<String>() == title_prefix
            && e.timestamp_ms > five_min_ago
    });
    if duplicate {
        return;
    }

    ctx.db.intel_event().insert(IntelEvent {
        event_id: 0,
        lat,
        lon,
        event_type: event_type.clone(),
        severity,
        source,
        title,
        country_code: country_code.clone(),
        timestamp_ms,
        metadata,
    });

    if matches!(event_type.as_str(), "conflict" | "protest" | "disaster" | "outage" | "cyber") {
        let delta: f32 = match severity { 5 => 8.0, 4 => 5.0, 3 => 3.0, 2 => 1.5, _ => 0.5 };
        match ctx.db.country_cii().country_code().find(&country_code) {
            Some(existing) => {
                let new_score = (existing.score + delta).min(100.0);
                ctx.db.country_cii().country_code().update(CountryCii {
                    score: new_score,
                    trend: new_score - existing.score,
                    event_count: existing.event_count + 1,
                    last_updated_ms: now,
                    ..existing
                });
            }
            None => {
                ctx.db.country_cii().insert(CountryCii {
                    country_code,
                    score: (15.0_f32 + delta).min(100.0),
                    trend: delta,
                    event_count: 1,
                    last_updated_ms: now,
                });
            }
        }
    }
}

#[spacetimedb::reducer]
pub fn upsert_cii(ctx: &ReducerContext, country_code: String, score: f32, event_count: u32) {
    let now = now_ms(ctx);
    let clamped = score.clamp(0.0, 100.0);
    match ctx.db.country_cii().country_code().find(&country_code) {
        Some(existing) => {
            ctx.db.country_cii().country_code().update(CountryCii {
                score: clamped,
                trend: clamped - existing.score,
                event_count,
                last_updated_ms: now,
                ..existing
            });
        }
        None => {
            ctx.db.country_cii().insert(CountryCii {
                country_code,
                score: clamped,
                trend: 0.0,
                event_count,
                last_updated_ms: now,
            });
        }
    }
}

#[spacetimedb::reducer]
pub fn store_world_brief(ctx: &ReducerContext, content: String, source_count: u32, model_used: String) {
    ctx.db.world_brief().insert(WorldBrief {
        brief_id: 0,
        content,
        source_count,
        model_used,
        generated_ms: now_ms(ctx),
    });
}
