/**
 * types.ts — gpu-2.5d-presets shared type definitions
 *
 * 2.5D composition library: depth illusion via 2D rendering + perspective projection.
 * Film/photography terminology throughout (focalLength in mm, not fov).
 * All properties readonly — immutable by convention.
 */

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

export interface Vec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

/** Four corner points defining a quadrilateral (CW from top-left). */
export interface Quad {
  readonly topLeft: Vec2;
  readonly topRight: Vec2;
  readonly bottomRight: Vec2;
  readonly bottomLeft: Vec2;
}

/** Per-corner dx/dy offsets for perspective warp. */
export interface PerspectiveCorners {
  readonly topLeft: Vec2;
  readonly topRight: Vec2;
  readonly bottomRight: Vec2;
  readonly bottomLeft: Vec2;
}

// ---------------------------------------------------------------------------
// Camera
// ---------------------------------------------------------------------------

/**
 * Camera state — models a simple pinhole camera.
 *
 * focalLength: lens focal length in mm (50 = natural, <35 = wide/exaggerated, >85 = telephoto).
 * position:    camera world position (z = distance from scene origin along optical axis).
 * panX/panY:   screen-space gaze point (where the optical axis hits the viewport).
 */
export interface CameraState {
  readonly focalLength: number;
  readonly position: Vec3;
  readonly panX: number;
  readonly panY: number;
}

/**
 * Orbital camera — extends CameraState with Y-axis orbit.
 *
 * orbitAngle:  rotation around Y axis (radians). 0 = front view.
 * orbitRadius: distance from pivot (px). Reserved for future arc shots.
 * pivotY:      world-Y coordinate of the orbit pivot point.
 */
export interface OrbitalCameraState extends CameraState {
  readonly orbitAngle: number;
  readonly orbitRadius: number;
  readonly pivotY: number;
}

// ---------------------------------------------------------------------------
// Projection
// ---------------------------------------------------------------------------

/** Result of projecting a world point onto screen space. */
export interface ProjectionResult {
  readonly screenX: number;
  readonly screenY: number;
  /** Uniform scale factor (focalLength / depth). >1 = closer than focal plane. */
  readonly scale: number;
}

// ---------------------------------------------------------------------------
// Box (3D primitive for 2.5D compositions)
// ---------------------------------------------------------------------------

export interface BoxDimensions {
  readonly width: number;
  readonly height: number;
  readonly depth: number;
}

/** Pose of a box in world space. Angles in degrees. */
export interface BoxPose {
  readonly position: Vec3;
  readonly yaw: number;
  readonly pitch: number;
}

/** A single face of a projected box, ready for painter's algorithm rendering. */
export interface BoxFace<T = unknown> {
  readonly faceId: string;
  readonly quad: Quad;
  readonly normal: Vec3;
  /** Average depth in camera space — sort key for painter's algorithm. */
  readonly averageDepth: number;
  /** Arbitrary payload (texture ref, color, content handle). */
  readonly payload: T;
}

// ---------------------------------------------------------------------------
// Layer / Composition
// ---------------------------------------------------------------------------

/** A depth-sorted layer in a 2.5D composition. */
export interface Layer<T = unknown> {
  readonly id: string;
  readonly depth: number;
  readonly content: T;
  readonly opacity: number;
}

export interface Viewport {
  readonly width: number;
  readonly height: number;
}

export interface CompositionConfig<T = unknown> {
  readonly layers: readonly Layer<T>[];
  readonly camera: CameraState;
  readonly viewport: Viewport;
}
