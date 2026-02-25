use std::f32::consts::PI;

// Spiky
pub fn density_kernel(distance: f32, radius: f32) -> f32 {
    let volume = PI * radius.powi(4) / 6.0;
    if distance < radius {
        (radius - distance).powi(2) / volume
    } else {
        0.0
    }
}

pub fn near_density_kernel(distance: f32, radius: f32) -> f32 {
    let volume = PI * radius.powi(5) / 10.0;
    if distance < radius {
        (radius - distance).powi(3) / volume
    } else {
        0.0
    }
}

pub fn density_kernel_derivative(distance: f32, radius: f32) -> f32 {
    let volume = PI * radius.powi(4) / 6.0;
    if distance <= radius {
        -2.0 * (radius - distance) / volume
    } else {
        0.0
    }
}

pub fn near_density_kernel_derivative(distance: f32, radius: f32) -> f32 {
    let volume = PI * radius.powi(5) / 10.0;
    if distance <= radius {
        -3.0 * (radius - distance).powi(2) / volume
    } else {
        0.0
    }
}

// Poly6
pub fn viscosity_kernel(distance: f32, radius: f32) -> f32 {
    let volume = PI * radius.powi(8) / 4.0;
    if distance < radius {
        (radius * radius - distance * distance).powi(3) / volume
    } else {
        0.0
    }
}
