"""
process-concorde.py
-------------------
Blender 5.x headless script to optimise concorde.glb for WebGL.

Run:
  /opt/homebrew/bin/blender -b -P process-concorde.py

Output:
  ../concorde-optimized.glb  (target 10-15K tris, < 300KB)
"""

import bpy
import bmesh
import os
import sys
from pathlib import Path

# ── paths ──────────────────────────────────────────────────────────
SCRIPT_DIR = Path(os.path.dirname(os.path.abspath(__file__)))
ASSETS_DIR = SCRIPT_DIR.parent
INPUT_PATH = str(ASSETS_DIR / "concorde.glb")
OUTPUT_PATH = str(ASSETS_DIR / "concorde-optimized.glb")

print(f"\n{'='*60}")
print(f"INPUT : {INPUT_PATH}")
print(f"OUTPUT: {OUTPUT_PATH}")
print(f"{'='*60}\n")


# ── 1. Clean scene & import ────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=INPUT_PATH)

# Count initial tris
def count_tris():
    total = 0
    for obj in bpy.data.objects:
        if obj.type == 'MESH':
            depsgraph = bpy.context.evaluated_depsgraph_get()
            obj_eval = obj.evaluated_get(depsgraph)
            mesh = obj_eval.to_mesh()
            total += len(mesh.loop_triangles)
            obj_eval.to_mesh_clear()
    return total

print(f"[1] Imported  — tris: {count_tris()}, objects: {len(bpy.data.objects)}")


# ── 2. Delete all EMPTY objects ────────────────────────────────────
bpy.ops.object.select_all(action='DESELECT')
for obj in list(bpy.data.objects):
    if obj.type == 'EMPTY':
        bpy.data.objects.remove(obj, do_unlink=True)

print(f"[2] Empties removed — remaining objects: {len(bpy.data.objects)}")


# ── 3. Apply all transforms on mesh objects ────────────────────────
bpy.ops.object.select_all(action='SELECT')
# Set one mesh as active
mesh_objs = [o for o in bpy.data.objects if o.type == 'MESH']
if mesh_objs:
    bpy.context.view_layer.objects.active = mesh_objs[0]
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
print(f"[3] Transforms applied")


# ── 4. Join all mesh objects into one ──────────────────────────────
bpy.ops.object.select_all(action='DESELECT')
for obj in bpy.data.objects:
    if obj.type == 'MESH':
        obj.select_set(True)

bpy.context.view_layer.objects.active = mesh_objs[0]
bpy.ops.object.join()

joined = bpy.context.active_object
joined.name = "Concorde"
print(f"[4] Joined — verts: {len(joined.data.vertices)}, tris: {count_tris()}")


# ── 5. Center origin to geometry ───────────────────────────────────
bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
joined.location = (0, 0, 0)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
print(f"[5] Origin centred at bounds centre")


# ── 6. Decimate ────────────────────────────────────────────────────
# Target: 10-15K tris from ~33K → ratio ~0.35
current_tris = count_tris()
target_tris = 12000
ratio = target_tris / current_tris if current_tris > 0 else 0.35
ratio = max(0.1, min(ratio, 0.9))  # clamp

dec = joined.modifiers.new(name="Decimate", type='DECIMATE')
dec.ratio = ratio
dec.decimate_type = 'COLLAPSE'
print(f"[6] Decimate modifier added — ratio: {ratio:.4f}")

# Apply decimate
bpy.context.view_layer.objects.active = joined
bpy.ops.object.modifier_apply(modifier="Decimate")

after_tris = count_tris()
print(f"    After decimate — tris: {after_tris}")

# If still above 15K, apply another round
if after_tris > 15000:
    second_ratio = 14000 / after_tris
    dec2 = joined.modifiers.new(name="Decimate2", type='DECIMATE')
    dec2.ratio = second_ratio
    dec2.decimate_type = 'COLLAPSE'
    bpy.ops.object.modifier_apply(modifier="Decimate2")
    print(f"    Second decimate — tris: {count_tris()}")


# ── 7. Unify material — single Principled BSDF ────────────────────
# Remove all existing materials
joined.data.materials.clear()

# Remove all orphan materials
for mat in list(bpy.data.materials):
    bpy.data.materials.remove(mat, do_unlink=True)

# Create a single new material
mat = bpy.data.materials.new(name="ConcordeMetal")
mat.use_backface_culling = True
joined.data.materials.append(mat)

# Set up Principled BSDF via node tree
mat.use_nodes = True
tree = mat.node_tree
tree.nodes.clear()

output_node = tree.nodes.new('ShaderNodeOutputMaterial')
output_node.location = (300, 0)

bsdf = tree.nodes.new('ShaderNodeBsdfPrincipled')
bsdf.location = (0, 0)
bsdf.inputs['Base Color'].default_value = (0.85, 0.88, 0.92, 1.0)
bsdf.inputs['Metallic'].default_value = 0.12
bsdf.inputs['Roughness'].default_value = 0.38
# Emission defaults to (0, 0, 0) — no need to set

tree.links.new(bsdf.outputs['BSDF'], output_node.inputs['Surface'])

print(f"[7] Material unified — ConcordeMetal (Principled BSDF)")


# ── 8. Recalculate normals (outward) ──────────────────────────────
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.normals_make_consistent(inside=False)
bpy.ops.object.mode_set(mode='OBJECT')
print(f"[8] Normals recalculated (outward)")


# ── 9. Smooth by Angle (Blender 5.x way) ──────────────────────────
# In Blender 4.1+ / 5.x, auto smooth is done via geometry nodes modifier
# or via shade_smooth + custom split normals.
# Simplest approach: Shade Smooth then add a "Smooth by Angle" modifier.
bpy.ops.object.shade_smooth()

# Add Smooth by Angle modifier (Blender 4.1+)
try:
    mod = joined.modifiers.new(name="SmoothByAngle", type='NODES')
    # In Blender 5.x, "Smooth by Angle" is a built-in geometry nodes modifier
    # accessed via bpy.ops
    bpy.ops.object.modifier_remove(modifier="SmoothByAngle")
    # Fallback: use the operator approach
    bpy.ops.object.shade_smooth_by_angle(angle=0.523599)  # 30 degrees
    print(f"[9] Smooth by angle (30 deg) applied via operator")
except Exception as e:
    # Fallback: just use smooth shading with auto smooth angle on mesh data
    try:
        joined.data.use_auto_smooth = True
        joined.data.auto_smooth_angle = 0.523599  # 30 degrees
        print(f"[9] Auto smooth (30 deg) applied via mesh data")
    except AttributeError:
        # Blender 5.x may not have use_auto_smooth
        print(f"[9] Smooth shading applied (auto smooth not available: {e})")


# ── 10. Triangulate ────────────────────────────────────────────────
tri_mod = joined.modifiers.new(name="Triangulate", type='TRIANGULATE')
tri_mod.quad_method = 'SHORTEST_DIAGONAL'
bpy.ops.object.modifier_apply(modifier="Triangulate")
print(f"[10] Triangulated — final tris: {count_tris()}")


# ── 11. Apply all transforms again ─────────────────────────────────
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
print(f"[11] Final transforms applied")


# ── 12. GLB export ──────────────────────────────────────────────────
bpy.ops.export_scene.gltf(
    filepath=OUTPUT_PATH,
    export_format='GLB',
    use_selection=False,
    export_apply=True,
    export_yup=True,           # glTF convention: Y-up
    export_normals=True,
    export_materials='EXPORT',
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_draco_position_quantization=14,
    export_draco_normal_quantization=10,
)
print(f"[12] Exported to {OUTPUT_PATH}")


# ── 13. Validation ──────────────────────────────────────────────────
file_size = os.path.getsize(OUTPUT_PATH)
final_tris = count_tris()

# Manifold check via bmesh
bm = bmesh.new()
bm.from_mesh(joined.data)
non_manifold_edges = [e for e in bm.edges if not e.is_manifold]
bm.free()

print(f"\n{'='*60}")
print(f"VALIDATION RESULTS")
print(f"{'='*60}")
print(f"  Tri count     : {final_tris}")
print(f"  File size     : {file_size:,} bytes ({file_size/1024:.1f} KB)")
print(f"  Non-manifold  : {len(non_manifold_edges)} edges")
print(f"  Target tris   : 10,000 - 15,000  {'PASS' if 10000 <= final_tris <= 15000 else 'WARN'}")
print(f"  Target size   : < 300 KB          {'PASS' if file_size < 300*1024 else 'WARN'}")
print(f"{'='*60}\n")

if final_tris < 10000 or final_tris > 15000:
    print(f"WARNING: Tri count {final_tris} outside target range 10K-15K")
if file_size >= 300 * 1024:
    print(f"WARNING: File size {file_size/1024:.1f}KB exceeds 300KB target")

print("Done.")
