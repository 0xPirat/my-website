"""
╔══════════════════════════════════════════════════════════════╗
║   FUTURISTIC ARCHITECTURE WORLD — Blender Build Script       ║
║   RAM-optimiert: ~200MB während Build, danach Blender zu     ║
╠══════════════════════════════════════════════════════════════╣
║   VERWENDUNG:                                                 ║
║   1. Blender öffnen                                           ║
║   2. Scripting Tab → Open → Diese Datei wählen               ║
║   3. "Run Script" klicken                                     ║
║   4. Wartet ~30 Sekunden                                      ║
║   5. GLB liegt auf dem Desktop: arch_world.glb               ║
║   6. Blender schließen → RAM wieder frei                      ║
╚══════════════════════════════════════════════════════════════╝
"""

import bpy, bmesh, math, random, mathutils, os

random.seed(42)
OUTPUT_PATH = os.path.expanduser("~/Desktop/arch_world.glb")

# ════════════════════════════════════════════════════════════
# 0. SCENE CLEAREN
# ════════════════════════════════════════════════════════════
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()
for d in [bpy.data.materials, bpy.data.meshes, bpy.data.curves,
          bpy.data.lights, bpy.data.images]:
    for item in list(d):
        try: d.remove(item)
        except: pass
print("✓ Scene cleared")

# ════════════════════════════════════════════════════════════
# 1. MATERIALIEN (alle procedural — keine Texturen = kein RAM)
# ════════════════════════════════════════════════════════════

def make_pbr(name, base, roughness=0.5, metallic=0.0,
             emit=None, emit_str=0.0, alpha=1.0, trans=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    for n in list(nodes): nodes.remove(n)
    out  = nodes.new('ShaderNodeOutputMaterial')
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value      = (*base, 1)
    bsdf.inputs['Roughness'].default_value       = roughness
    bsdf.inputs['Metallic'].default_value        = metallic
    bsdf.inputs['Alpha'].default_value           = alpha
    if trans: bsdf.inputs['Transmission Weight'].default_value = trans
    if emit:
        bsdf.inputs['Emission Color'].default_value    = (*emit, 1)
        bsdf.inputs['Emission Strength'].default_value = emit_str
    links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    if alpha < 1.0: mat.blend_method = 'BLEND'
    return mat

def make_concrete(name):
    """Proceduraler verwitterter Beton"""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    for n in list(nodes): nodes.remove(n)
    out   = nodes.new('ShaderNodeOutputMaterial')
    bsdf  = nodes.new('ShaderNodeBsdfPrincipled')
    voron = nodes.new('ShaderNodeTexVoronoi')
    noise = nodes.new('ShaderNodeTexNoise')
    ramp  = nodes.new('ShaderNodeValToRGB')
    bump  = nodes.new('ShaderNodeBump')
    coord = nodes.new('ShaderNodeTexCoord')
    mix_c = nodes.new('ShaderNodeMixRGB')

    voron.inputs['Scale'].default_value      = 3.5
    voron.inputs['Randomness'].default_value = 0.9
    noise.inputs['Scale'].default_value      = 18.0
    noise.inputs['Detail'].default_value     = 10.0
    noise.inputs['Roughness'].default_value  = 0.75

    ramp.color_ramp.elements[0].color = (0.68, 0.70, 0.72, 1)
    el = ramp.color_ramp.elements.new(0.18)
    el.color = (0.58, 0.60, 0.62, 1)
    ramp.color_ramp.elements[-1].color = (0.90, 0.92, 0.93, 1)

    mix_c.blend_type = 'MULTIPLY'
    mix_c.inputs['Fac'].default_value = 0.6
    noise2 = nodes.new('ShaderNodeTexNoise')
    ramp2  = nodes.new('ShaderNodeValToRGB')
    noise2.inputs['Scale'].default_value = 2.0
    noise2.inputs['Detail'].default_value = 3.0
    ramp2.color_ramp.elements[0].color = (0.80, 0.82, 0.84, 1)
    ramp2.color_ramp.elements[1].color = (0.93, 0.94, 0.95, 1)

    bump.inputs['Strength'].default_value  = 0.5
    bump.inputs['Distance'].default_value  = 0.012
    bsdf.inputs['Roughness'].default_value = 0.6
    bsdf.inputs['Specular IOR Level'].default_value = 0.12

    links.new(coord.outputs['Object'],    voron.inputs['Vector'])
    links.new(coord.outputs['Object'],    noise.inputs['Vector'])
    links.new(coord.outputs['Object'],    noise2.inputs['Vector'])
    links.new(voron.outputs['Distance'],  ramp.inputs['Fac'])
    links.new(noise2.outputs['Fac'],      ramp2.inputs['Fac'])
    links.new(ramp.outputs['Color'],      mix_c.inputs['Color1'])
    links.new(ramp2.outputs['Color'],     mix_c.inputs['Color2'])
    links.new(mix_c.outputs['Color'],     bsdf.inputs['Base Color'])
    links.new(noise.outputs['Fac'],       bump.inputs['Height'])
    links.new(bump.outputs['Normal'],     bsdf.inputs['Normal'])
    links.new(bsdf.outputs['BSDF'],       out.inputs['Surface'])
    return mat

M_CONCRETE  = make_concrete("Concrete")
M_FLOOR     = make_pbr("Floor",      (0.75,0.78,0.80), roughness=0.15)
M_WATER     = make_pbr("Water",      (0.02,0.35,0.60), roughness=0.02,
                        emit=(0.05,0.4,0.8), emit_str=0.5, alpha=0.3, trans=0.9)
M_BLUE_EM   = make_pbr("BlueEmit",   (0.02,0.4,0.75),  roughness=0.5,
                        emit=(0.05,0.55,0.95), emit_str=4.0)
M_CEILING   = make_pbr("Ceiling",    (0.92,0.94,0.96), roughness=0.4,
                        emit=(0.85,0.95,1.0), emit_str=0.8)
M_LIGHT_PAT = make_pbr("LightPat",   (0.9,0.97,1.0),   roughness=0.3,
                        emit=(0.85,0.96,1.0), emit_str=2.0)
M_NAVY      = make_pbr("NavyWall",   (0.01,0.03,0.18), roughness=0.12,
                        metallic=0.9, emit=(0.04,0.08,0.45), emit_str=1.4)
M_LAMP      = make_pbr("LampRing",   (0.3,0.75,1.0),   roughness=0.05,
                        metallic=0.3, emit=(0.3,0.75,1.0), emit_str=8.0)
M_WIRE      = make_pbr("Wire",       (0.35,0.38,0.42), roughness=0.3, metallic=0.95)

print("✓ Materials done")

# ════════════════════════════════════════════════════════════
# 2. BODEN
# ════════════════════════════════════════════════════════════
bpy.ops.mesh.primitive_plane_add(size=60, location=(0, 12, 0))
bpy.context.active_object.name = "Floor"
bpy.context.active_object.data.materials.append(M_FLOOR)

# ════════════════════════════════════════════════════════════
# 3. ORGANISCHE BÖGEN
# ════════════════════════════════════════════════════════════

def make_arch(name, px, py, width, height, thickness):
    crv = bpy.data.curves.new(name, 'CURVE')
    crv.dimensions = '3D'
    crv.bevel_depth = thickness
    crv.bevel_resolution = 8
    crv.use_fill_caps = True
    sp = crv.splines.new('BEZIER')
    sp.bezier_points.add(2)
    bp = sp.bezier_points
    bp[0].co = mathutils.Vector((px-width/2, py, 0))
    bp[0].handle_left  = mathutils.Vector((px-width/2-0.8, py, 0))
    bp[0].handle_right = mathutils.Vector((px-width/2+0.2, py, height*0.45))
    bp[0].handle_left_type = bp[0].handle_right_type = 'FREE'
    bp[1].co = mathutils.Vector((px, py, height))
    bp[1].handle_left  = mathutils.Vector((px-width*0.35, py, height*1.12))
    bp[1].handle_right = mathutils.Vector((px+width*0.35, py, height*1.12))
    bp[1].handle_left_type = bp[1].handle_right_type = 'FREE'
    bp[2].co = mathutils.Vector((px+width/2, py, 0))
    bp[2].handle_left  = mathutils.Vector((px+width/2-0.2, py, height*0.45))
    bp[2].handle_right = mathutils.Vector((px+width/2+0.8, py, 0))
    bp[2].handle_left_type = bp[2].handle_right_type = 'FREE'
    obj = bpy.data.objects.new(name, crv)
    bpy.context.scene.collection.objects.link(obj)
    crv.materials.append(M_CONCRETE)
    return obj

for i, py in enumerate([-1, 5, 11, 17, 23]):
    make_arch(f"Arch_M{i}", 0, py, 9.5, 7.8, 0.6)
for i, (sx, sy) in enumerate([(-5.2,2),(5.2,2),(-5.2,8),(5.2,8),(-5.2,14),(5.2,14)]):
    make_arch(f"Arch_S{i}", sx, sy, 4.0, 6.5, 0.42)

# Zu Mesh konvertieren + subtile Verformung + Decimate
bpy.ops.object.select_all(action='DESELECT')
arch_objs = [o for o in bpy.data.objects if o.name.startswith("Arch_")]
for obj in arch_objs:
    obj.select_set(True)
bpy.context.view_layer.objects.active = arch_objs[0]
bpy.ops.object.convert(target='MESH')

arch_objs = [o for o in bpy.data.objects if o.name.startswith("Arch_")]
for obj in arch_objs:
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    sub = obj.modifiers.new("Sub", 'SUBSURF')
    sub.levels = 2; sub.subdivision_type = 'SIMPLE'
    bpy.ops.object.modifier_apply(modifier="Sub")
    bpy.ops.object.mode_set(mode='EDIT')
    bm_a = bmesh.from_edit_mesh(obj.data)
    seed_v = hash(obj.name) % 200
    random.seed(seed_v)
    for v in bm_a.verts:
        if v.normal.length < 0.01: continue
        z_t = max(0, min(1, v.co.z/8.0))
        wave  = math.sin(v.co.z*4.5+seed_v*0.3)*0.018 + math.cos(v.co.z*2.8+seed_v*0.7)*0.012
        micro = math.sin(v.co.x*15.0+v.co.z*12.0)*0.006 + math.cos(v.co.y*18.0+v.co.z*10.0)*0.005
        asym  = math.sin(z_t*math.pi)*0.022*(seed_v%3-1)
        v.co += v.normal.normalized() * (wave+micro+asym)
    bmesh.update_edit_mesh(obj.data)
    bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.shade_smooth()
    dec = obj.modifiers.new("Dec", 'DECIMATE')
    dec.ratio = 0.18
    bpy.ops.object.modifier_apply(modifier="Dec")

# Alle Bögen mergen
bpy.ops.object.select_all(action='DESELECT')
arch_objs = [o for o in bpy.data.objects if o.name.startswith("Arch_")]
for o in arch_objs: o.select_set(True)
bpy.context.view_layer.objects.active = arch_objs[0]
bpy.ops.object.join()
bpy.context.active_object.name = "Arches_All"
print("✓ Arches done")

# ════════════════════════════════════════════════════════════
# 4. ORGANISCHE DECKE
# ════════════════════════════════════════════════════════════
random.seed(17)
bm_c = bmesh.new()
cols, rows = 60, 44
W, L = 16.0, 30.0
grid_v = []
for row in range(rows+1):
    rv = []
    for col in range(cols+1):
        u=col/cols; v=row/rows
        x=(u-0.5)*W; y=v*L-2.5
        z=8.4+math.sin(u*math.pi)*1.5+math.sin(v*math.pi*1.4)*0.4
        rv.append(bm_c.verts.new((x,y,z)))
    grid_v.append(rv)
bm_c.verts.ensure_lookup_table()
for row in range(rows):
    for col in range(cols):
        bm_c.faces.new([grid_v[row][col],grid_v[row][col+1],
                        grid_v[row+1][col+1],grid_v[row+1][col]])
bm_c.faces.ensure_lookup_table()
cells = [(random.uniform(-W*0.44,W*0.44), random.uniform(-2,L-2.5)) for _ in range(80)]
del_f = []
for face in bm_c.faces:
    fx=sum(v.co.x for v in face.verts)/4; fy=sum(v.co.y for v in face.verts)/4
    dists=sorted(math.sqrt((fx-cx)**2+(fy-cy)**2) for cx,cy in cells)
    d1,d2=dists[0],dists[1]
    nm=math.sin(fx*3.7)*math.cos(fy*2.9)*0.15
    if d1<(1.6+nm) and (d2-d1)>0.55: del_f.append(face)
bmesh.ops.delete(bm_c, geom=del_f, context='FACES')
m_c=bpy.data.meshes.new("Ceiling_mesh"); bm_c.to_mesh(m_c); bm_c.free()
o_c=bpy.data.objects.new("Ceiling",m_c)
bpy.context.scene.collection.objects.link(o_c)
bpy.context.view_layer.objects.active=o_c; o_c.select_set(True)
bpy.ops.object.shade_smooth()
o_c.data.materials.append(M_CEILING)
print("✓ Ceiling done")

# ════════════════════════════════════════════════════════════
# 5. WÄNDE & HINTERGRUND
# ════════════════════════════════════════════════════════════
for name, pts in [
    ("WaterWall_L", [(-7.8,-3,0),(-7.8,26,0),(-7.8,26,10),(-7.8,-3,10)]),
    ("WaterWall_R", [(7.8,-3,0),(7.8,26,0),(7.8,26,10),(7.8,-3,10)]),
    ("BG_Back",     [(-9,26,0),(9,26,0),(9,26,11),(-9,26,11)]),
]:
    bm_w=bmesh.new(); vs=[bm_w.verts.new(p) for p in pts]; bm_w.faces.new(vs)
    m_w=bpy.data.meshes.new(name+"_mesh"); bm_w.to_mesh(m_w); bm_w.free()
    o_w=bpy.data.objects.new(name,m_w)
    bpy.context.scene.collection.objects.link(o_w)
    o_w.data.materials.append(M_WATER if "Wall" in name else M_BLUE_EM)

# ════════════════════════════════════════════════════════════
# 6. LICHTFLECKEN AUF BODEN
# ════════════════════════════════════════════════════════════
random.seed(13)
bm_lp=bmesh.new()
for row in range(14):
    for col in range(9):
        px=(col-4)*1.6+random.uniform(-0.25,0.25)
        py=row*2.0+random.uniform(-0.35,0.35)
        rx=random.uniform(0.15,0.40); ry=random.uniform(0.22,0.55)
        ang=random.uniform(0,math.pi); segs=12
        vp=[]
        for s in range(segs):
            a=(s/segs)*2*math.pi
            lx=px+math.cos(a)*rx*math.cos(ang)-math.sin(a)*ry*math.sin(ang)
            ly=py+math.cos(a)*rx*math.sin(ang)+math.sin(a)*ry*math.cos(ang)
            vp.append(bm_lp.verts.new((lx,ly,0.006)))
        try: bm_lp.faces.new(vp)
        except: pass
m_lp=bpy.data.meshes.new("LightPat_mesh"); bm_lp.to_mesh(m_lp); bm_lp.free()
o_lp=bpy.data.objects.new("LightPatterns",m_lp)
bpy.context.scene.collection.objects.link(o_lp)
o_lp.data.materials.append(M_LIGHT_PAT)

# ════════════════════════════════════════════════════════════
# 7. NAVY WAND-RINGE (Galerie-Style)
# ════════════════════════════════════════════════════════════
wall_rings_data = [
    (-6.3, 1.5, 3.2, 1.10, 0.070), (-6.3, 1.5, 3.2, 0.75, 0.045),
    (-6.3, 7.0, 2.8, 0.85, 0.060), (-6.3, 7.0, 2.8, 0.55, 0.040),
    (-6.3,12.5, 3.5, 1.30, 0.080), (-6.3,12.5, 3.5, 0.90, 0.050),
    (-6.3,18.0, 3.0, 0.70, 0.050),
    ( 6.3, 1.5, 3.2, 1.10, 0.070), ( 6.3, 1.5, 3.2, 0.75, 0.045),
    ( 6.3, 7.0, 2.8, 0.85, 0.060), ( 6.3, 7.0, 2.8, 0.55, 0.040),
    ( 6.3,12.5, 3.5, 1.30, 0.080), ( 6.3,12.5, 3.5, 0.90, 0.050),
    ( 6.3,18.0, 3.0, 0.70, 0.050),
]
for i,(x,y,z,maj,mino) in enumerate(wall_rings_data):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=maj, minor_radius=mino,
        major_segments=64, minor_segments=12, location=(x,y,z))
    obj=bpy.context.active_object; obj.name=f"WallRing_{i}"
    obj.rotation_euler=(math.pi/2,0,0)
    bpy.ops.object.shade_smooth()
    obj.data.materials.append(M_NAVY)

bpy.ops.object.select_all(action='DESELECT')
wr=[o for o in bpy.data.objects if o.name.startswith("WallRing_")]
for o in wr: o.select_set(True)
bpy.context.view_layer.objects.active=wr[0]
bpy.ops.object.join(); bpy.context.active_object.name="WallRings_All"
print("✓ Wall rings done")

# ════════════════════════════════════════════════════════════
# 8. HÄNGENDE LAMPEN-RINGE
# ════════════════════════════════════════════════════════════
lamp_data = [
    (0.0,1.5,5.8,0.55),(0.0,5.0,6.2,0.65),(0.0,8.5,5.5,0.50),
    (0.0,12.0,6.0,0.70),(0.0,15.5,5.8,0.55),(0.0,19.0,6.3,0.60),
    (-2.5,3.5,5.4,0.40),(2.5,3.5,5.6,0.38),(-2.2,10.0,5.8,0.45),
    (2.2,10.0,5.5,0.42),(-2.5,17.0,6.0,0.40),(2.5,17.0,5.7,0.43),
]
for i,(x,y,z,maj) in enumerate(lamp_data):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=maj, minor_radius=maj*0.10,
        major_segments=48, minor_segments=10, location=(x,y,z))
    lamp=bpy.context.active_object; lamp.name=f"Lamp_{i}"
    bpy.ops.object.shade_smooth()
    lamp.data.materials.append(M_LAMP)
    ceiling_z=8.4+math.sin(((x+8)/16)*math.pi)*1.5
    rope_len=ceiling_z-z; rope_zmid=z+rope_len/2
    bpy.ops.mesh.primitive_cylinder_add(
        radius=0.008,depth=rope_len,location=(x,y,rope_zmid))
    rope=bpy.context.active_object; rope.name=f"Rope_{i}"
    rope.data.materials.append(M_WIRE)

bpy.ops.object.select_all(action='DESELECT')
lm=[o for o in bpy.data.objects if o.name.startswith("Lamp_") or o.name.startswith("Rope_")]
for o in lm: o.select_set(True)
bpy.context.view_layer.objects.active=lm[0]
bpy.ops.object.join(); bpy.context.active_object.name="Lamps_All"
print("✓ Lamps done")

# ════════════════════════════════════════════════════════════
# 9. BELEUCHTUNG
# ════════════════════════════════════════════════════════════
for nm,tp,loc,energy,color,rot in [
    ("TopLight",   'AREA',  (0,12,13),  900,(0.88,0.96,1.0), (0,0,0)),
    ("BlueLeft",   'AREA',  (-9,10,4.5),700,(0.04,0.48,0.88),(0,math.radians(-90),0)),
    ("BlueRight",  'AREA',  (9,10,4.5), 700,(0.04,0.48,0.88),(0,math.radians(90),0)),
    ("RimBack",    'SPOT',  (0,24,5),  3000,(0.15,0.65,1.0), (math.radians(180),0,0)),
    ("AreaLamp_0", 'AREA',  (0,4,7.5),  400,(0.2,0.6,1.0),   (0,0,0)),
    ("AreaLamp_1", 'AREA',  (0,11,7.5), 400,(0.2,0.6,1.0),   (0,0,0)),
    ("AreaLamp_2", 'AREA',  (0,18,7.5), 350,(0.2,0.6,1.0),   (0,0,0)),
]:
    bpy.ops.object.light_add(type=tp, location=loc)
    l=bpy.context.active_object; l.name=nm
    l.data.energy=energy; l.data.color=color
    l.rotation_euler=rot
    if tp=='AREA': l.data.size=10
    if tp=='SPOT': l.data.spot_size=math.radians(45)

# World
world=bpy.context.scene.world; world.use_nodes=True
wn=world.node_tree.nodes; wl=world.node_tree.links
for n in list(wn): wn.remove(n)
wo=wn.new('ShaderNodeOutputWorld'); wb=wn.new('ShaderNodeBackground')
wb.inputs['Color'].default_value=(0.01,0.05,0.15,1)
wb.inputs['Strength'].default_value=0.25
wl.new(wb.outputs['Background'],wo.inputs['Surface'])
print("✓ Lights done")

# ════════════════════════════════════════════════════════════
# 10. KAMERA
# ════════════════════════════════════════════════════════════
bpy.ops.object.camera_add(location=(0,-10,2.4))
cam=bpy.context.active_object; cam.name="MainCamera"
cam.rotation_euler=(math.radians(83),0,0)
cam.data.lens=26; cam.data.clip_end=200
bpy.ops.object.empty_add(type='PLAIN_AXES',location=(0,0,2.4))
pivot=bpy.context.active_object; pivot.name="CameraPivot"
cam.parent=pivot; bpy.context.scene.camera=cam

# ════════════════════════════════════════════════════════════
# 11. RENDER SETTINGS
# ════════════════════════════════════════════════════════════
bpy.context.scene.render.engine='BLENDER_EEVEE'
bpy.context.scene.render.resolution_x=1920
bpy.context.scene.render.resolution_y=1080
eevee=bpy.context.scene.eevee
eevee.use_shadows=True; eevee.use_raytracing=True
eevee.taa_render_samples=64
bpy.context.scene.view_settings.look='AgX - Medium High Contrast'
bpy.context.scene.view_settings.exposure=0.5

# ════════════════════════════════════════════════════════════
# 12. GLB EXPORT
# ════════════════════════════════════════════════════════════
bpy.ops.outliner.orphans_purge(do_recursive=True)

bpy.ops.object.select_all(action='DESELECT')
for obj in bpy.data.objects:
    if obj.type == 'MESH':
        obj.select_set(True)

bpy.ops.export_scene.gltf(
    filepath=OUTPUT_PATH,
    export_format='GLB',
    use_selection=True,
    export_apply=True,
    export_normals=True,
    export_materials='EXPORT',
    export_image_format='JPEG',
    export_cameras=False,
    export_lights=False,
    export_yup=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
)

size_mb = os.path.getsize(OUTPUT_PATH) / (1024*1024)

print("\n" + "="*55)
print(f"✅ FERTIG!")
print(f"   GLB:      {OUTPUT_PATH}")
print(f"   Größe:    {size_mb:.2f} MB")
print(f"   Objekte:  {len(bpy.data.objects)}")
print(f"   Meshes:   {len(bpy.data.meshes)}")
print("="*55)
print("\n→ Blender kann jetzt geschlossen werden")
print("→ GLB in dein Web-Projekt kopieren")
print("→ RAM ist danach wieder komplett frei")