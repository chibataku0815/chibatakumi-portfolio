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
/** Easing function: maps t in [0,1] to [0,1]. Default: linear (identity). */
export type EasingFn = (t: number) => number;
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
export declare function createCamera(config?: CreateCameraConfig): CameraState;
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
export declare function createOrbitalCamera(config?: CreateOrbitalCameraConfig): OrbitalCameraState;
/**
 * Interpolate between two CameraState instances.
 *
 * @param a       Start state
 * @param b       End state
 * @param t       Progress [0, 1]
 * @param easing  Optional easing function (default: linear)
 */
export declare function mixCamera(a: CameraState, b: CameraState, t: number, easing?: EasingFn): CameraState;
/**
 * Interpolate between two OrbitalCameraState instances.
 * Extends mixCamera with orbital-specific fields.
 */
export declare function mixOrbitalCamera(a: OrbitalCameraState, b: OrbitalCameraState, t: number, easing?: EasingFn): OrbitalCameraState;
/**
 * Dolly: move camera along Z axis.
 * Positive deltaZ moves camera forward (into the scene).
 */
export declare function dolly(camera: CameraState, deltaZ: number): CameraState;
/**
 * Pan: shift camera gaze point in screen space.
 * Does not move the camera in world space — only changes where it looks.
 */
export declare function pan(camera: CameraState, deltaX: number, deltaY: number): CameraState;
/**
 * Truck: move camera in world X/Y (lateral movement, not gaze shift).
 * Film terminology: truck left/right, pedestal up/down.
 */
export declare function truck(camera: CameraState, deltaX: number, deltaY: number): CameraState;
/**
 * Orbit: rotate an orbital camera around its Y-axis pivot.
 *
 * @param camera      OrbitalCameraState to rotate
 * @param deltaAngle  Angle delta in radians (positive = clockwise when viewed from above)
 */
export declare function orbit(camera: OrbitalCameraState, deltaAngle: number): OrbitalCameraState;
