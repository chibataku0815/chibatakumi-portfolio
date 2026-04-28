/**
 * box-rig.ts — 3D Box Model + Face Culling
 *
 * Builds a 6-face box in local space, applies yaw/pitch rotation,
 * perspective-projects each vertex, back-face culls, and returns
 * visible faces sorted for painter's algorithm rendering.
 *
 * Pure functions only. No mutable state.
 */

import type { Vec2, Vec3, Quad, BoxDimensions, BoxPose, BoxFace } from "./types";

// ---------------------------------------------------------------------------
// Local types (reconcile with types.ts later)
// ---------------------------------------------------------------------------

/** Axis-aligned rectangle in screen space. */
// from types.ts
export interface Rect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

// from types.ts
export type FaceId = "front" | "back" | "left" | "right" | "top" | "bottom";

// from types.ts
export interface FacePayload {
  readonly [key: string]: unknown;
}

// from types.ts
export interface BoxDescriptor<T = unknown> {
  readonly dimensions: BoxDimensions;
  readonly pose: BoxPose;
  readonly faces: Partial<Record<FaceId, T>>;
}

// from types.ts
export interface BoxRig<T = unknown> {
  readonly dimensions: BoxDimensions;
  readonly pose: BoxPose;
  readonly faces: Partial<Record<FaceId, T>>;
}

// from types.ts
export interface VisibleFace<T = unknown> {
  readonly faceId: FaceId;
  readonly quad: Quad;
  readonly averageDepth: number;
  readonly normal: Vec3;
  readonly payload: T;
  readonly drawOrder: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DEFAULT_FOCAL_LENGTH = 640;
export const VISIBILITY_EPSILON = 0.0001;
export const FACE_ORDER: readonly FaceId[] = [
  "back",
  "left",
  "bottom",
  "top",
  "right",
  "front",
] as const;

const FACE_ORDER_RANK = new Map<FaceId, number>(
  FACE_ORDER.map((id, i) => [id, i]),
);

// ---------------------------------------------------------------------------
// Internal math helpers
// ---------------------------------------------------------------------------

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function rotateYaw(p: Vec3, yaw: number): Vec3 {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  return { x: p.x * c + p.z * s, y: p.y, z: -p.x * s + p.z * c };
}

function rotatePitch(p: Vec3, pitch: number): Vec3 {
  const c = Math.cos(pitch);
  const s = Math.sin(pitch);
  return { x: p.x, y: p.y * c - p.z * s, z: p.y * s + p.z * c };
}

function transform(p: Vec3, yaw: number, pitch: number): Vec3 {
  return rotatePitch(rotateYaw(p, yaw), pitch);
}

interface ProjectedPoint {
  readonly x: number;
  readonly y: number;
  readonly depth: number;
  readonly scale: number;
}

function projectPoint(
  p: Vec3,
  pose: BoxPose,
  focalLength: number,
): ProjectedPoint {
  const depth = focalLength + pose.position.z + p.z;
  const scale = depth > 0 ? focalLength / depth : 0;
  return {
    x: pose.position.x + p.x * scale,
    y: pose.position.y + p.y * scale,
    depth: pose.position.z + p.z,
    scale,
  };
}

function average(values: readonly number[]): number {
  if (values.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < values.length; i++) sum += values[i];
  return sum / values.length;
}

// ---------------------------------------------------------------------------
// Face geometry definitions (local space, CW from top-left)
// ---------------------------------------------------------------------------

interface FaceDefinition {
  readonly normal: Vec3;
  readonly points: readonly [Vec3, Vec3, Vec3, Vec3];
}

function getFaceDefinition(
  faceId: FaceId,
  dim: BoxDimensions,
): FaceDefinition {
  const hw = dim.width * 0.5;
  const hh = dim.height * 0.5;
  const hd = dim.depth * 0.5;

  switch (faceId) {
    case "front":
      return {
        normal: { x: 0, y: 0, z: -1 },
        points: [
          { x: -hw, y: -hh, z: -hd },
          { x: hw, y: -hh, z: -hd },
          { x: hw, y: hh, z: -hd },
          { x: -hw, y: hh, z: -hd },
        ],
      };
    case "back":
      return {
        normal: { x: 0, y: 0, z: 1 },
        points: [
          { x: hw, y: -hh, z: hd },
          { x: -hw, y: -hh, z: hd },
          { x: -hw, y: hh, z: hd },
          { x: hw, y: hh, z: hd },
        ],
      };
    case "right":
      return {
        normal: { x: 1, y: 0, z: 0 },
        points: [
          { x: hw, y: -hh, z: -hd },
          { x: hw, y: -hh, z: hd },
          { x: hw, y: hh, z: hd },
          { x: hw, y: hh, z: -hd },
        ],
      };
    case "left":
      return {
        normal: { x: -1, y: 0, z: 0 },
        points: [
          { x: -hw, y: -hh, z: hd },
          { x: -hw, y: -hh, z: -hd },
          { x: -hw, y: hh, z: -hd },
          { x: -hw, y: hh, z: hd },
        ],
      };
    case "top":
      return {
        normal: { x: 0, y: -1, z: 0 },
        points: [
          { x: -hw, y: -hh, z: hd },
          { x: hw, y: -hh, z: hd },
          { x: hw, y: -hh, z: -hd },
          { x: -hw, y: -hh, z: -hd },
        ],
      };
    case "bottom":
      return {
        normal: { x: 0, y: 1, z: 0 },
        points: [
          { x: -hw, y: hh, z: -hd },
          { x: hw, y: hh, z: -hd },
          { x: hw, y: hh, z: hd },
          { x: -hw, y: hh, z: hd },
        ],
      };
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Validate and store a box definition as an immutable rig.
 */
export function buildBoxRig<T = unknown>(
  descriptor: BoxDescriptor<T>,
): BoxRig<T> {
  return {
    dimensions: { ...descriptor.dimensions },
    pose: { ...descriptor.pose },
    faces: { ...descriptor.faces },
  };
}

/**
 * Resolve visible faces of a box after rotation, projection, and back-face culling.
 * Returns painter's-algorithm sorted array (back-to-front).
 */
export function resolveBoxRigFaces<T = unknown>(
  descriptor: BoxDescriptor<T>,
  focalLength: number = DEFAULT_FOCAL_LENGTH,
): VisibleFace<T>[] {
  const yaw = toRadians(descriptor.pose.yaw ?? 0);
  const pitch = toRadians(descriptor.pose.pitch ?? 0);

  // Intermediate type before drawOrder is assigned
  type PreSortFace = Omit<VisibleFace<T>, "drawOrder"> & {
    readonly faceId: FaceId;
  };
  const visible: PreSortFace[] = [];

  for (const faceId of FACE_ORDER) {
    const payload = descriptor.faces[faceId];
    if (payload === undefined) continue;

    const def = getFaceDefinition(faceId, descriptor.dimensions);
    const normal = transform(def.normal, yaw, pitch);

    // Back-face cull: face is visible only when normal points toward camera (negative z)
    if (normal.z >= -VISIBILITY_EPSILON) continue;

    const projected = def.points.map((p) =>
      projectPoint(transform(p, yaw, pitch), descriptor.pose, focalLength),
    );

    visible.push({
      faceId,
      payload,
      quad: {
        topLeft: { x: projected[0].x, y: projected[0].y },
        topRight: { x: projected[1].x, y: projected[1].y },
        bottomRight: { x: projected[2].x, y: projected[2].y },
        bottomLeft: { x: projected[3].x, y: projected[3].y },
      },
      averageDepth: average(projected.map((p) => p.depth)),
      normal,
    });
  }

  // Painter's sort: farthest first, tie-break by canonical face order
  visible.sort((a, b) => {
    const delta = b.averageDepth - a.averageDepth;
    if (Math.abs(delta) > VISIBILITY_EPSILON) return delta;
    return (
      (FACE_ORDER_RANK.get(a.faceId) ?? 0) -
      (FACE_ORDER_RANK.get(b.faceId) ?? 0)
    );
  });

  return visible.map((face, index) => ({ ...face, drawOrder: index }));
}

/**
 * Convert a visible face into a source-rect + target-quad pair
 * suitable for perspective-warp rendering.
 */
export function compileBoxRigFaceToPlaneInput(
  face: VisibleFace,
  sourceRect: Rect,
): { readonly sourceRect: Rect; readonly targetQuad: Quad } {
  return {
    sourceRect: {
      left: sourceRect.left,
      top: sourceRect.top,
      width: sourceRect.width,
      height: sourceRect.height,
    },
    targetQuad: {
      topLeft: { ...face.quad.topLeft },
      topRight: { ...face.quad.topRight },
      bottomRight: { ...face.quad.bottomRight },
      bottomLeft: { ...face.quad.bottomLeft },
    },
  };
}
