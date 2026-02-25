use sim_core::Sim2D;

pub use wasm_bindgen_rayon::init_thread_pool;

use std::panic;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn init_wasm() {
    panic::set_hook(Box::new(console_error_panic_hook::hook));
}

#[wasm_bindgen]
pub struct WasmSim2D(Sim2D);

#[wasm_bindgen]
impl WasmSim2D {
    #[wasm_bindgen(constructor)]
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
        WasmSim2D(Sim2D::new(
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
        ))
    }

    pub fn reset_sim(&mut self) {
        self.0.reset_sim();
    }

    pub fn step(&mut self, dt: f32) {
        self.0.step(dt);
    }

    /* Pointers */
    pub fn get_positions_ptr(&self) -> *const u8 {
        self.0.get_positions_ptr()
    }

    pub fn get_velocity_magnitudes_ptr(&self) -> *const u8 {
        self.0.get_velocity_magnitudes_ptr()
    }

    /* Parameters */
    pub fn set_world_dimensions(&mut self, world_width: f32, world_height: f32) {
        self.0.set_world_dimensions(world_width, world_height);
    }

    pub fn set_gravity(&mut self, gravity: f32) {
        self.0.set_gravity(gravity);
    }

    pub fn set_target_density(&mut self, target_density: f32) {
        self.0.set_target_density(target_density);
    }

    pub fn set_pressure_multiplier(&mut self, pressure_multiplier: f32) {
        self.0.set_pressure_multiplier(pressure_multiplier);
    }

    pub fn set_viscosity_strength(&mut self, viscosity_strength: f32) {
        self.0.set_viscosity_strength(viscosity_strength);
    }

    pub fn set_smoothing_radius(&mut self, smoothing_radius: f32) {
        self.0.set_smoothing_radius(smoothing_radius);
    }

    pub fn set_interaction_strength(&mut self, interaction_strength: f32) {
        self.0.set_interaction_strength(interaction_strength);
    }

    pub fn set_interaction_radius(&mut self, interaction_radius: f32) {
        self.0.set_interaction_radius(interaction_radius);
    }

    /* Interaction */
    pub fn enable_pull_interaction(&mut self, x: f32, y: f32) {
        self.0.enable_pull_interaction(x, y);
    }

    pub fn enable_push_interaction(&mut self, x: f32, y: f32) {
        self.0.enable_push_interaction(x, y);
    }

    pub fn disable_interaction(&mut self) {
        self.0.disable_interaction();
    }
}
