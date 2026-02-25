import json
import os
import sys

import bmesh
import bpy


def read_frame_json(json_path):
    with open(json_path, 'r') as f:
        data = json.load(f)

    positions = data['positions']
    velocity_magnitudes = data['velocity_magnitudes']

    # Flatten positions
    position_flat = []
    for pos in positions:
        position_flat.extend([pos['x'], pos['y']])

    return tuple(position_flat), velocity_magnitudes


def turbo_colormap(x):
    t = min(1, max(0, x))
    t2 = t * t
    t3 = t2 * t
    t4 = t3 * t
    t5 = t4 * t

    r = 0.13572138 + \
        4.6153926 * t + \
        -42.66032258 * t2 + \
        132.13108234 * t3 + \
        -152.94239396 * t4 \
        + 59.28637943 * t5
    g = 0.09140261 + \
        2.19418839 * t + \
        4.84296658 * t2 + \
        -14.18503333 * t3 + \
        4.27729857 * t4 + \
        2.82956604 * t5
    b = 0.1066733 + \
        12.64194608 * t + \
        -60.58204836 * t2 + \
        110.36276771 * t3 + \
        -89.90310912 * t4 + \
        27.34824973 * t5

    return (
        min(1, max(0, r)),
        min(1, max(0, g)),
        min(1, max(0, b)),
    )


def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False, confirm=False)


def setup_scene(world_width, world_height):
    clear_scene()

    # Set world background to black
    world = bpy.data.worlds.new("FluidWorld")
    world.use_nodes = True
    world.node_tree.nodes.clear()
    background_node = world.node_tree.nodes.new(type='ShaderNodeBackground')
    background_node.inputs[0].default_value = (0, 0, 0, 1)  # Black
    output_node = world.node_tree.nodes.new(type='ShaderNodeOutputWorld')
    world.node_tree.links.new(
        background_node.outputs[0], output_node.inputs[0])
    bpy.context.scene.world = world

    # Setup camera centered at origin, looking down
    bpy.ops.object.camera_add(location=(0, 0, max(world_width, world_height)))
    camera = bpy.context.object
    camera.data.type = 'ORTHO'
    # Set orthographic scale to exactly fit world dimensions
    camera.data.ortho_scale = max(world_width, world_height)
    camera.rotation_euler = (0, 0, 0)  # Looking straight down
    bpy.context.scene.camera = camera

    # Setup lighting
    bpy.ops.object.light_add(type='SUN', location=(0, 0, world_height))
    light = bpy.context.object
    light.data.energy = 5.0


def create_velocity_materials(num_materials=20):
    materials = []
    for i in range(num_materials):
        velocity_normalized = i / (num_materials - 1)

        material_name = f"VelocityMat_{i:02d}"
        material = bpy.data.materials.new(name=material_name)
        material.use_nodes = True

        # Clear default nodes
        material.node_tree.nodes.clear()

        # Create emission shader
        emission_node = material.node_tree.nodes.new(type='ShaderNodeEmission')
        color = turbo_colormap(velocity_normalized)
        emission_node.inputs[0].default_value = (*color, 1.0)
        emission_node.inputs[1].default_value = 1.5

        # Create output node
        output_node = material.node_tree.nodes.new(
            type='ShaderNodeOutputMaterial')
        material.node_tree.links.new(
            emission_node.outputs[0], output_node.inputs[0])

        materials.append(material)

    return materials


def get_material_index(velocity_normalized, num_materials):
    return min(int(velocity_normalized * num_materials), num_materials - 1)


def create_particle_mesh(particle_radius):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(
        bm, u_segments=12, v_segments=8, radius=particle_radius)

    # Create mesh object
    mesh = bpy.data.meshes.new("ParticleTemplate")
    bm.to_mesh(mesh)
    bm.free()

    # Create object
    particle_template = bpy.data.objects.new("ParticleTemplate", mesh)
    bpy.context.collection.objects.link(particle_template)

    return particle_template


def setup_render_settings(output_directory, world_width, world_height):
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
    scene.render.resolution_x = int(world_width * 100)
    scene.render.resolution_y = int(world_height * 100)
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'

    # Optimize EEVEE settings
    scene.eevee.taa_render_samples = 32
    scene.eevee.use_gtao = False
    scene.eevee.use_volumetric_shadows = False


def render_single_frame(json_path, particle_count, world_width, world_height, particle_radius, output_directory):
    materials = create_velocity_materials(num_materials=20)
    particle_template = create_particle_mesh(particle_radius)

    particles = []
    for particle_index in range(particle_count):
        # Duplicate template for each particle
        new_particle = particle_template.copy()
        new_particle.data = particle_template.data.copy()
        new_particle.name = f"Particle_{particle_index:04d}"
        bpy.context.collection.objects.link(new_particle)

        # Assign initial material
        new_particle.data.materials.append(materials[0])

        particles.append(new_particle)

    # Remove template
    bpy.data.objects.remove(particle_template, do_unlink=True)
    setup_render_settings(output_directory, world_width, world_height)

    min_velocity = 0.3
    velocity_range = 4.0

    # Read single JSON frame
    positions, velocities = read_frame_json(json_path)

    for particle_index in range(particle_count):
        particle = particles[particle_index]

        pos_x = positions[2 * particle_index + 0]
        pos_y = positions[2 * particle_index + 1]
        particle.location = (pos_x, pos_y, 0.0)

        velocity = velocities[particle_index]
        velocity_normalized = (velocity - min_velocity) / velocity_range
        material_index = get_material_index(
            velocity_normalized, len(materials))

        if particle.data.materials:
            particle.data.materials[0] = materials[material_index]
        else:
            particle.data.materials.append(materials[material_index])

    # Extract frame number from JSON
    frame_number = int(os.path.splitext(os.path.basename(json_path))[0])

    frame_filename = f"{frame_number:05d}.png"
    bpy.context.scene.render.filepath = os.path.join(
        output_directory, frame_filename)
    bpy.ops.render.render(write_still=True)


def main():
    if len(sys.argv) < 6:
        raise SystemExit(
            "Usage: blender -b -P render.py -- <json_frame_path> <out_dir> <world_width> <world_height> <particle_radius>")

    json_path = sys.argv[-5]
    output_directory = sys.argv[-4]
    world_width = float(sys.argv[-3])
    world_height = float(sys.argv[-2])
    particle_radius = float(sys.argv[-1])

    os.makedirs(output_directory, exist_ok=True)

    # get particle count
    with open(json_path, 'r') as f:
        data = json.load(f)
    particle_count = len(data['positions'])

    setup_scene(world_width, world_height)

    render_single_frame(
        json_path, particle_count, world_width, world_height, particle_radius, output_directory)


if __name__ == "__main__":
    main()
