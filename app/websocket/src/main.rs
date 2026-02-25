mod callback;
mod protocol;
mod sqs;

use axum::{
    Router,
    extract::{ConnectInfo, ws::WebSocketUpgrade},
    http::HeaderMap,
    response::IntoResponse,
    routing::get,
};
use axum_extra::extract::CookieJar;
use reqwest::StatusCode;
use std::{env, fs, net::SocketAddr};
use tokio::net::TcpListener;

use crate::callback::sim_callback;

#[tokio::main]
async fn main() {
    let _ = fs::create_dir_all("sim-bins");

    let app = Router::new()
        .route("/sim/health", get(health_handler))
        .route("/sim", get(sim_handler));
    let addr = format!("0.0.0.0:{}", env::var("WEBSOCKET_PORT").unwrap());

    println!("Simulation WebSocket listening on ws://{addr}/sim");

    let listener = TcpListener::bind(addr).await.unwrap();
    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<SocketAddr>(),
    )
    .await
    .unwrap();
}

async fn health_handler() -> impl IntoResponse {
    (StatusCode::OK, "OK")
}

async fn sim_handler(
    ConnectInfo(peer): ConnectInfo<SocketAddr>,
    jar: CookieJar,
    headers: HeaderMap,
    ws: WebSocketUpgrade,
) -> impl IntoResponse {
    let xff = headers
        .get("x-forwarded-for")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_owned())
        .unwrap_or_else(|| "-".to_string());

    println!("Initiating handshake with {peer} (xff={xff})");

    let session_id = jar.get("sessionId").map(|c| c.value().to_string()).unwrap();
    ws.on_upgrade(move |socket| sim_callback(socket, peer, session_id))
}
