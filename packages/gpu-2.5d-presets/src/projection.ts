/**
 * projection.ts — Perspective projection math (pure functions)
 *
 * Ports and improves camera-utils.js from motion-function-playground.
 * All functions are pure: no side effects, no dependencies, no state.
 *
 * Coordinate system:
 *   +X = right, +Y = down (screen convention), +Z = into screen (away from camera).
 *   Camera looks along +Z. Objects with larger Z are farther away.
 *
 * Core formula:
 *   depth = focalLength + worldZ - cameraZ
 *   scale = focalLength / depth          (depth > 0 guard)
 *   screenX = panX + (worldX - panX) * scale
 */

import type {
  CameraState,
  OrbitalCameraState,
  ProjectionResult,
  Vec2,
  Viewport,
} from "./types";

// ---------------------------------------------------------------------------
// Basic projection
// ---------------------------------------------------------------------------

/**
 * Project a world point onto screen space using a simple pinhole model.
 *
 * @param worldX      World X coordinate
 * @param worldY      World Y coordinate
 * @param worldZ      World Z coordinate (positive = away from camera)
 * @param focalLength Focal length in px (controls perspective intensity)
 * @param cameraZ     Camera Z position
 * @returns Screen position + uniform scale factor
 */
export function projectPoint(
  worldX: number,
  worldY: number,
  worldZ: number,
  focalLength: number,
  cameraZ: number,
): ProjectionResult {
  const depth = focalLength + worldZ - cameraZ;
  const scale = depth > 0 ? focalLength / depth : 0;
  return {
    screenX: worldX * scale,
    screenY: worldY * scale,
    scale,
  };
}

/**
 * Project a world point using full CameraState (position + pan).
 *
 * panX/panY act as the screen-space "vanishing point" —
 * the point on screen where the optical axis intersects.
 */
export function projectPointWithCamera(
  worldX: number,
  worldY: number,
  worldZ: number,
  camera: CameraState,
): ProjectionResult {
  const depth = camera.focalLength + worldZ - camera.position.z;
  const scale = depth > 0 ? camera.focalLength / depth : 0;
  return {
    screenX: camera.panX + (worldX - camera.panX) * scale,
    screenY: camera.panY + (worldY - camera.panY) * scale,
    scale,
  };
}

// ---------------------------------------------------------------------------
// Orbital projection (Y-axis rotation + perspective)
// ---------------------------------------------------------------------------

/**
 * Project a world point through an orbital camera (Y-axis rotation).
 *
 * Equivalent to AE 3D camera orbiting a scene:
 *   1. Translate to camera-relative coordinates
 *   2. Apply Y-axis rotation matrix (angle = -orbitAngle, world rotates opposite)
 *   3. Perspective divide
 *   4. Map back to screen space
 *
 * @returns Screen position + scale + camRelZ (sort key for painter's algorithm)
 */
export function projectPointOrbital(
  worldX: number,
  worldY: number,
  worldZ: number,
  camera: OrbitalCameraState,
): ProjectionResult & { readonly camRelZ: number } {
  const cos = Math.cos(-camera.orbitAngle);
  const sin = Math.sin(-camera.orbitAngle);

  // Camera-relative coordinates
  const relX = worldX - camera.panX;
  const relZ = worldZ - camera.position.z;

  // Y-axis rotation (XZ plane)
  const camX = relX * cos - relZ * sin;
  const camZ = relX * sin + relZ * cos;
  const camY = worldY - camera.pivotY;

  // Perspective divide
  const depth = camera.focalLength + camZ;
  const scale = depth > 0 ? camera.focalLength / depth : 0;

  return {
    screenX: camera.panX + camX * scale,
    screenY: camera.pivotY + camY * scale,
    scale,
    camRelZ: camZ,
  };
}

// ---------------------------------------------------------------------------
// Viewport coordinate conversions
// ---------------------------------------------------------------------------

/**
 * Normalized [0,1] coordinates to viewport pixels.
 * (0,0) = top-left, (1,1) = bottom-right.
 */
export function normalizedToViewport(
  nx: number,
  ny: number,
  viewport: Viewport,
): Vec2 {
  return {
    x: nx * viewport.width,
    y: ny * viewport.height,
  };
}

/**
 * Viewport pixels to normalized [0,1] coordinates.
 * Inverse of normalizedToViewport.
 */
export function viewportToNormalized(
  px: number,
  py: number,
  viewport: Viewport,
): Vec2 {
  return {
    x: viewport.width > 0 ? px / viewport.width : 0,
    y: viewport.height > 0 ? py / viewport.height : 0,
  };
}

// ---------------------------------------------------------------------------
// Depth sorting utility
// ---------------------------------------------------------------------------

/**
 * Sort items by depth (largest = farthest = drawn first).
 * Returns a new array — input is not mutated.
 *
 * @param items   Array of items with a depth value
 * @param getDepth  Accessor function returning the depth for each item
 */
export function sortByDepth<T>(
  items: readonly T[],
  getDepth: (item: T) => number,
): T[] {
  return [...items].sort((a, b) => getDepth(b) - getDepth(a));
}
