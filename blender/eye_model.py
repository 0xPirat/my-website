import bpy
import bmesh
import math
from mathutils import Vector

# ====== CLEAR SCENE ======
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for block in bpy.data.meshes:
    if block.users == 0:
        bpy.data.meshes.remove(block)
for block in bpy.data.materials:
    if block.users == 0:
        bpy.data.materials.remove(block)

# ====== SCLERA MATERIAL WITH BLOOD VESSELS ======
def create_sclera_material():
    mat = bpy.data.materials.new(name="Sclera_Material")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    output = nodes.new('ShaderNodeOutputMaterial')
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Roughness'].default_value = 0.05
    bsdf.inputs['Specular IOR Level'].default_value = 0.8

    # Noise for reddish patches (veins/irritation)
    tex_coord = nodes.new('ShaderNodeTexCoord')
    noise = nodes.new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = 15.0
    noise.inputs['Detail'].default_value = 10.0
    noise.inputs['Roughness'].default_value = 0.6
    
    color_ramp = nodes.new('ShaderNodeValToRGB')
    color_ramp.color_ramp.elements[0].position = 0.45
    color_ramp.color_ramp.elements[0].color = (0.95, 0.94, 0.93, 1.0) # White
    color_ramp.color_ramp.elements[1].position = 0.65
    color_ramp.color_ramp.elements[1].color = (0.5, 0.1, 0.1, 1.0) # Red veins

    links.new(tex_coord.outputs['Generated'], noise.inputs['Vector'])
    links.new(noise.outputs['Fac'], color_ramp.inputs['Fac'])
    links.new(color_ramp.outputs['Color'], bsdf.inputs['Base Color'])
    
    links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    return mat

# ====== REFINED IRIS MATERIAL (RADIAL FIBERS) ======
def create_iris_material():
    mat = bpy.data.materials.new(name="Iris_Material")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    output = nodes.new('ShaderNodeOutputMaterial')
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Roughness'].default_value = 0.2

    # Radial fiber pattern using UV coordinate trick
    tex_coord = nodes.new('ShaderNodeTexCoord')
    mapping = nodes.new('ShaderNodeMapping')
    mapping.inputs['Location'].default_value = (-0.5, -0.5, 0)
    
    # Gradient Texture (Radial)
    grad = nodes.new('ShaderNodeTexGradient')
    grad.gradient_type = 'RADIAL'
    
    # Noise for organic fibers
    noise = nodes.new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = 250.0
    noise.inputs['Detail'].default_value = 15.0
    
    mix = nodes.new('ShaderNodeMixRGB')
    mix.blend_type = 'OVERLAY'
    mix.inputs['Fac'].default_value = 0.8
    
    color_ramp = nodes.new('ShaderNodeValToRGB')
    # Green tones from screenshots
    color_ramp.color_ramp.elements[0].color = (0.01, 0.1, 0.01, 1.0) # Dark green
    color_ramp.color_ramp.elements[1].color = (0.2, 0.7, 0.2, 1.0) # Bright green
    
    links.new(tex_coord.outputs['UV'], mapping.inputs['Vector'])
    links.new(mapping.outputs['Vector'], grad.inputs['Vector'])
    links.new(grad.outputs['Fac'], noise.inputs['Vector']) # Use radial as vector for noise
    links.new(noise.outputs['Fac'], mix.inputs['Color1'])
    links.new(grad.outputs['Fac'], mix.inputs['Color2'])
    links.new(mix.outputs['Color'], color_ramp.inputs['Fac'])
    links.new(color_ramp.outputs['Color'], bsdf.inputs['Base Color'])
    
    # Add bump for fiber depth
    bump = nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = 0.5
    links.new(noise.outputs['Fac'], bump.inputs['Height'])
    links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])

    links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    return mat

# ====== PUPIL MATERIAL ======
def create_pupil_material():
    mat = bpy.data.materials.new(name="Pupil_Material")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    output = nodes.new('ShaderNodeOutputMaterial')
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (0.005, 0.005, 0.005, 1.0)
    bsdf.inputs['Roughness'].default_value = 0.02
    bsdf.inputs['Specular IOR Level'].default_value = 1.0
    links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    return mat

# ====== CREATE SCLERA WITH DEEP RECESSED SOCKET ======
def create_sclera(sclera_mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=48, radius=1.0, location=(0, 0, 0))
    sclera = bpy.context.active_object
    sclera.name = "Sclera"

    bpy.ops.object.mode_set(mode='EDIT')
    bm = bmesh.from_edit_mesh(sclera.data)
    
    # Front facing camera at y = -3.5
    opening_radius = 0.45
    to_delete = []
    for face in bm.faces:
        c = face.calc_center_median()
        dist_xz = math.sqrt(c.x**2 + c.z**2)
        if c.y < -0.85 and dist_xz < opening_radius:
            to_delete.append(face)
    
    bmesh.ops.delete(bm, geom=to_delete, context='FACES')
    
    bm.edges.ensure_lookup_table()
    boundary_edges = [e for e in bm.edges if e.is_boundary]
    
    # Extrude boundary inwards to create the recessed depth
    res = bmesh.ops.extrude_edge_only(bm, edges=boundary_edges)
    new_verts = [v for v in res['geom'] if isinstance(v, bmesh.types.BMVert)]
    
    socket_depth = 0.15 # 0.15 inwards
    for v in new_verts:
        v.co.y += socket_depth
        v.co.x *= 0.85 # Tapered
        v.co.z *= 0.85
        
    bmesh.update_edit_mesh(sclera.data)
    bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.shade_smooth()
    sclera.data.materials.append(sclera_mat)
    return sclera

# ====== CREATE RECESSED IRIS ======
def create_iris(iris_mat, y_pos):
    bpy.ops.mesh.primitive_circle_add(vertices=64, radius=0.42, fill_type='NGON', location=(0, y_pos, 0))
    iris = bpy.context.active_object
    iris.name = "Iris"
    iris.rotation_euler = (math.radians(90), 0, 0)
    bpy.ops.object.transform_apply(rotation=True)

    bpy.ops.object.mode_set(mode='EDIT')
    bm = bmesh.from_edit_mesh(iris.data)
    bpy.ops.mesh.subdivide(number_cuts=6)
    bm = bmesh.from_edit_mesh(iris.data) # Refresh
    for vert in bm.verts:
        dist = math.sqrt(vert.co.x**2 + vert.co.z**2)
        # Deeply concave center
        depth_factor = (1.0 - (dist / 0.42)) ** 1.5
        vert.co.y += depth_factor * 0.12 # Push center inwards (+Y)
        
    bmesh.update_edit_mesh(iris.data)
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.unwrap(method='ANGLE_BASED')
    bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.shade_smooth()
    iris.data.materials.append(iris_mat)
    return iris

# ====== CREATE PUPIL ======
def create_pupil(pupil_mat, y_pos):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.15, location=(0, y_pos + 0.05, 0))
    pupil = bpy.context.active_object
    pupil.name = "Pupil"
    pupil.scale.y = 0.2 # Dome shape
    bpy.ops.object.transform_apply(scale=True)
    bpy.ops.object.shade_smooth()
    pupil.data.materials.append(pupil_mat)
    return pupil

# ====== SETUP SCENE ======
def setup_scene():
    bpy.context.scene.render.engine = 'CYCLES'
    for obj in bpy.data.objects:
        if obj.type == 'CAMERA':
            obj.location = (0, -3.5, 0)
            obj.rotation_euler = (math.radians(90), 0, 0)
            break
    
    # Studio lighting
    bpy.ops.object.light_add(type='AREA', location=(2, -3, 2))
    key = bpy.context.active_object
    key.data.energy = 150
    key.rotation_euler = (math.radians(45), 0, math.radians(30))
    
    bpy.ops.object.light_add(type='AREA', location=(-2, -2, 1))
    fill = bpy.context.active_object
    fill.data.energy = 50

# ====== EXECUTE ======
sclera_mat = create_sclera_material()
iris_mat = create_iris_material()
pupil_mat = create_pupil_material()

sclera = create_sclera(sclera_mat)
socket_bottom_y = -0.72 # Deeply recessed position
iris_obj = create_iris(iris_mat, socket_bottom_y)
pupil_obj = create_pupil(pupil_mat, socket_bottom_y + 0.05)

setup_scene()

# Parenting
iris_obj.parent = sclera
pupil_obj.parent = sclera

print("=== Final High-Detail Eye Model Created! ===")
