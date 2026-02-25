use crate::vector_2d::Vector2D;

pub const GRID_OFFSETS: [(isize, isize); 9] = [
    (-1, 1),
    (0, 1),
    (1, 1),
    (-1, 0),
    (0, 0),
    (1, 0),
    (-1, -1),
    (0, -1),
    (1, -1),
];

pub fn get_cell(position: Vector2D, radius: f32) -> (isize, isize) {
    (
        (position.x / radius).floor() as isize,
        (position.y / radius).floor() as isize,
    )
}

// signed Cantor pairing function
pub fn hash_cell(cell: (isize, isize)) -> usize {
    let (x, y) = (
        if cell.0 >= 0 {
            2 * cell.0
        } else {
            -2 * cell.0 - 1
        } as usize,
        if cell.1 >= 0 {
            2 * cell.1
        } else {
            -2 * cell.1 - 1
        } as usize,
    );

    (((x + y) * (x + y + 1)) >> 1) + y
}

pub fn key_from_hash(hash: usize, table_size: usize) -> usize {
    hash % table_size
}
