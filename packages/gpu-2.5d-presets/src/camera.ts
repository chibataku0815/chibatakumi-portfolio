/**
 * camera.ts — Camera creation + interpolation (pure functions)
 *
 * Factory functions produce immutable CameraState / OrbitalCameraState.
 * Mix functions interpolate between two camera states with optional easing.
 * Transform functions (dolly, pan) return new state — zero mutation.
 *
 * Default focalLength: 50 mm (natural perspective, ~46 deg diagonal FOV on FF).
 * Default z: 200 (reasonable working distance for 2.5D scenes).
 */

import type { CameraState, OrbitalCameraState } from "./types";

// ---------------------------------------------------------------------------
// Easing type
// ---------------------------------------------------------------------------

/** Easing function: maps t in [0,1] to [0,1]. Default: linear (identity). */
export type EasingFn = (t: number) => number;

const linear: EasingFn = (t) => t;

// ---------------------------------------------------------------------------
// Factory functions
// ---------------------------------------------------------------------------

export interface CreateCameraConfig {
  readonly focalLength?: number;
  readonly z?: number;
  readonly panX?: number;
  readonly panY?: number;
}

/**
 * Create a CameraState with sensible defaults.
 *
 * @param config.focalLength  Focal length in mm (default: 50 — natural perspective)
 * @param config.z            Camera Z position (default: 200)
 * @param config.panX         Screen-space gaze X (default: 0)
 * @param config.panY         Screen-space gaze Y (default: 0)
 */
export function createCamera(config: CreateCameraConfig = {}): CameraState {
  return {
    focalLength: config.focalLength ?? 50,
    position: { x: 0, y: 0, z: config.z ?? 200 },
    panX: config.panX ?? 0,
    panY: config.panY ?? 0,
  };
}

export interface CreateOrbitalCameraConfig extends CreateCameraConfig {
  readonly orbitAngle?: number;
  readonly orbitRadius?: number;
  readonly pivotY?: number;
}

/**
 * Create an OrbitalCameraState with sensible defaults.
 *
 * @param config.orbitAngle   Y-axis orbit angle in radians (default: 0 — front view)
 * @param config.orbitRadius  Orbit radius in px (default: 0 — reserved for arc shots)
 * @param config.pivotY       World-Y pivot point (default: 0)
 */
export function createOrbitalCamera(
  config: CreateOrbitalCameraConfig = {},
): OrbitalCameraState {
  const base = createCamera(config);
  return {
    ...base,
    orbitAngle: config.orbitAngle ?? 0,
    orbitRadius: config.orbitRadius ?? 0,
    pivotY: config.pivotY ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Interpolation helpers
// ---------------------------------------------------------------------------

/** Linearly interpolate a scalar: a + (b - a) * t */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Interpolate between two CameraState instances.
 *
 * @param a       Start state
 * @param b       End state
 * @param t       Progress [0, 1]
 * @param easing  Optional easing function (default: linear)
 */
export function mixCamera(
  a: CameraState,
  b: CameraState,
  t: number,
  easing: EasingFn = linear,
): CameraState {
  const e = easing(t);
  return {
    focalLength: lerp(a.focalLength, b.focalLength, e),
    position: {
      x: lerp(a.position.x, b.position.x, e),
      y: lerp(a.position.y, b.position.y, e),
      z: lerp(a.position.z, b.position.z, e),
    },
    panX: lerp(a.panX, b.panX, e),
    panY: lerp(a.panY, b.panY, e),
  };
}

/**
 * Interpolate between two OrbitalCameraState instances.
 * Extends mixCamera with orbital-specific fields.
 */
export function mixOrbitalCamera(
  a: OrbitalCameraState,
  b: OrbitalCameraState,
  t: number,
  easing: EasingFn = linear,
): OrbitalCameraState {
  const base = mixCamera(a, b, t, easing);
  const e = easing(t);
  return {
    ...base,
    orbitAngle: lerp(a.orbitAngle, b.orbitAngle, e),
    orbitRadius: lerp(a.orbitRadius, b.orbitRadius, e),
    pivotY: lerp(a.pivotY, b.pivotY, e),
  };
}

// ---------------------------------------------------------------------------
// Camera transforms (immutable — return new state)
// ---------------------------------------------------------------------------

/**
 * Dolly: move camera along Z axis.
 * Positive deltaZ moves camera forward (into the scene).
 */
export function dolly(camera: CameraState, deltaZ: number): CameraState {
  return {
    ...camera,
    position: {
      ...camera.position,
      z: camera.position.z + deltaZ,
    },
  };
}

/**
 * Pan: shift camera gaze point in screen space.
 * Does not move the camera in world space — only changes where it looks.
 */
export function pan(
  camera: CameraState,
  deltaX: number,
  deltaY: number,
): CameraState {
  return {
    ...camera,
    panX: camera.panX + deltaX,
    panY: camera.panY + deltaY,
  };
}

/**
 * Truck: move camera in world X/Y (lateral movement, not gaze shift).
 * Film terminology: truck left/right, pedestal up/down.
 */
export function truck(
  camera: CameraState,
  deltaX: number,
  deltaY: number,
): CameraState {
  return {
    ...camera,
    position: {
      x: camera.position.x + deltaX,
      y: camera.position.y + deltaY,
      z: camera.position.z,
    },
  };
}

/**
 * Orbit: rotate an orbital camera around its Y-axis pivot.
 *
 * @param camera      OrbitalCameraState to rotate
 * @param deltaAngle  Angle delta in radians (positive = clockwise when viewed from above)
 */
export function orbit(
  camera: OrbitalCameraState,
  deltaAngle: number,
): OrbitalCameraState {
  return {
    ...camera,
    orbitAngle: camera.orbitAngle + deltaAngle,
  };
}
