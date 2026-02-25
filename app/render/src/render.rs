use std::{
    fs,
    path::{Path, PathBuf},
    process::Command,
};

pub fn render(
    json_path: &Path,
    out_dir: &Path,
    blender_script: &Path,
    blender_path: &Path,
    world_width: f32,
    world_height: f32,
    particle_radius: f32,
) -> std::io::Result<()> {
    fs::create_dir_all(out_dir)?;

    let blender = PathBuf::from(blender_path);

    let mut binding = Command::new(&blender);
    let status = binding.args([
        "-b",
        "--factory-startup",
        "-noaudio",
        "-P",
        blender_script.to_str().unwrap(),
        "--",
        json_path.to_str().unwrap(),
        out_dir.to_str().unwrap(),
        &world_width.to_string(),
        &world_height.to_string(),
        &particle_radius.to_string(),
    ]);

    if let Ok(status) = status.status()
        && !status.success()
    {
        return Err(std::io::Error::other(format!(
            "Blender exited with an error: {:?}",
            status.code()
        )));
    }

    Ok(())
}
