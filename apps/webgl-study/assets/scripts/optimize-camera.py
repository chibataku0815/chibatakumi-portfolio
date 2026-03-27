"""
Blender headless script: Optimize Rodin camera model for WebGL product viewer.
- Decimate to ~20K triangles
- Resize textures to 2K
- Export with Draco compression

Usage:
  blender --background --python optimize-camera.py
"""

import bpy
import os

# === Config ===
INPUT_GLB = os.path.join(os.path.dirname(__file__), "..", "rodin-camera-test_base_basic_pbr.glb")
OUTPUT_GLB = os.path.join(os.path.dirname(__file__), "..", "vintage-camera-optimized.glb")
TARGET_TRIS = 20000
TEXTURE_MAX_SIZE = 1024

# === Clear scene ===
bpy.ops.wm.read_factory_settings(use_empty=True)

# === Import GLB ===
print(f"Importing: {INPUT_GLB}")
bpy.ops.import_scene.gltf(filepath=INPUT_GLB)

# === Find mesh objects ===
mesh_objects = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
print(f"Found {len(mesh_objects)} mesh object(s)")

for obj in mesh_objects:
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    # Count current triangles
    bpy.context.view_layer.update()
    depsgraph = bpy.context.evaluated_depsgraph_get()
    eval_obj = obj.evaluated_get(depsgraph)
    current_tris = sum(len(p.vertices) - 2 for p in eval_obj.data.polygons)
    print(f"  {obj.name}: {current_tris:,} triangles")

    if current_tris > TARGET_TRIS:
        ratio = TARGET_TRIS / current_tris
        print(f"  Decimating: ratio={ratio:.4f} (target ~{TARGET_TRIS:,} tris)")

        # Add decimate modifier
        mod = obj.modifiers.new(name="Decimate", type='DECIMATE')
        mod.ratio = ratio
        mod.use_collapse_triangulate = True

        # Apply modifier
        bpy.ops.object.modifier_apply(modifier=mod.name)

        # Verify
        bpy.context.view_layer.update()
        depsgraph = bpy.context.evaluated_depsgraph_get()
        eval_obj = obj.evaluated_get(depsgraph)
        new_tris = sum(len(p.vertices) - 2 for p in eval_obj.data.polygons)
        print(f"  After decimate: {new_tris:,} triangles")
    else:
        print(f"  No decimation needed")

    obj.select_set(False)

# === Resize textures ===
for img in bpy.data.images:
    if img.size[0] > TEXTURE_MAX_SIZE or img.size[1] > TEXTURE_MAX_SIZE:
        old_size = (img.size[0], img.size[1])
        img.scale(
            min(img.size[0], TEXTURE_MAX_SIZE),
            min(img.size[1], TEXTURE_MAX_SIZE)
        )
        print(f"  Texture '{img.name}': {old_size} -> ({img.size[0]}, {img.size[1]})")

# === Export with Draco ===
print(f"Exporting: {OUTPUT_GLB}")
bpy.ops.export_scene.gltf(
    filepath=OUTPUT_GLB,
    export_format='GLB',
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_draco_position_quantization=14,
    export_draco_normal_quantization=10,
    export_draco_texcoord_quantization=12,
    export_image_format='JPEG',
    export_image_quality=85,
    export_texcoords=True,
    export_normals=True,
    export_materials='EXPORT',
)

output_size = os.path.getsize(OUTPUT_GLB)
print(f"\nDone! Output: {output_size:,} bytes ({output_size/1024/1024:.1f} MB)")
