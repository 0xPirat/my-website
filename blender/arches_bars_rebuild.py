"""Rebuild the current Arches_All bars in Blender.

Run this inside Blender's scripting workspace.
It rebuilds only the `Arches_All` object and assigns the subtle marble
material used for the bars.
"""

from __future__ import annotations

import math

import bpy


UNIFORM_RADIUS = 0.54
FLOOR_Z = 0.0
ARCHES = [
    {"y": -1.0020, "x_left": -5.3664, "x_right": 5.3618, "z_top": 8.5168},
    {"y": 2.0002, "x_left": -7.6405, "x_right": -2.7500, "z_top": 7.0402},
    {"y": 2.0028, "x_left": 2.7796, "x_right": 7.6330, "z_top": 7.0119},
    {"y": 5.0003, "x_left": -5.3304, "x_right": 5.3289, "z_top": 8.5217},
    {"y": 8.0017, "x_left": -7.5930, "x_right": -2.7996, "z_top": 6.9994},
    {"y": 8.0032, "x_left": 2.8092, "x_right": 7.6042, "z_top": 6.9784},
    {"y": 11.0009, "x_left": -5.3775, "x_right": 5.3639, "z_top": 8.5491},
    {"y": 13.9970, "x_left": 2.7564, "x_right": 7.6566, "z_top": 7.0279},
    {"y": 14.0037, "x_left": -7.6323, "x_right": -2.7592, "z_top": 7.0258},
    {"y": 16.9980, "x_left": -5.3372, "x_right": 5.3358, "z_top": 8.4983},
    {"y": 23.0041, "x_left": -5.3297, "x_right": 5.3230, "z_top": 8.4999},
]


def ensure_bars_material() -> bpy.types.Material:
    mat = bpy.data.materials.get("Bars_Marble_Subtle")
    if mat is None:
        mat = bpy.data.materials.new("Bars_Marble_Subtle")
    mat.use_nodes = True

    nt = mat.node_tree
    nodes = nt.nodes
    links = nt.links
    nodes.clear()

    out = nodes.new("ShaderNodeOutputMaterial")
    out.location = (920, 0)

    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.location = (660, 0)
    bsdf.inputs["Base Color"].default_value = (0.95, 0.95, 0.955, 1.0)
    bsdf.inputs["Roughness"].default_value = 0.32
    bsdf.inputs["Specular IOR Level"].default_value = 0.42

    texcoord = nodes.new("ShaderNodeTexCoord")
    texcoord.location = (-1280, -120)

    mapping = nodes.new("ShaderNodeMapping")
    mapping.location = (-1060, -120)
    mapping.inputs["Rotation"].default_value = (0.28, 0.86, 0.32)
    mapping.inputs["Scale"].default_value = (0.92, 0.92, 0.92)

    noise_base = nodes.new("ShaderNodeTexNoise")
    noise_base.location = (-840, 200)
    noise_base.inputs["Scale"].default_value = 1.8
    noise_base.inputs["Detail"].default_value = 4.0
    noise_base.inputs["Roughness"].default_value = 0.42
    noise_base.inputs["Distortion"].default_value = 0.03

    base_ramp = nodes.new("ShaderNodeValToRGB")
    base_ramp.location = (-620, 200)
    base_ramp.color_ramp.elements[0].position = 0.28
    base_ramp.color_ramp.elements[0].color = (0.94, 0.943, 0.948, 1.0)
    base_ramp.color_ramp.elements[1].position = 0.86
    base_ramp.color_ramp.elements[1].color = (0.985, 0.985, 0.988, 1.0)

    noise_distort = nodes.new("ShaderNodeTexNoise")
    noise_distort.location = (-840, -180)
    noise_distort.inputs["Scale"].default_value = 2.0
    noise_distort.inputs["Detail"].default_value = 10.0
    noise_distort.inputs["Roughness"].default_value = 0.55
    noise_distort.inputs["Distortion"].default_value = 0.0

    wave = nodes.new("ShaderNodeTexWave")
    wave.location = (-600, -120)
    wave.wave_type = "BANDS"
    wave.bands_direction = "DIAGONAL"
    wave.inputs["Scale"].default_value = 2.15
    wave.inputs["Distortion"].default_value = 8.0
    wave.inputs["Detail"].default_value = 6.0
    wave.inputs["Detail Scale"].default_value = 1.1
    wave.inputs["Detail Roughness"].default_value = 0.5

    noise_break = nodes.new("ShaderNodeTexNoise")
    noise_break.location = (-600, -380)
    noise_break.inputs["Scale"].default_value = 6.0
    noise_break.inputs["Detail"].default_value = 8.0
    noise_break.inputs["Roughness"].default_value = 0.5
    noise_break.inputs["Distortion"].default_value = 0.0

    vein_mult = nodes.new("ShaderNodeMath")
    vein_mult.location = (-360, -220)
    vein_mult.operation = "MULTIPLY"
    vein_mult.inputs[1].default_value = 1.0

    vein_ramp = nodes.new("ShaderNodeValToRGB")
    vein_ramp.location = (-120, -220)
    ramp = vein_ramp.color_ramp
    ramp.elements[0].position = 0.0
    ramp.elements[0].color = (1.0, 1.0, 1.0, 1.0)
    ramp.elements[1].position = 1.0
    ramp.elements[1].color = (1.0, 1.0, 1.0, 1.0)
    ramp.elements.new(0.86).color = (1.0, 1.0, 1.0, 1.0)
    ramp.elements.new(0.895).color = (0.14, 0.14, 0.15, 1.0)
    ramp.elements.new(0.925).color = (0.92, 0.92, 0.93, 1.0)
    ramp.elements.new(0.965).color = (1.0, 1.0, 1.0, 1.0)

    mix = nodes.new("ShaderNodeMixRGB")
    mix.location = (180, 20)
    mix.blend_type = "MULTIPLY"
    mix.inputs["Fac"].default_value = 0.56

    bump = nodes.new("ShaderNodeBump")
    bump.location = (200, -240)
    bump.inputs["Strength"].default_value = 0.018
    bump.inputs["Distance"].default_value = 0.008

    links.new(texcoord.outputs["Object"], mapping.inputs["Vector"])
    links.new(mapping.outputs["Vector"], noise_base.inputs["Vector"])
    links.new(mapping.outputs["Vector"], noise_distort.inputs["Vector"])
    links.new(mapping.outputs["Vector"], wave.inputs["Vector"])
    links.new(mapping.outputs["Vector"], noise_break.inputs["Vector"])

    links.new(noise_base.outputs["Fac"], base_ramp.inputs["Fac"])
    links.new(noise_distort.outputs["Fac"], wave.inputs["Distortion"])
    links.new(wave.outputs["Fac"], vein_mult.inputs[0])
    links.new(noise_break.outputs["Fac"], vein_mult.inputs[1])
    links.new(vein_mult.outputs["Value"], vein_ramp.inputs["Fac"])

    links.new(base_ramp.outputs["Color"], mix.inputs["Color1"])
    links.new(vein_ramp.outputs["Color"], mix.inputs["Color2"])
    links.new(vein_mult.outputs["Value"], bump.inputs["Height"])

    links.new(mix.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])

    return mat


def build_arch_points(arch: dict[str, float]) -> list[tuple[float, float, float]]:
    x_left = arch["x_left"] + UNIFORM_RADIUS
    x_right = arch["x_right"] - UNIFORM_RADIUS
    base_z = FLOOR_Z + UNIFORM_RADIUS
    top_centerline_z = arch["z_top"] - UNIFORM_RADIUS
    y = arch["y"]

    span = x_right - x_left
    arc_radius = span * 0.5
    available_height = top_centerline_z - base_z
    if arc_radius > available_height:
        arc_radius = available_height
    leg_height = max(available_height - arc_radius, 0.0)
    arc_center_x = (x_left + x_right) * 0.5
    arc_center_z = base_z + leg_height

    points: list[tuple[float, float, float]] = []
    leg_steps = max(4, int(round((leg_height if leg_height > 0.001 else 1.5) / 0.35)))
    for i in range(leg_steps + 1):
        z = base_z + leg_height * (i / leg_steps)
        points.append((x_left, y, z))

    arc_steps = 28
    for i in range(1, arc_steps):
        t = i / arc_steps
        angle = math.pi - math.pi * t
        x = arc_center_x + arc_radius * math.cos(angle)
        z = arc_center_z + arc_radius * math.sin(angle)
        points.append((x, y, z))

    for i in range(leg_steps, -1, -1):
        z = base_z + leg_height * (i / leg_steps)
        points.append((x_right, y, z))

    return points


def build_arches_mesh() -> bpy.types.Mesh:
    curve_data = bpy.data.curves.new("Arches_All_Rebuild_TMP", type="CURVE")
    curve_data.dimensions = "3D"
    curve_data.fill_mode = "FULL"
    curve_data.bevel_depth = 1.0
    curve_data.bevel_resolution = 14
    curve_data.resolution_u = 24
    curve_data.render_resolution_u = 24
    curve_data.use_fill_caps = True

    for arch in ARCHES:
        points = build_arch_points(arch)
        spline = curve_data.splines.new("POLY")
        spline.points.add(len(points) - 1)
        for spline_point, (x, y, z) in zip(spline.points, points):
            spline_point.co = (x, y, z, 1.0)
            spline_point.radius = UNIFORM_RADIUS

    curve_obj = bpy.data.objects.new("Arches_All_Rebuild_TMP", curve_data)
    bpy.context.scene.collection.objects.link(curve_obj)

    depsgraph = bpy.context.evaluated_depsgraph_get()
    mesh = bpy.data.meshes.new_from_object(curve_obj.evaluated_get(depsgraph))
    mesh.name = "Arches_All_Mesh"

    bpy.data.objects.remove(curve_obj, do_unlink=True)
    if curve_data.users == 0:
        bpy.data.curves.remove(curve_data)

    return mesh


def rebuild_arches_all() -> bpy.types.Object:
    obj = bpy.data.objects.get("Arches_All")
    if obj is None:
        obj = bpy.data.objects.new("Arches_All", build_arches_mesh())
        bpy.context.scene.collection.objects.link(obj)
    else:
        old_mesh = obj.data
        obj.data = build_arches_mesh()
        if old_mesh and old_mesh.users == 0:
            bpy.data.meshes.remove(old_mesh)

    for poly in obj.data.polygons:
        poly.use_smooth = True

    mat = ensure_bars_material()
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    return obj


if __name__ == "__main__":
    rebuilt = rebuild_arches_all()
    print(f"Rebuilt {rebuilt.name} with {len(ARCHES)} bar components.")
