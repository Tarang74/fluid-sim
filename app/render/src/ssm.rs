use aws_sdk_ssm::Error;
use std::{collections::HashMap, sync::OnceLock};

#[derive(Debug)]
pub struct Parameters {
    pub s3_simultion_bucket: String,
    pub sqs_render_jobs_url: String,
}

pub static PARAMETERS: OnceLock<Parameters> = OnceLock::new();

pub async fn load_parameters() -> Result<(), Error> {
    let config = aws_config::load_from_env().await;
    let client = aws_sdk_ssm::Client::new(&config);

    let result = client
        .get_parameters()
        .names("")
        .names("")
        .with_decryption(false)
        .send()
        .await?;

    let mut params = HashMap::new();
    for param in result.parameters() {
        if let (Some(name), Some(value)) = (param.name(), param.value()) {
            params.insert(name.to_string(), value.to_string());
        }
    }

    let parameters = Parameters {
        s3_simultion_bucket: params
            .get("")
            .unwrap()
            .clone(),
        sqs_render_jobs_url: params
            .get("")
            .unwrap()
            .clone(),
    };

    PARAMETERS.set(parameters).unwrap();
    Ok(())
}

pub fn parameters() -> &'static Parameters {
    PARAMETERS.get().expect("Parameters not initialised")
}
