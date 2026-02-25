mod hashing;
mod kernels;
pub mod vector_2d;

use crate::vector_2d::Vector2D;
use crate::{
    hashing::{GRID_OFFSETS, get_cell, hash_cell, key_from_hash},
    kernels::{
        density_kernel, density_kernel_derivative, near_density_kernel,
        near_density_kernel_derivative, viscosity_kernel,
    },
};
use std::collections::HashMap;

use rayon::prelude::*;

pub struct Sim2D {
    // Fixed parameters
    particle_count: usize,
    particle_radius: f32,

    // Updated every step
    positions: Vec<Vector2D>,
    predicted_positions: Vec<Vector2D>,
    velocities: Vec<Vector2D>,
    velocity_magnitudes: Vec<f32>,
    densities: Vec<(f32, f32)>,
    pressure_forces: Vec<Vector2D>,
    viscous_forces: Vec<Vector2D>,

    // Spatial hashing
    cell_keys: Vec<(usize, usize)>,
    cell_offsets: HashMap<usize, usize>,

    // Updated when canvas size changes
    world_dimensions: Vector2D,

    // Parameters
    gravity: f32,
    target_density: f32,
    pressure_multiplier: f32,
    near_pressure_multiplier: f32,
    viscosity_strength: f32,
    collision_damping: f32,

    // User interaction
    interaction_position: Option<Vector2D>,
    interaction_scale: f32,
    interaction_strength: f32,
    interaction_radius: f32,

    // Constants
    smoothing_radius: f32,
}

impl Sim2D {
    #[allow(clippy::too_many_arguments)]
    pub fn new(
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
    ) -> Self {
        let mut positions: Vec<Vector2D> = Vec::with_capacity(particle_count);

        let half_w = 0.5 * world_width - particle_radius;
        let half_h = 0.5 * world_height - particle_radius;

        // Calculate grid dimensions
        let particles_per_row = (particle_count as f32).sqrt().ceil() as usize;
        let particles_per_col = particle_count.div_ceil(particles_per_row);

        // Calculate spacing between particles
        let spacing_x = (2.0 * half_w) / (particles_per_row - 1).max(1) as f32;
        let spacing_y = (2.0 * half_h) / (particles_per_col - 1).max(1) as f32;

        let mut particle_index = 0;
        for row in 0..particles_per_col {
            for col in 0..particles_per_row {
                if particle_index >= particle_count {
                    break;
                }

                let x = -half_w + col as f32 * spacing_x;
                let y = -half_h + row as f32 * spacing_y;
                positions.push(Vector2D::new(x, y));

                particle_index += 1;
            }
        }

        let velocities = vec![Vector2D::new(0.0, 0.0); particle_count];
        let velocity_magnitudes = vec![0.0; particle_count];
        let densities = vec![(0.0, 0.0); particle_count];
        let pressure_forces = vec![Vector2D::new(0.0, 0.0); particle_count];
        let viscous_forces = vec![Vector2D::new(0.0, 0.0); particle_count];

        let mut sim = Self {
            particle_count,
            particle_radius,

            positions: positions.clone(),
            predicted_positions: positions,
            velocities,
            velocity_magnitudes,
            densities,
            pressure_forces,
            viscous_forces,

            cell_keys: vec![(0, 0); particle_count],
            cell_offsets: HashMap::new(),

            world_dimensions: Vector2D::new(world_width, world_height),

            gravity,
            target_density,
            pressure_multiplier,
            near_pressure_multiplier: pressure_multiplier / 100.0,
            viscosity_strength,
            collision_damping: 0.95,

            interaction_position: None,
            interaction_scale: 0.0,
            interaction_strength,
            interaction_radius,

            smoothing_radius,
        };

        sim.step(0.0);
        sim
    }

    pub fn reset_sim(&mut self) {
        *self = Self::new(
            self.particle_count,
            self.particle_radius,
            self.world_dimensions.x,
            self.world_dimensions.y,
            self.gravity,
            self.target_density,
            self.pressure_multiplier,
            self.viscosity_strength,
            self.smoothing_radius,
            self.interaction_strength,
            self.interaction_radius,
        );
    }

    fn update_external_forces(&mut self, dt: f32) {
        self.positions
            .par_iter()
            .zip(self.predicted_positions.par_iter_mut())
            .zip(self.velocities.par_iter_mut())
            .for_each(|((position_ref, predicted_position_ref), velocity_ref)| {
                let mut acceleration = Vector2D::new(0.0, self.gravity);

                if let Some(interaction_input_point) = self.interaction_position {
                    let input_point_offset = interaction_input_point - *position_ref;
                    let distance_squared = input_point_offset.dot(input_point_offset);

                    if distance_squared < (self.interaction_radius * self.interaction_radius) {
                        let distance = distance_squared.sqrt();
                        if distance > f32::EPSILON {
                            let t = 1.0 - distance / self.interaction_radius;

                            let acceleration_weight = 1.0
                                - (t * (self.interaction_scale * self.interaction_strength / 10.0)
                                    .clamp(-1.0, 1.0));

                            acceleration = acceleration * acceleration_weight
                                + input_point_offset / distance
                                    * t
                                    * self.interaction_scale
                                    * self.interaction_strength;
                            acceleration -= *velocity_ref * t;
                        }
                    }
                }

                *velocity_ref += acceleration * dt;
                *predicted_position_ref = *position_ref + *velocity_ref * dt / 2.0;
            });
    }

    fn update_spatial_hashes(&mut self) {
        self.cell_keys
            .par_iter_mut()
            .zip(self.predicted_positions.par_iter())
            .enumerate()
            .for_each(|(i, (cell_key_ref, predicted_position_ref))| {
                let cell = get_cell(*predicted_position_ref, self.smoothing_radius);
                let hash = hash_cell(cell);
                let key = key_from_hash(hash, self.particle_count);

                *cell_key_ref = (key, i);
            });

        self.cell_keys.sort_unstable_by_key(|p| p.0);
        self.cell_offsets.clear();

        for (i, &(key, _original_i)) in self.cell_keys.iter().enumerate() {
            self.cell_offsets.entry(key).or_insert(i);
        }
    }

    fn update_densities(&mut self) {
        let radius_squared = self.smoothing_radius * self.smoothing_radius;

        self.densities.par_iter_mut().enumerate().for_each(
            |(sample_index, (density_ref, near_density_ref))| {
                let position = self.predicted_positions[sample_index];

                *density_ref = 0.0;
                *near_density_ref = 0.0;

                // Optimised
                let origin_cell = get_cell(position, self.smoothing_radius);
                for (x, y) in GRID_OFFSETS {
                    let hash = hash_cell((origin_cell.0 + x, origin_cell.1 + y));
                    let key = key_from_hash(hash, self.particle_count);

                    // reverse lookup key to iterate over all particles in cell
                    if let Some(cell_index) = self.cell_offsets.get(&key) {
                        let mut cell_index = *cell_index;
                        while cell_index < self.particle_count {
                            // this neighbour should share a key with current lookup cell
                            let (neighbour_key, neighbour_index) = self.cell_keys[cell_index];
                            cell_index += 1;

                            // iterated over all particles in current cell
                            if neighbour_key != key {
                                break;
                            }

                            let neighbour_position = self.predicted_positions[neighbour_index];
                            let offset_to_neighbour = neighbour_position - position;
                            let square_distance_to_neighbour =
                                offset_to_neighbour.dot(offset_to_neighbour);

                            if square_distance_to_neighbour > radius_squared {
                                continue;
                            }

                            let distance = square_distance_to_neighbour.sqrt();
                            *density_ref += density_kernel(distance, self.smoothing_radius);
                            *near_density_ref +=
                                near_density_kernel(distance, self.smoothing_radius);
                        }
                    }
                }
            },
        );
    }

    fn update_pressure_forces(&mut self, dt: f32) {
        let radius_squared = self.smoothing_radius * self.smoothing_radius;

        self.pressure_forces
            .par_iter_mut()
            .zip(self.velocities.par_iter_mut())
            .enumerate()
            .for_each(|(sample_index, (pressure_force_ref, velocity_ref))| {
                let position = self.predicted_positions[sample_index];

                let (density, near_density) = self.densities[sample_index];
                let pressure =
                    density_to_pressure(density, self.target_density, self.pressure_multiplier);
                let near_pressure =
                    density_to_near_pressure(near_density, self.near_pressure_multiplier);

                *pressure_force_ref = Vector2D::new(0.0, 0.0);

                // Optimised
                let origin_cell = get_cell(position, self.smoothing_radius);
                for (x, y) in GRID_OFFSETS {
                    let hash = hash_cell((origin_cell.0 + x, origin_cell.1 + y));
                    let key = key_from_hash(hash, self.particle_count);

                    // reverse lookup key to iterate over all particles in cell
                    if let Some(cell_index) = self.cell_offsets.get(&key) {
                        let mut cell_index = *cell_index;
                        while cell_index < self.particle_count {
                            // this neighbour should share a key with current lookup cell
                            let (neighbour_key, neighbour_index) = self.cell_keys[cell_index];
                            cell_index += 1;

                            // don't compare with self
                            if neighbour_index == sample_index {
                                continue;
                            }
                            // iterated over all particles in current cell
                            if neighbour_key != key {
                                break;
                            }

                            let neighbour_position = self.predicted_positions[neighbour_index];
                            let offset_to_neighbour = neighbour_position - position;
                            let squared_distance_to_neighbour =
                                offset_to_neighbour.dot(offset_to_neighbour);

                            if squared_distance_to_neighbour > radius_squared {
                                continue;
                            }

                            let distance = squared_distance_to_neighbour.sqrt();
                            let direction_to_neighbour = if distance > 0.0 {
                                offset_to_neighbour / distance
                            } else {
                                Vector2D::new(1.0, 1.0).normalise()
                            };

                            let (neighbour_density, neighbour_near_density) =
                                self.densities[neighbour_index];
                            let neighbour_pressure = density_to_pressure(
                                neighbour_density,
                                self.target_density,
                                self.pressure_multiplier,
                            );
                            let neighbour_near_pressure = density_to_near_pressure(
                                neighbour_near_density,
                                self.near_pressure_multiplier,
                            );

                            let shared_pressure = (pressure + neighbour_pressure) * 0.5;
                            let shared_near_pressure =
                                (near_pressure + neighbour_near_pressure) * 0.5;

                            *pressure_force_ref += direction_to_neighbour
                                * density_kernel_derivative(distance, self.smoothing_radius)
                                * shared_pressure
                                / neighbour_density;
                            *pressure_force_ref += direction_to_neighbour
                                * near_density_kernel_derivative(distance, self.smoothing_radius)
                                * shared_near_pressure
                                / neighbour_near_density;
                        }
                    }
                }

                if density != 0.0 {
                    let acceleration = *pressure_force_ref / density;
                    *velocity_ref += acceleration * dt;
                }
            });
    }

    fn update_viscous_forces(&mut self, dt: f32) {
        let radius_squared = self.smoothing_radius * self.smoothing_radius;

        self.viscous_forces
            .par_iter_mut()
            .zip(self.velocities.par_iter())
            .enumerate()
            .for_each(|(sample_index, (viscous_force_ref, velocity_ref))| {
                let position = self.predicted_positions[sample_index];

                *viscous_force_ref = Vector2D::new(0.0, 0.0);

                // Optimised
                let origin_cell = get_cell(position, self.smoothing_radius);
                for (x, y) in GRID_OFFSETS {
                    let hash = hash_cell((origin_cell.0 + x, origin_cell.1 + y));
                    let key = key_from_hash(hash, self.particle_count);

                    // reverse lookup key to iterate over all particles in cell
                    if let Some(cell_index) = self.cell_offsets.get(&key) {
                        let mut cell_index = *cell_index;
                        while cell_index < self.particle_count {
                            // this neighbour should share a key with current lookup cell
                            let (neighbour_key, neighbour_index) = self.cell_keys[cell_index];
                            cell_index += 1;

                            // don't compare with self
                            if neighbour_index == sample_index {
                                continue;
                            }
                            // iterated over all particles in current cell
                            if neighbour_key != key {
                                break;
                            }

                            let neighbour_position = self.predicted_positions[neighbour_index];
                            let offset_to_neighbour = neighbour_position - position;
                            let squared_distance_to_neighbour =
                                offset_to_neighbour.dot(offset_to_neighbour);

                            if squared_distance_to_neighbour > radius_squared {
                                continue;
                            }

                            let distance = squared_distance_to_neighbour.sqrt();
                            let neighbour_velocity = self.velocities[neighbour_index];
                            *viscous_force_ref += (neighbour_velocity - *velocity_ref)
                                * viscosity_kernel(distance, self.smoothing_radius);
                        }
                    }
                }
            });

        self.velocities
            .par_iter_mut()
            .zip(self.viscous_forces.par_iter())
            .for_each(|(velocity_ref, viscous_force_ref)| {
                *velocity_ref += *viscous_force_ref * self.viscosity_strength * dt;
            });
    }

    fn handle_collisions(
        position: &mut Vector2D,
        velocity: &mut Vector2D,
        world_dimensions: Vector2D,
        particle_radius: f32,
        collision_damping: f32,
    ) {
        let half = world_dimensions * 0.5 - Vector2D::new(particle_radius, particle_radius);
        let edge_distance = half - position.abs();

        if edge_distance.x <= 0.0 {
            position.x = half.x * position.x.signum();
            velocity.x *= -collision_damping;
        }

        if edge_distance.y <= 0.0 {
            position.y = half.y * position.y.signum();
            velocity.y *= -collision_damping;
        }
    }

    fn update_positions(&mut self, dt: f32) {
        self.positions
            .par_iter_mut()
            .zip(self.velocities.par_iter_mut())
            .for_each(|(position_ref, velocity_ref)| {
                *position_ref += *velocity_ref * dt;
                Self::handle_collisions(
                    position_ref,
                    velocity_ref,
                    self.world_dimensions,
                    self.particle_radius,
                    self.collision_damping,
                );
            });
    }

    pub fn step(&mut self, dt: f32) {
        let interval = 2;
        for _ in 0..interval {
            self.update_external_forces(dt / (interval as f32));
            self.update_spatial_hashes();
            self.update_densities();
            self.update_pressure_forces(dt / (interval as f32));
            self.update_viscous_forces(dt / (interval as f32));
            self.update_positions(dt / (interval as f32));
        }

        self.velocity_magnitudes
            .par_iter_mut()
            .zip(self.velocities.par_iter())
            .for_each(|(velocity_magnitudes_ref, velocity_ref)| {
                *velocity_magnitudes_ref = velocity_ref.magnitude()
            });
    }

    #[cfg(feature = "direct-access")]
    pub fn get_positions(&self) -> Vec<Vector2D> {
        self.positions.clone()
    }

    #[cfg(feature = "direct-access")]
    pub fn get_velocity_magnitudes(&self) -> Vec<f32> {
        self.velocity_magnitudes.clone()
    }

    #[cfg(feature = "direct-access")]
    pub fn get_world_width(&self) -> f32 {
        self.world_dimensions.x
    }

    #[cfg(feature = "direct-access")]
    pub fn get_world_height(&self) -> f32 {
        self.world_dimensions.y
    }

    #[cfg(feature = "direct-access")]
    pub fn get_particle_radius(&self) -> f32 {
        self.particle_radius
    }

    /* Pointers */
    pub fn get_positions_ptr(&self) -> *const u8 {
        self.positions.as_ptr() as *const u8
    }

    pub fn get_velocity_magnitudes_ptr(&self) -> *const u8 {
        self.velocity_magnitudes.as_ptr() as *const u8
    }

    /* Parameters */
    pub fn set_world_dimensions(&mut self, world_width: f32, world_height: f32) {
        self.world_dimensions = Vector2D::new(world_width, world_height);
    }

    pub fn set_gravity(&mut self, gravity: f32) {
        self.gravity = gravity;
    }

    pub fn set_target_density(&mut self, target_density: f32) {
        self.target_density = target_density;
    }

    pub fn set_pressure_multiplier(&mut self, pressure_multiplier: f32) {
        self.pressure_multiplier = pressure_multiplier;
        self.near_pressure_multiplier = pressure_multiplier / 100.0;
    }

    pub fn set_viscosity_strength(&mut self, viscosity_strength: f32) {
        self.viscosity_strength = viscosity_strength;
    }

    pub fn set_smoothing_radius(&mut self, smoothing_radius: f32) {
        self.smoothing_radius = smoothing_radius;
    }

    pub fn set_interaction_strength(&mut self, interaction_strength: f32) {
        self.interaction_strength = interaction_strength;
    }

    pub fn set_interaction_radius(&mut self, interaction_radius: f32) {
        self.interaction_radius = interaction_radius;
    }

    /* Interaction */
    pub fn enable_pull_interaction(&mut self, x: f32, y: f32) {
        self.interaction_position = Some(Vector2D::new(x, y));
        self.interaction_scale = 1.0;
    }

    pub fn enable_push_interaction(&mut self, x: f32, y: f32) {
        self.interaction_position = Some(Vector2D::new(x, y));
        self.interaction_scale = -1.0;
    }

    pub fn disable_interaction(&mut self) {
        self.interaction_position = None;
        self.interaction_scale = 0.0;
    }
}

fn density_to_pressure(density: f32, target_density: f32, pressure_multiplier: f32) -> f32 {
    (density - target_density) * pressure_multiplier
}

fn density_to_near_pressure(near_density: f32, near_pressure_multiplier: f32) -> f32 {
    near_pressure_multiplier * near_density
}
