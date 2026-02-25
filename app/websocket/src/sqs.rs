use aws_config::load_from_env;
use aws_sdk_s3::primitives::ByteStream;
use aws_sdk_sqs::Error;
use chrono::{DateTime, Utc};
use serde::Serialize;
use sim_core::vector_2d::Vector2D;
use std::env;

#[derive(Serialize)]
pub struct QueueMessage {
    session_id: String,
    simulation_id: String,
    frame: usize,
    world_width: f32,
    world_height: f32,
    particle_radius: f32,
    timestamp: String,
}

#[allow(clippy::too_many_arguments)]
pub async fn send_to_sqs(
    session_id: String,
    simulation_id: String,
    frame: usize,
    positions: Vec<Vector2D>,
    velocity_magnitudes: Vec<f32>,
    world_width: f32,
    world_height: f32,
    particle_radius: f32,
    timestamp: DateTime<Utc>,
) -> Result<(), Error> {
    let config = load_from_env().await;

    let s3_client = aws_sdk_s3::Client::new(&config);
    let sqs_client = aws_sdk_sqs::Client::new(&config);

    let timestamp_string = timestamp.format("%Y-%m-%dT%H-%M-%SZ").to_string();

    // Upload to S3
    let data = serde_json::json!({
        "positions": positions,
        "velocity_magnitudes": velocity_magnitudes
    })
    .to_string();

    let key = format!("{timestamp_string}/{frame:05}.json");
    let _ = s3_client
        .put_object()
        .bucket(env::var("S3_SIMULATION_BUCKET").unwrap())
        .key(&key)
        .body(ByteStream::from(data.into_bytes()))
        .content_type("application/json")
        .send()
        .await;

    // Send message to SQS
    let message = QueueMessage {
        session_id,
        simulation_id,
        frame,
        world_width,
        world_height,
        particle_radius,
        timestamp: timestamp_string,
    };

    let message_json = serde_json::to_string(&message).expect("Failed to serialise with serde");
    let _ = sqs_client
        .send_message()
        .queue_url(env::var("SQS_RENDER_JOBS_URL").unwrap())
        .message_body(message_json)
        .send()
        .await?;

    Ok(())
}
