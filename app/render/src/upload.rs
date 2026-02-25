use std::{env, fs, io::Read, path::Path};

use anyhow::Result;
use reqwest::Client;
use serde::{Deserialize, Serialize};

#[derive(Serialize)]
struct RequestBody {
    #[serde(rename = "frameCount")]
    frame_count: u32,
    mime: String,
}

#[derive(Deserialize)]
struct ResponseBody {
    #[allow(dead_code)]
    filename: String,
    #[serde(rename = "uploadUrl")]
    upload_url: String,
}

pub async fn upload_rendered_frames(
    simulation_id: &str,
    session_id: &str,
    timestamp: &str,
    frame: usize,
    render_dir: &Path,
) -> Result<()> {
    let client = Client::new();

    let origin = format!(
        "http://{}:{}",
        env::var("API_PRIVATE_IP").expect("API_PRIVATE_IP not set"),
        env::var("API_PORT_HOST").expect("API_PORT_HOST not set")
    );
    let cookies = format!("sessionId={session_id}");

    let mime = "image/png".to_string();
    let url = format!(
        "{}/api/sims/{}/images/{}",
        origin.trim_end_matches('/'),
        simulation_id,
        timestamp,
    );

    // Request pre-signed URL from API server
    let response = client
        .post(&url)
        .header(reqwest::header::COOKIE, &cookies)
        .json(&RequestBody {
            frame_count: frame as u32,
            mime: mime.clone(),
        })
        .send()
        .await?
        .error_for_status()?
        .json::<ResponseBody>()
        .await?;

    let mut file = fs::File::open(render_dir.join(format!("{frame:05}.png")))?;
    let mut buf = Vec::new();
    file.read_to_end(&mut buf)?;

    client
        .put(&response.upload_url)
        .header("content-type", &mime)
        .body(buf)
        .send()
        .await?
        .error_for_status()?;

    Ok(())
}
