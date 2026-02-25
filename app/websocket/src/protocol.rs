use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum ClientMessage {
    #[serde(rename_all = "camelCase")]
    StartRecording {
        simulation_id: String,
        particle_count: usize,
        particle_radius: f32,
        world_width: f32,
        world_height: f32,
        gravity: f32,
        target_density: f32,
        pressure_multiplier: f32,
        viscosity_strength: f32,
        smoothing_radius: f32,
        interaction_strength: f32,
        interaction_radius: f32,
    },
    #[serde(rename_all = "camelCase")]
    StopRecording,
    Step {
        frame: usize,
        dt: f32,
    },
    SetGravity {
        frame: usize,
        gravity: f32,
    },
    #[serde(rename_all = "camelCase")]
    SetTargetDensity {
        frame: usize,
        target_density: f32,
    },
    #[serde(rename_all = "camelCase")]
    SetPressureMultiplier {
        frame: usize,
        pressure_multiplier: f32,
    },
    #[serde(rename_all = "camelCase")]
    SetViscosityStrength {
        frame: usize,
        viscosity_strength: f32,
    },
    #[serde(rename_all = "camelCase")]
    SetSmoothingRadius {
        frame: usize,
        smoothing_radius: f32,
    },
    #[serde(rename_all = "camelCase")]
    SetInteractionStrength {
        frame: usize,
        interaction_strength: f32,
    },
    #[serde(rename_all = "camelCase")]
    SetInteractionRadius {
        frame: usize,
        interaction_radius: f32,
    },
    EnablePushInteraction {
        frame: usize,
        x: f32,
        y: f32,
    },
    EnablePullInteraction {
        frame: usize,
        x: f32,
        y: f32,
    },
    DisableInteraction {
        frame: usize,
    },
}

#[derive(Debug, Serialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum ServerMessage {
    Ready,
    #[serde(rename_all = "camelCase")]
    StartedRecording {
        recording_id: String,
    },
    #[serde(rename_all = "camelCase")]
    StoppedRecording {
        recording_id: String,
    },
    #[serde(rename_all = "camelCase")]
    Acknowledge {
        recording_id: String,
        frame: usize,
        parameter_changed: bool,
    },
    Error {
        message: String,
    },
}
