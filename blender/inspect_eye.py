import bpy

print("--- Scene Info ---")
for obj in bpy.data.objects:
    print(f"Object: {obj.name}")
    print(f"  Location: {obj.location}")
    print(f"  Rotation: {obj.rotation_euler}")
    print(f"  Scale: {obj.scale}")
    if obj.type == 'MESH':
        bbox = [list(v) for v in obj.bound_box]
        print(f"  BBox: {bbox}")
    print("-" * 20)
