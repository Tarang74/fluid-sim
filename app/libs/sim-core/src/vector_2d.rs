use std::ops::{Add, AddAssign, Div, Mul, Sub, SubAssign};

use bytemuck::{Pod, Zeroable};
use serde::{Deserialize, Serialize};

#[derive(Clone, Copy, Debug, PartialEq, PartialOrd, Pod, Zeroable, Serialize, Deserialize)]
#[repr(C)]
pub struct Vector2D {
    pub x: f32,
    pub y: f32,
}

impl Vector2D {
    pub fn new(x: f32, y: f32) -> Self {
        Self { x, y }
    }

    pub fn abs(self) -> Self {
        Self {
            x: self.x.abs(),
            y: self.y.abs(),
        }
    }

    pub fn magnitude(self) -> f32 {
        (self.x.powi(2) + self.y.powi(2)).sqrt()
    }

    pub fn dot(self, rhs: Self) -> f32 {
        self.x * rhs.x + self.y * rhs.y
    }

    pub fn normalise(self) -> Self {
        self / self.magnitude()
    }
}

impl Add for Vector2D {
    type Output = Self;

    fn add(self, rhs: Self) -> Self {
        Self {
            x: self.x + rhs.x,
            y: self.y + rhs.y,
        }
    }
}

impl Sub for Vector2D {
    type Output = Self;

    fn sub(self, rhs: Self) -> Self {
        Self {
            x: self.x - rhs.x,
            y: self.y - rhs.y,
        }
    }
}

impl Mul for Vector2D {
    type Output = Self;

    fn mul(self, rhs: Self) -> Self {
        Self {
            x: self.x * rhs.x,
            y: self.y * rhs.y,
        }
    }
}

impl Mul<f32> for Vector2D {
    type Output = Self;

    fn mul(self, rhs: f32) -> Self {
        Self {
            x: self.x * rhs,
            y: self.y * rhs,
        }
    }
}

impl Mul<Vector2D> for f32 {
    type Output = Vector2D;

    fn mul(self, rhs: Vector2D) -> Vector2D {
        Vector2D {
            x: self * rhs.x,
            y: self * rhs.y,
        }
    }
}

impl Div<f32> for Vector2D {
    type Output = Self;

    fn div(self, rhs: f32) -> Self {
        Self {
            x: self.x / rhs,
            y: self.y / rhs,
        }
    }
}

impl AddAssign for Vector2D {
    fn add_assign(&mut self, rhs: Self) {
        *self = *self + rhs;
    }
}

impl SubAssign for Vector2D {
    fn sub_assign(&mut self, rhs: Self) {
        *self = *self - rhs;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn vector_magnitude() {
        let a = Vector2D::new(3.0, -4.0);

        assert_eq!(a.magnitude(), 5.0);
    }

    #[test]
    fn vector_dot() {
        let a = Vector2D::new(3.0, -4.0);
        let b = Vector2D::new(-6.0, 1.0);

        assert_eq!(a.dot(b), 3.0 * -6.0 + -4.0 * 1.0);
    }

    #[test]
    fn vector_normalise() {
        let a = Vector2D::new(3.0, -4.0);

        assert_eq!(a.normalise(), Vector2D::new(3.0 / 5.0, -4.0 / 5.0));
    }

    #[test]
    fn vector_add() {
        let a = Vector2D::new(1.0, -3.0);
        let b = Vector2D::new(-5.0, 3.0);

        assert_eq!(a + b, Vector2D::new(-4.0, 0.0));
    }

    #[test]
    fn vector_sub() {
        let a = Vector2D::new(1.0, -3.0);
        let b = Vector2D::new(-5.0, 3.0);

        assert_eq!(a - b, Vector2D::new(6.0, -6.0));
    }

    #[test]
    fn vector_mul() {
        let a = Vector2D::new(1.0, -3.0);
        let b = Vector2D::new(-5.0, 3.0);

        assert_eq!(a * b, Vector2D::new(-5.0, -9.0));
    }

    #[test]
    fn vector_fmul() {
        let a = Vector2D::new(1.0, -3.0);
        let b = 5.0;

        assert_eq!(a * b, Vector2D::new(5.0, -15.0));
        assert_eq!(b * a, Vector2D::new(5.0, -15.0));
    }

    #[test]
    fn vector_fdiv() {
        let a = Vector2D::new(1.0, -3.0);
        let b = 5.0;

        assert_eq!(a / b, Vector2D::new(1.0 / 5.0, -3.0 / 5.0));
    }
}
