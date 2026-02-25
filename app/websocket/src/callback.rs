use std::net::SocketAddr;

use axum::{
    body::Bytes,
    extract::ws::{Message, WebSocket},
};
use chrono::Utc;
use sim_core::Sim2D;

use crate::{
    protocol::{ClientMessage, ServerMessage},
    sqs::send_to_sqs,
};

pub async fn sim_callback(mut socket: WebSocket, peer: SocketAddr, session_id: String) {
    println!("Connection with {peer} upgraded");
    send(&mut socket, ServerMessage::Ready).await;

    let mut timestamp = Utc::now();

    let mut sim = None;
    let mut current_frame = 0;

    let mut simulation_id_global = String::new();

    while let Some(Ok(message)) = socket.recv().await {
        println!("{peer} > {message:?}");
        match message {
            Message::Text(text) => match serde_json::from_str::<ClientMessage>(&text) {
                Ok(ClientMessage::StartRecording {
                    simulation_id,
                    particle_count,
                    particle_radius,
                    world_width,
                    world_height,
                    gravity,
                    target_density,
                    pressure_multiplier,
                    viscosity_strength,
                    smoothing_radius,
                    interaction_strength,
                    interaction_radius,
                }) => {
                    sim = Some(Sim2D::new(
                        particle_count,
                        particle_radius,
                        world_width,
                        world_height,
                        gravity,
                        target_density,
                        pressure_multiplier,
                        viscosity_strength,
                        smoothing_radius,
                        interaction_strength,
                        interaction_radius,
                    ));

                    timestamp = Utc::now();
                    simulation_id_global = simulation_id.clone();

                    send(
                        &mut socket,
                        ServerMessage::StartedRecording {
                            recording_id: 0.to_string(),
                        },
                    )
                    .await
                }
                Ok(ClientMessage::StopRecording) => {
                    send(
                        &mut socket,
                        ServerMessage::StoppedRecording {
                            recording_id: 0.to_string(),
                        },
                    )
                    .await;

                    sim = None;
                }
                Ok(ClientMessage::Step { frame, dt }) => {
                    // Don't rerender same frame
                    if current_frame == frame {
                        if let Some(s) = sim.as_mut() {
                            s.step(dt);

                            // Send binary to SQS queue
                            if send_to_sqs(
                                session_id.clone(),
                                simulation_id_global.clone(),
                                frame,
                                s.get_positions(),
                                s.get_velocity_magnitudes(),
                                s.get_world_width(),
                                s.get_world_height(),
                                s.get_particle_radius(),
                                timestamp,
                            )
                            .await
                            .is_ok()
                            {
                                send(
                                    &mut socket,
                                    ServerMessage::Acknowledge {
                                        recording_id: 0.to_string(),
                                        frame,
                                        parameter_changed: false,
                                    },
                                )
                                .await;
                            }
                        }

                        current_frame += 1;
                    }
                }
                Ok(ClientMessage::SetGravity { frame, gravity }) => {
                    if current_frame == frame {
                        if let Some(s) = sim.as_mut() {
                            s.set_gravity(gravity);
                        }

                        send(
                            &mut socket,
                            ServerMessage::Acknowledge {
                                recording_id: 0.to_string(),
                                frame,
                                parameter_changed: true,
                            },
                        )
                        .await;
                    }
                }
                Ok(ClientMessage::SetTargetDensity {
                    frame,
                    target_density,
                }) => {
                    if current_frame == frame {
                        if let Some(s) = sim.as_mut() {
                            s.set_target_density(target_density);
                        }

                        send(
                            &mut socket,
                            ServerMessage::Acknowledge {
                                recording_id: 0.to_string(),
                                frame,
                                parameter_changed: true,
                            },
                        )
                        .await;
                    }
                }
                Ok(ClientMessage::SetPressureMultiplier {
                    frame,
                    pressure_multiplier,
                }) => {
                    if current_frame == frame {
                        if let Some(s) = sim.as_mut() {
                            s.set_pressure_multiplier(pressure_multiplier);
                        }

                        send(
                            &mut socket,
                            ServerMessage::Acknowledge {
                                recording_id: 0.to_string(),
                                frame,
                                parameter_changed: true,
                            },
                        )
                        .await;
                    }
                }
                Ok(ClientMessage::SetViscosityStrength {
                    frame,
                    viscosity_strength,
                }) => {
                    if current_frame == frame {
                        if let Some(s) = sim.as_mut() {
                            s.set_viscosity_strength(viscosity_strength);
                        }

                        send(
                            &mut socket,
                            ServerMessage::Acknowledge {
                                recording_id: 0.to_string(),
                                frame,
                                parameter_changed: true,
                            },
                        )
                        .await;
                    }
                }
                Ok(ClientMessage::SetSmoothingRadius {
                    frame,
                    smoothing_radius,
                }) => {
                    if current_frame == frame {
                        if let Some(s) = sim.as_mut() {
                            s.set_smoothing_radius(smoothing_radius);
                        }

                        send(
                            &mut socket,
                            ServerMessage::Acknowledge {
                                recording_id: 0.to_string(),
                                frame,
                                parameter_changed: true,
                            },
                        )
                        .await;
                    }
                }
                Ok(ClientMessage::SetInteractionStrength {
                    frame,
                    interaction_strength,
                }) => {
                    if current_frame == frame {
                        if let Some(s) = sim.as_mut() {
                            s.set_interaction_strength(interaction_strength);
                        }

                        send(
                            &mut socket,
                            ServerMessage::Acknowledge {
                                recording_id: 0.to_string(),
                                frame,
                                parameter_changed: true,
                            },
                        )
                        .await;
                    }
                }
                Ok(ClientMessage::SetInteractionRadius {
                    frame,
                    interaction_radius,
                }) => {
                    if current_frame == frame {
                        if let Some(s) = sim.as_mut() {
                            s.set_interaction_radius(interaction_radius);
                        }

                        send(
                            &mut socket,
                            ServerMessage::Acknowledge {
                                recording_id: 0.to_string(),
                                frame,
                                parameter_changed: true,
                            },
                        )
                        .await;
                    }
                }

                Ok(ClientMessage::EnablePushInteraction { frame, x, y }) => {
                    if current_frame == frame {
                        if let Some(s) = sim.as_mut() {
                            s.enable_push_interaction(x, y);
                        }

                        send(
                            &mut socket,
                            ServerMessage::Acknowledge {
                                recording_id: 0.to_string(),
                                frame,
                                parameter_changed: true,
                            },
                        )
                        .await;
                    }
                }
                Ok(ClientMessage::EnablePullInteraction { frame, x, y }) => {
                    if current_frame == frame {
                        if let Some(s) = sim.as_mut() {
                            s.enable_pull_interaction(x, y);
                        }

                        send(
                            &mut socket,
                            ServerMessage::Acknowledge {
                                recording_id: 0.to_string(),
                                frame,
                                parameter_changed: true,
                            },
                        )
                        .await;
                    }
                }
                Ok(ClientMessage::DisableInteraction { frame }) => {
                    if current_frame == frame {
                        if let Some(s) = sim.as_mut() {
                            s.disable_interaction();
                        }

                        send(
                            &mut socket,
                            ServerMessage::Acknowledge {
                                recording_id: 0.to_string(),
                                frame,
                                parameter_changed: true,
                            },
                        )
                        .await;
                    }
                }

                Err(error) => {
                    println!("Invalid message: {error:?}");
                    send(
                        &mut socket,
                        ServerMessage::Error {
                            message: format!("Invalid message: {error:?}"),
                        },
                    )
                    .await;
                }
            },
            Message::Ping(_) => {
                let _ = socket.send(Message::Pong(Bytes::from("PONG"))).await;
            }
            Message::Close(_) => {
                sim = None;
            }
            x => {
                println!("Message type not supported: {x:?}")
            }
        }
    }

    println!("Connection with {peer} closed");
}

async fn send(socket: &mut WebSocket, message: ServerMessage) {
    let _ = socket
        .send(Message::Text(
            serde_json::to_string(&message).unwrap().into(),
        ))
        .await;
}
