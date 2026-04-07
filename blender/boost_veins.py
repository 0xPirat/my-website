import bpy

# Get Sclera Material
mat = bpy.data.materials.get("Sclera")
if mat and mat.use_nodes:
    nodes = mat.node_tree.nodes
    
    # 1. Boost ColorRamp Contrast
    for n in nodes:
        if n.type == 'VALTORGB':
            # Identify Vein Ramp (input from Wave/Voronoi)
            if n.inputs[0].links:
                from_node = n.inputs[0].links[0].from_node
                if from_node.type in ['TEX_WAVE', 'TEX_VORONOI']:
                    print("Found Vein Ramp:", n.name)
                    # Make lines thicker
                    n.color_ramp.elements[0].position = 0.3
                    n.color_ramp.elements[1].position = 0.45
                    n.color_ramp.elements[2].position = 0.6
                    
    # 2. Make Red Darker
    for n in nodes:
        if n.type == 'MIX_RGB' and n.blend_type == 'MIX':
            # Check if one input is Red
            c1 = n.inputs["Color1"].default_value
            c2 = n.inputs["Color2"].default_value
            if c1[0] > 0.5 and c1[1] < 0.2: # Reddish
                n.inputs["Color1"].default_value = (0.2, 0.0, 0.0, 1) # Darker
            if c2[0] > 0.5 and c2[1] < 0.2:
                n.inputs["Color2"].default_value = (0.2, 0.0, 0.0, 1)

    # 3. Disable SSS for clarity
    bsdf = nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Subsurface Weight"].default_value = 0.0

print("Veins Boosted!")
