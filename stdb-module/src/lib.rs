use spacetimedb::ReducerContext;

mod tables;
mod reducers;

pub use tables::*;
pub use reducers::*;

#[spacetimedb::reducer(init)]
pub fn init(_ctx: &ReducerContext) {
    log::info!("WorldMonitor SpacetimeDB module initialized");
}

#[spacetimedb::reducer(client_connected)]
pub fn client_connected(_ctx: &ReducerContext) {}

#[spacetimedb::reducer(client_disconnected)]
pub fn client_disconnected(ctx: &ReducerContext) {
    use crate::tables::collaboration::analyst_session;
    ctx.db.analyst_session().identity().delete(&ctx.sender);
}
