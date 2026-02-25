mod render;
mod ssm;
mod upload;

use crate::{
    render::render,
    ssm::{load_parameters, parameters},
    upload::upload_rendered_frames,
};
use anyhow::Result;
use aws_sdk_s3::Client as S3Client;
use aws_sdk_sqs::Client as SqsClient;
use serde::Deserialize;
use std::{env, fs, path::PathBuf, sync::Arc};
use tokio::sync::Semaphore;

#[derive(Deserialize, Debug)]
struct QueueMessage {
    session_id: String,
    simulation_id: String,
    frame: usize,
    world_width: f32,
    world_height: f32,
    particle_radius: f32,
    timestamp: String,
}

#[tokio::main]
async fn main() {
    // Load SSM parameters
    load_parameters().await.expect("Failed to load parameters");

    let config = aws_config::load_from_env().await;
    let sqs_client = Arc::new(SqsClient::new(&config));
    let s3_client = Arc::new(S3Client::new(&config));

    println!("Polling SQS queue: {}", &parameters().sqs_render_jobs_url);

    let semaphore = Arc::new(Semaphore::new(3));

    loop {
        let permit = match semaphore.clone().try_acquire_owned() {
            Ok(permit) => permit,
            Err(_) => {
                tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
                continue;
            }
        };

        match sqs_client
            .receive_message()
            .queue_url(&parameters().sqs_render_jobs_url)
            .max_number_of_messages(1)
            .wait_time_seconds(3) // Poll
            .visibility_timeout(300) // Hide message from other consumers
            .send()
            .await
        {
            Ok(output) => {
                if let Some(messages) = output.messages
                    && let Some(message) = messages.first()
                    && let (Some(body), Some(receipt_handle)) =
                        (message.body.clone(), message.receipt_handle.clone())
                {
                    // Clone resources for the spawned task
                    let sqs_client = Arc::clone(&sqs_client);
                    let s3_client = Arc::clone(&s3_client);

                    tokio::spawn(async move {
                        let _permit = permit;

                        match serde_json::from_str::<QueueMessage>(&body) {
                            Ok(job) => {
                                match process_render_job(
                                    &job,
                                    &s3_client,
                                    &parameters().s3_simultion_bucket,
                                    &env::var("BLENDER_PATH")
                                        .unwrap_or_else(|_| "/usr/bin/blender".to_string()),
                                )
                                .await
                                {
                                    Ok(_) => {
                                        println!("Render job completed: frame {}", job.frame);

                                        let _ = sqs_client
                                            .delete_message()
                                            .queue_url(&parameters().sqs_render_jobs_url)
                                            .receipt_handle(receipt_handle)
                                            .send()
                                            .await;
                                    }
                                    Err(e) => {
                                        eprintln!("Failed to process render job: {e:?}");
                                    }
                                }
                            }
                            Err(e) => {
                                eprintln!("Failed to parse render job: {e:?}");
                            }
                        }
                    });
                }
            }
            Err(e) => {
                eprintln!("Failed to receive message: {e:?}");
            }
        }
    }
}

async fn process_render_job(
    job: &QueueMessage,
    s3_client: &S3Client,
    simulation_bucket: &str,
    blender_path: &str,
) -> Result<()> {
    // Download JSON frame from S3_SIMULATION_BUCKET
    let frames_dir = PathBuf::from(format!("sim-data/{}", job.timestamp));
    fs::create_dir_all(&frames_dir)?;

    let s3_key = format!("{}/{:05}.json", job.timestamp, job.frame);
    let local_json_path = frames_dir.join(format!("{:5}.json", job.frame));

    let response = s3_client
        .get_object()
        .bucket(simulation_bucket)
        .key(&s3_key)
        .send()
        .await?;

    let data = response.body.collect().await?;
    fs::write(&local_json_path, data.into_bytes())?;

    println!("Rendering frame {}...", job.frame);

    let render_dir = PathBuf::from(format!("renders/{}", job.timestamp));
    let blender_script = PathBuf::from("render.py");
    render(
        &local_json_path,
        &render_dir,
        &blender_script,
        &PathBuf::from(blender_path),
        job.world_width,
        job.world_height,
        job.particle_radius,
    )?;

    // Upload rendered frame to S3
    println!("Uploading rendered frame {}...", job.frame);

    upload_rendered_frames(
        &job.simulation_id,
        &job.session_id,
        &job.timestamp,
        job.frame,
        &render_dir,
    )
    .await?;

    fs::remove_file(&local_json_path)?;
    fs::remove_dir_all(&render_dir)?;

    Ok(())
}
