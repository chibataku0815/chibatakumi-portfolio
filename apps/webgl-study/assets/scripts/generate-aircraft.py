"""
generate-aircraft.py
====================
Procedural stylized passenger aircraft generator for 02-atmos WebGL scene.
Generates a 800-1200 triangle GLB model optimized for fog + rim lighting.

Usage:
  blender -b -P generate-aircraft.py
  blender -b -P generate-aircraft.py -- --render   # with preview render

Based on Boeing 737-800 proportions (normalized to length=10.0).
"""

import bpy
import bmesh
import math
import sys
import os
from mathutils import Vector, Matrix

# =============================================================================
# Parameters (adjust these for iteration)
# =============================================================================

# Proportions (Boeing 737-800 normalized)
FUSELAGE_LENGTH = 10.0
FUSELAGE_RADIUS = 0.475
FUSELAGE_SEGMENTS = 14       # cross-section vertices (more = rounder)
FUSELAGE_SECTIONS = 10       # longitudinal sections (more = smoother taper)

# Wings
WINGSPAN_HALF = 4.55         # half wingspan (total 9.1)
WING_ROOT_CHORD = 2.0        # chord length at root
WING_TAPER = 0.25            # tip chord / root chord
WING_SWEEP_DEG = 25.0        # sweep angle
WING_DIHEDRAL_DEG = 5.0      # dihedral (upward angle)
WING_THICKNESS = 0.12        # relative to chord
WING_SECTIONS = 6            # span-wise sections (more = smoother wing)
WING_ATTACH_X = -0.5         # fuselage position (from center, negative = aft)

# Engines
ENGINE_RADIUS = 0.28
ENGINE_LENGTH = 1.6
ENGINE_SEGMENTS = 12
ENGINE_SPAN_POS = 0.30       # fraction of half-span
ENGINE_PYLON_HEIGHT = 0.3

# Tail
TAIL_VERT_HEIGHT = 1.8
TAIL_VERT_CHORD = 1.4
TAIL_HORIZ_SPAN_HALF = 1.8
TAIL_HORIZ_CHORD = 1.0
TAIL_POSITION = 4.2          # distance aft of center

# Winglets
WINGLET_HEIGHT = 0.4
WINGLET_SWEEP_DEG = 45.0

# Material (PBR values for painted aluminum in fog)
MAT_BASE_COLOR = (0.85, 0.88, 0.92, 1.0)
MAT_METALLIC = 0.15
MAT_ROUGHNESS = 0.45

# Output
OUTPUT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_PATH = os.path.join(OUTPUT_DIR, "lowpoly-airplane.glb")

# Validation
TARGET_TRI_MIN = 600
TARGET_TRI_MAX = 1400
TARGET_FILE_SIZE_MAX = 100_000  # 100KB


# =============================================================================
# Helpers
# =============================================================================

def clear_scene():
    """Remove all objects from the scene."""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    # Clear orphan data
    for block in bpy.data.meshes:
        if block.users == 0:
            bpy.data.meshes.remove(block)
    for block in bpy.data.materials:
        if block.users == 0:
            bpy.data.materials.remove(block)


def new_bmesh_object(name: str) -> tuple:
    """Create a new mesh object with bmesh, return (obj, bm)."""
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    bm = bmesh.new()
    return obj, bm


def finalize_bmesh(obj, bm):
    """Write bmesh to object mesh and free."""
    bm.to_mesh(obj.data)
    bm.free()


def airfoil_profile(chord: float, thickness: float, n_points: int = 6) -> list:
    """
    Generate a simple airfoil cross-section (NACA-like) in the XZ plane.
    Returns list of (x, z) tuples. Y is span direction.
    Upper surface slightly bulged for lift-like appearance.
    """
    points = []
    for i in range(n_points):
        t = i / (n_points - 1)
        x = chord * (1.0 - t)  # leading edge to trailing edge

        if i == 0 or i == n_points - 1:
            z_up = 0.0
            z_down = 0.0
        else:
            # NACA 4-digit thickness distribution (simplified)
            xt = t
            z_half = thickness * chord * (
                2.969 * math.sqrt(xt)
                - 1.260 * xt
                - 3.516 * xt**2
                + 2.843 * xt**3
                - 1.015 * xt**4
            ) / 0.2

            z_up = z_half * 0.6    # upper surface (more volume)
            z_down = -z_half * 0.4  # lower surface (flatter)

        points.append((x, z_up))

    # Return upper then lower in reverse (forming closed profile)
    for i in range(n_points - 2, 0, -1):
        t = i / (n_points - 1)
        x = chord * (1.0 - t)
        xt = t
        z_half = thickness * chord * (
            2.969 * math.sqrt(xt)
            - 1.260 * xt
            - 3.516 * xt**2
            + 2.843 * xt**3
            - 1.015 * xt**4
        ) / 0.2
        z_down = -z_half * 0.4
        points.append((x, z_down))

    return points


# =============================================================================
# Part Generators
# =============================================================================

def create_fuselage() -> bpy.types.Object:
    """Create fuselage with tapered nose and tail."""
    obj, bm = new_bmesh_object("Fuselage")

    # Generate cross-section rings along the fuselage
    section_positions = []
    half_len = FUSELAGE_LENGTH / 2

    # Define sections: (x_position, radius_scale)
    # Nose taper → full body → tail taper
    sections = [
        (-half_len, 0.0),                    # nose tip
        (-half_len + 0.8, 0.5),              # nose curve
        (-half_len + 1.6, 0.85),             # nose blend
        (-half_len + 2.5, 1.0),              # full body start
        (0.0, 1.0),                          # center
        (half_len - 3.0, 1.0),              # full body end
        (half_len - 1.5, 0.7),              # tail taper
        (half_len, 0.15),                    # tail tip
    ]

    rings = []
    for x_pos, r_scale in sections:
        ring_verts = []
        for i in range(FUSELAGE_SEGMENTS):
            angle = 2.0 * math.pi * i / FUSELAGE_SEGMENTS
            y = math.cos(angle) * FUSELAGE_RADIUS * r_scale
            z = math.sin(angle) * FUSELAGE_RADIUS * r_scale
            v = bm.verts.new((x_pos, y, z))
            ring_verts.append(v)
        rings.append(ring_verts)

    bm.verts.ensure_lookup_table()

    # Connect rings with faces
    for r in range(len(rings) - 1):
        for i in range(FUSELAGE_SEGMENTS):
            i_next = (i + 1) % FUSELAGE_SEGMENTS
            v1 = rings[r][i]
            v2 = rings[r][i_next]
            v3 = rings[r + 1][i_next]
            v4 = rings[r + 1][i]
            bm.faces.new((v1, v2, v3, v4))

    # Cap nose (fan from first ring center)
    if sections[0][1] < 0.01:
        # Nose is nearly a point, already tapered
        pass
    else:
        nose_center = bm.verts.new((sections[0][0], 0, 0))
        for i in range(FUSELAGE_SEGMENTS):
            i_next = (i + 1) % FUSELAGE_SEGMENTS
            bm.faces.new((nose_center, rings[0][i], rings[0][i_next]))

    # Cap tail
    if sections[-1][1] < 0.2:
        tail_center = bm.verts.new((sections[-1][0], 0, 0))
        for i in range(FUSELAGE_SEGMENTS):
            i_next = (i + 1) % FUSELAGE_SEGMENTS
            bm.faces.new((tail_center, rings[-1][i_next], rings[-1][i]))

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    finalize_bmesh(obj, bm)
    return obj


def create_wing() -> bpy.types.Object:
    """Create right wing with airfoil cross-sections. Will be mirrored later."""
    obj, bm = new_bmesh_object("Wing")

    sweep_rad = math.radians(WING_SWEEP_DEG)
    dihedral_rad = math.radians(WING_DIHEDRAL_DEG)

    section_rings = []

    for s in range(WING_SECTIONS):
        t = s / (WING_SECTIONS - 1)  # 0 = root, 1 = tip
        span_y = t * WINGSPAN_HALF

        # Chord interpolation (linear taper)
        chord = WING_ROOT_CHORD * (1.0 - t * (1.0 - WING_TAPER))
        thickness = WING_THICKNESS

        # Sweep offset (leading edge moves aft)
        sweep_offset = span_y * math.tan(sweep_rad)

        # Dihedral offset (wing rises)
        dihedral_offset = span_y * math.sin(dihedral_rad)

        # Generate airfoil profile
        profile = airfoil_profile(chord, thickness)

        ring_verts = []
        for px, pz in profile:
            x = WING_ATTACH_X + px - sweep_offset - chord * 0.25  # quarter-chord alignment
            y = span_y
            z = pz + dihedral_offset
            v = bm.verts.new((x, y, z))
            ring_verts.append(v)
        section_rings.append(ring_verts)

    bm.verts.ensure_lookup_table()

    # Connect section rings
    n_profile = len(section_rings[0])
    for s in range(len(section_rings) - 1):
        for i in range(n_profile):
            i_next = (i + 1) % n_profile
            v1 = section_rings[s][i]
            v2 = section_rings[s][i_next]
            v3 = section_rings[s + 1][i_next]
            v4 = section_rings[s + 1][i]
            bm.faces.new((v1, v2, v3, v4))

    # Cap root (inner face)
    root_verts = section_rings[0]
    if len(root_verts) >= 3:
        try:
            bm.faces.new(root_verts[::-1])
        except ValueError:
            pass  # Skip if face already exists

    # Cap tip
    tip_verts = section_rings[-1]
    if len(tip_verts) >= 3:
        try:
            bm.faces.new(tip_verts)
        except ValueError:
            pass

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    finalize_bmesh(obj, bm)
    return obj


def create_engine() -> bpy.types.Object:
    """Create right engine nacelle. Will be mirrored later."""
    obj, bm = new_bmesh_object("Engine")

    span_y = WINGSPAN_HALF * ENGINE_SPAN_POS
    dihedral_offset = span_y * math.sin(math.radians(WING_DIHEDRAL_DEG))
    sweep_offset = span_y * math.tan(math.radians(WING_SWEEP_DEG))

    # Engine center position (below and slightly forward of wing)
    center_x = WING_ATTACH_X - sweep_offset - WING_ROOT_CHORD * 0.1
    center_y = span_y
    center_z = dihedral_offset - ENGINE_PYLON_HEIGHT - ENGINE_RADIUS

    # Generate engine as a tapered cylinder
    sections_data = [
        (0.0, 1.0),        # intake (full radius)
        (0.15, 1.05),      # intake lip (slightly wider)
        (0.3, 0.95),       # narrowing
        (0.7, 0.9),        # body
        (1.0, 0.75),       # exhaust taper
    ]

    rings = []
    for t, r_scale in sections_data:
        x = center_x - ENGINE_LENGTH * 0.5 + t * ENGINE_LENGTH
        ring_verts = []
        for i in range(ENGINE_SEGMENTS):
            angle = 2.0 * math.pi * i / ENGINE_SEGMENTS
            y = center_y + math.cos(angle) * ENGINE_RADIUS * r_scale
            z = center_z + math.sin(angle) * ENGINE_RADIUS * r_scale
            v = bm.verts.new((x, y, z))
            ring_verts.append(v)
        rings.append(ring_verts)

    bm.verts.ensure_lookup_table()

    # Connect rings
    for r in range(len(rings) - 1):
        for i in range(ENGINE_SEGMENTS):
            i_next = (i + 1) % ENGINE_SEGMENTS
            v1 = rings[r][i]
            v2 = rings[r][i_next]
            v3 = rings[r + 1][i_next]
            v4 = rings[r + 1][i]
            bm.faces.new((v1, v2, v3, v4))

    # Cap intake
    intake_center = bm.verts.new((center_x - ENGINE_LENGTH * 0.5, center_y, center_z))
    for i in range(ENGINE_SEGMENTS):
        i_next = (i + 1) % ENGINE_SEGMENTS
        bm.faces.new((intake_center, rings[0][i_next], rings[0][i]))

    # Cap exhaust
    exhaust_center = bm.verts.new((center_x + ENGINE_LENGTH * 0.5, center_y, center_z))
    for i in range(ENGINE_SEGMENTS):
        i_next = (i + 1) % ENGINE_SEGMENTS
        bm.faces.new((exhaust_center, rings[-1][i], rings[-1][i_next]))

    # Pylon (simple quad connecting engine top to wing underside)
    pylon_verts = [
        bm.verts.new((center_x - ENGINE_LENGTH * 0.2, center_y - 0.05, center_z + ENGINE_RADIUS)),
        bm.verts.new((center_x + ENGINE_LENGTH * 0.15, center_y - 0.05, center_z + ENGINE_RADIUS)),
        bm.verts.new((center_x + ENGINE_LENGTH * 0.15, center_y - 0.05, dihedral_offset - 0.05)),
        bm.verts.new((center_x - ENGINE_LENGTH * 0.2, center_y - 0.05, dihedral_offset - 0.05)),
    ]
    bm.faces.new(pylon_verts)
    # Other side of pylon
    pylon_verts2 = [
        bm.verts.new((center_x - ENGINE_LENGTH * 0.2, center_y + 0.05, center_z + ENGINE_RADIUS)),
        bm.verts.new((center_x - ENGINE_LENGTH * 0.2, center_y + 0.05, dihedral_offset - 0.05)),
        bm.verts.new((center_x + ENGINE_LENGTH * 0.15, center_y + 0.05, dihedral_offset - 0.05)),
        bm.verts.new((center_x + ENGINE_LENGTH * 0.15, center_y + 0.05, center_z + ENGINE_RADIUS)),
    ]
    bm.faces.new(pylon_verts2)

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    finalize_bmesh(obj, bm)
    return obj


def create_vertical_stabilizer() -> bpy.types.Object:
    """Create vertical tail stabilizer."""
    obj, bm = new_bmesh_object("VStab")

    x_base = FUSELAGE_LENGTH / 2 - TAIL_POSITION
    sections = 4

    rings = []
    for s in range(sections):
        t = s / (sections - 1)
        height = t * TAIL_VERT_HEIGHT
        chord = TAIL_VERT_CHORD * (1.0 - t * 0.5)  # taper
        sweep = height * math.tan(math.radians(35))
        thickness = 0.08 * chord

        # Simple diamond profile for vertical stabilizer
        ring_verts = [
            bm.verts.new((x_base - sweep, 0, FUSELAGE_RADIUS + height)),                    # leading edge
            bm.verts.new((x_base - sweep + chord * 0.3, thickness, FUSELAGE_RADIUS + height)),  # upper mid
            bm.verts.new((x_base - sweep + chord, 0, FUSELAGE_RADIUS + height)),              # trailing edge
            bm.verts.new((x_base - sweep + chord * 0.3, -thickness, FUSELAGE_RADIUS + height)),  # lower mid
        ]
        rings.append(ring_verts)

    bm.verts.ensure_lookup_table()

    n_profile = 4
    for s in range(len(rings) - 1):
        for i in range(n_profile):
            i_next = (i + 1) % n_profile
            bm.faces.new((rings[s][i], rings[s][i_next], rings[s+1][i_next], rings[s+1][i]))

    # Cap base and tip
    try:
        bm.faces.new(rings[0][::-1])
    except ValueError:
        pass
    try:
        bm.faces.new(rings[-1])
    except ValueError:
        pass

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    finalize_bmesh(obj, bm)
    return obj


def create_horizontal_stabilizer() -> bpy.types.Object:
    """Create right horizontal stabilizer. Will be mirrored."""
    obj, bm = new_bmesh_object("HStab")

    x_base = FUSELAGE_LENGTH / 2 - TAIL_POSITION
    z_base = FUSELAGE_RADIUS * 0.8
    sections = 3

    rings = []
    for s in range(sections):
        t = s / (sections - 1)
        span_y = t * TAIL_HORIZ_SPAN_HALF
        chord = TAIL_HORIZ_CHORD * (1.0 - t * 0.4)
        sweep = span_y * math.tan(math.radians(30))
        thickness = 0.06 * chord

        ring_verts = [
            bm.verts.new((x_base - sweep, span_y, z_base)),
            bm.verts.new((x_base - sweep + chord * 0.3, span_y, z_base + thickness)),
            bm.verts.new((x_base - sweep + chord, span_y, z_base)),
            bm.verts.new((x_base - sweep + chord * 0.3, span_y, z_base - thickness)),
        ]
        rings.append(ring_verts)

    bm.verts.ensure_lookup_table()

    n_profile = 4
    for s in range(len(rings) - 1):
        for i in range(n_profile):
            i_next = (i + 1) % n_profile
            bm.faces.new((rings[s][i], rings[s][i_next], rings[s+1][i_next], rings[s+1][i]))

    try:
        bm.faces.new(rings[0][::-1])
    except ValueError:
        pass
    try:
        bm.faces.new(rings[-1])
    except ValueError:
        pass

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    finalize_bmesh(obj, bm)
    return obj


def create_winglet() -> bpy.types.Object:
    """Create right winglet at wing tip. Will be mirrored."""
    obj, bm = new_bmesh_object("Winglet")

    # Wing tip position
    tip_y = WINGSPAN_HALF
    dihedral_z = tip_y * math.sin(math.radians(WING_DIHEDRAL_DEG))
    sweep_x = tip_y * math.tan(math.radians(WING_SWEEP_DEG))
    tip_chord = WING_ROOT_CHORD * WING_TAPER

    base_x = WING_ATTACH_X - sweep_x - tip_chord * 0.25
    winglet_sweep = math.tan(math.radians(WINGLET_SWEEP_DEG))

    # Simple 3-section winglet
    sections = [
        (0.0, tip_chord, 0.0),
        (0.5, tip_chord * 0.6, WINGLET_HEIGHT * 0.6),
        (1.0, tip_chord * 0.3, WINGLET_HEIGHT),
    ]

    rings = []
    for t, chord, height in sections:
        x_off = height * winglet_sweep
        ring_verts = [
            bm.verts.new((base_x - x_off, tip_y, dihedral_z + height)),
            bm.verts.new((base_x - x_off + chord * 0.5, tip_y, dihedral_z + height + 0.02)),
            bm.verts.new((base_x - x_off + chord, tip_y, dihedral_z + height)),
            bm.verts.new((base_x - x_off + chord * 0.5, tip_y, dihedral_z + height - 0.02)),
        ]
        rings.append(ring_verts)

    bm.verts.ensure_lookup_table()

    for s in range(len(rings) - 1):
        for i in range(4):
            i_next = (i + 1) % 4
            bm.faces.new((rings[s][i], rings[s][i_next], rings[s+1][i_next], rings[s+1][i]))

    try:
        bm.faces.new(rings[-1])
    except ValueError:
        pass

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    finalize_bmesh(obj, bm)
    return obj


# =============================================================================
# Assembly & Finalization
# =============================================================================

def create_material() -> bpy.data.materials:
    """Create PBR material optimized for fog + rim lighting."""
    mat = bpy.data.materials.new(name="AircraftBody")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = MAT_BASE_COLOR
        bsdf.inputs["Metallic"].default_value = MAT_METALLIC
        bsdf.inputs["Roughness"].default_value = MAT_ROUGHNESS
    return mat


def assemble_aircraft():
    """Create all parts, join, mirror, and finalize."""
    print("\n=== Generating Aircraft Model ===")

    # Create all parts (right side only for symmetric parts)
    parts = []

    print("  Creating fuselage...")
    fuselage = create_fuselage()
    parts.append(fuselage)

    print("  Creating wing...")
    wing = create_wing()
    parts.append(wing)

    print("  Creating engine...")
    engine = create_engine()
    parts.append(engine)

    print("  Creating vertical stabilizer...")
    vstab = create_vertical_stabilizer()
    parts.append(vstab)

    print("  Creating horizontal stabilizer...")
    hstab = create_horizontal_stabilizer()
    parts.append(hstab)

    print("  Creating winglet...")
    winglet = create_winglet()
    parts.append(winglet)

    # Select all parts and join
    bpy.ops.object.select_all(action='DESELECT')
    for part in parts:
        part.select_set(True)
    bpy.context.view_layer.objects.active = fuselage
    bpy.ops.object.join()

    aircraft = bpy.context.active_object
    aircraft.name = "Aircraft"

    # Enter edit mode for mesh operations
    bpy.ops.object.mode_set(mode='EDIT')
    bm = bmesh.from_edit_mesh(aircraft.data)

    # Symmetrize (mirror right side to left, Y axis)
    print("  Symmetrizing...")
    bmesh.ops.symmetrize(bm, input=bm.verts[:] + bm.edges[:] + bm.faces[:],
                         direction='Y', dist=0.001)

    # Remove doubles (merge overlapping vertices at symmetry plane)
    result = bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=0.02)
    print(f"  Remove doubles pass 1: merged vertices")

    # Fill holes to fix non-manifold geometry
    print("  Filling holes...")
    for attempt in range(3):
        boundary_edges = [e for e in bm.edges if e.is_boundary]
        if not boundary_edges:
            break
        bmesh.ops.holes_fill(bm, edges=boundary_edges, sides=6)
        bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=0.02)

    # Dissolve degenerate geometry
    bmesh.ops.dissolve_degenerate(bm, dist=0.001, edges=bm.edges[:])

    # Final cleanup
    bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=0.01)

    # Recalculate normals
    print("  Recalculating normals...")
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])

    # Triangulate for accurate tri count and glTF compatibility
    print("  Triangulating...")
    bmesh.ops.triangulate(bm, faces=bm.faces[:])

    bmesh.update_edit_mesh(aircraft.data)
    bpy.ops.object.mode_set(mode='OBJECT')

    # Smooth shading
    bpy.ops.object.shade_smooth()

    # Auto Smooth for Blender 5.x
    # In Blender 4.1+, auto smooth is handled via the Smooth by Angle modifier
    # or by setting sharp edges manually. In 5.x, use_auto_smooth is removed.
    try:
        # Blender 5.x: use shade_auto_smooth operator if available
        bpy.ops.object.shade_smooth_by_angle(angle=math.radians(30))
        print("  Auto smooth: shade_smooth_by_angle (30 deg)")
    except (AttributeError, RuntimeError):
        try:
            # Fallback for older Blender
            aircraft.data.use_auto_smooth = True
            aircraft.data.auto_smooth_angle = math.radians(30)
            print("  Auto smooth: legacy use_auto_smooth (30 deg)")
        except AttributeError:
            # Last resort: mark sharp edges manually based on angle
            bpy.ops.object.mode_set(mode='EDIT')
            bpy.ops.mesh.select_all(action='SELECT')
            bpy.ops.mesh.edges_select_sharp(sharpness=math.radians(30))
            bpy.ops.mesh.mark_sharp()
            bpy.ops.object.mode_set(mode='OBJECT')
            print("  Auto smooth: manual sharp edge marking (30 deg)")

    # Apply material
    mat = create_material()
    if aircraft.data.materials:
        aircraft.data.materials[0] = mat
    else:
        aircraft.data.materials.append(mat)

    # Orient for Three.js: nose pointing -Z, Y-up
    # Current: nose pointing -X. Rotate 90 degrees around Z axis
    aircraft.rotation_euler = (0, 0, math.radians(-90))
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)

    # Center origin
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
    aircraft.location = (0, 0, 0)

    return aircraft


# =============================================================================
# Validation
# =============================================================================

def validate(aircraft) -> bool:
    """Run quality checks on the generated model."""
    mesh = aircraft.data
    tri_count = len(mesh.polygons)
    vert_count = len(mesh.vertices)

    print(f"\n=== Validation ===")
    print(f"  Vertices: {vert_count}")
    print(f"  Triangles: {tri_count}")

    passed = True

    # Triangle count
    if TARGET_TRI_MIN <= tri_count <= TARGET_TRI_MAX:
        print(f"  [PASS] Tri count in range [{TARGET_TRI_MIN}, {TARGET_TRI_MAX}]")
    else:
        print(f"  [WARN] Tri count {tri_count} outside range [{TARGET_TRI_MIN}, {TARGET_TRI_MAX}]")
        # Don't fail, just warn

    # Check for non-manifold geometry
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='DESELECT')
    bpy.ops.mesh.select_non_manifold()
    bm = bmesh.from_edit_mesh(mesh)
    non_manifold = sum(1 for v in bm.verts if v.select)
    bpy.ops.object.mode_set(mode='OBJECT')

    if non_manifold == 0:
        print(f"  [PASS] Manifold: no non-manifold vertices")
    else:
        print(f"  [WARN] Non-manifold vertices: {non_manifold}")

    # Zero area faces
    zero_area = sum(1 for p in mesh.polygons if p.area < 1e-8)
    if zero_area == 0:
        print(f"  [PASS] No zero-area faces")
    else:
        print(f"  [WARN] Zero-area faces: {zero_area}")

    return passed


# =============================================================================
# Export & Render
# =============================================================================

def export_glb(aircraft):
    """Export as GLB with web-optimized settings."""
    print(f"\n=== Exporting to {OUTPUT_PATH} ===")

    # Select only the aircraft
    bpy.ops.object.select_all(action='DESELECT')
    aircraft.select_set(True)
    bpy.context.view_layer.objects.active = aircraft

    bpy.ops.export_scene.gltf(
        filepath=OUTPUT_PATH,
        export_format='GLB',
        use_selection=True,
        export_apply=True,
        export_animations=False,
        export_lights=False,
        export_cameras=False,
    )

    file_size = os.path.getsize(OUTPUT_PATH)
    print(f"  File size: {file_size:,} bytes ({file_size/1024:.1f} KB)")

    if file_size <= TARGET_FILE_SIZE_MAX:
        print(f"  [PASS] Under {TARGET_FILE_SIZE_MAX/1000:.0f}KB limit")
    else:
        print(f"  [WARN] Exceeds {TARGET_FILE_SIZE_MAX/1000:.0f}KB limit")


def render_preview():
    """Render a preview with fog-like conditions for visual verification."""
    print("\n=== Rendering Preview ===")

    # Set up camera
    cam_data = bpy.data.cameras.new("PreviewCam")
    cam_data.lens = 50
    cam_obj = bpy.data.objects.new("PreviewCam", cam_data)
    bpy.context.collection.objects.link(cam_obj)
    # 3/4 front view — shows wing silhouette, nose, and engines
    cam_obj.location = (12, -8, 5)
    bpy.context.scene.camera = cam_obj
    # Point camera at origin (where the aircraft is)
    constraint = cam_obj.constraints.new(type='TRACK_TO')
    constraint.target = bpy.data.objects.get("Aircraft")
    constraint.track_axis = 'TRACK_NEGATIVE_Z'
    constraint.up_axis = 'UP_Y'

    # Fog-like environment (world volume)
    world = bpy.data.worlds.new("FogWorld")
    bpy.context.scene.world = world
    world.use_nodes = True
    bg_node = world.node_tree.nodes.get("Background")
    if bg_node:
        bg_node.inputs["Color"].default_value = (0.12, 0.12, 0.14, 1.0)

    # Rim light
    rim_data = bpy.data.lights.new("RimLight", type='SUN')
    rim_data.energy = 3.0
    rim_data.color = (0.85, 0.88, 0.92)
    rim_obj = bpy.data.objects.new("RimLight", rim_data)
    bpy.context.collection.objects.link(rim_obj)
    rim_obj.rotation_euler = (math.radians(60), math.radians(-30), 0)

    # Key light
    key_data = bpy.data.lights.new("KeyLight", type='SUN')
    key_data.energy = 1.5
    key_data.color = (1.0, 0.95, 0.85)
    key_obj = bpy.data.objects.new("KeyLight", key_data)
    bpy.context.collection.objects.link(key_obj)
    key_obj.rotation_euler = (math.radians(45), math.radians(20), 0)

    # Render settings
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.resolution_x = 800
    scene.render.resolution_y = 600
    scene.render.filepath = "/tmp/aircraft-preview.png"
    scene.render.image_settings.file_format = 'PNG'

    bpy.ops.render.render(write_still=True)
    print(f"  Preview saved to {scene.render.filepath}")


# =============================================================================
# Main
# =============================================================================

def main():
    clear_scene()
    aircraft = assemble_aircraft()
    validate(aircraft)
    export_glb(aircraft)

    # Check for --render flag
    argv = sys.argv
    if "--" in argv:
        script_args = argv[argv.index("--") + 1:]
        if "--render" in script_args:
            render_preview()

    print("\n=== Done ===")


if __name__ == "__main__":
    main()
