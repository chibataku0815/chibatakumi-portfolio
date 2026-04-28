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
import type { CameraState, OrbitalCameraState, ProjectionResult, Vec2, Viewport } from "./types";
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
export declare function projectPoint(worldX: number, worldY: number, worldZ: number, focalLength: number, cameraZ: number): ProjectionResult;
/**
 * Project a world point using full CameraState (position + pan).
 *
 * panX/panY act as the screen-space "vanishing point" —
 * the point on screen where the optical axis intersects.
 */
export declare function projectPointWithCamera(worldX: number, worldY: number, worldZ: number, camera: CameraState): ProjectionResult;
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
export declare function projectPointOrbital(worldX: number, worldY: number, worldZ: number, camera: OrbitalCameraState): ProjectionResult & {
    readonly camRelZ: number;
};
/**
 * Normalized [0,1] coordinates to viewport pixels.
 * (0,0) = top-left, (1,1) = bottom-right.
 */
export declare function normalizedToViewport(nx: number, ny: number, viewport: Viewport): Vec2;
/**
 * Viewport pixels to normalized [0,1] coordinates.
 * Inverse of normalizedToViewport.
 */
export declare function viewportToNormalized(px: number, py: number, viewport: Viewport): Vec2;
/**
 * Sort items by depth (largest = farthest = drawn first).
 * Returns a new array — input is not mutated.
 *
 * @param items   Array of items with a depth value
 * @param getDepth  Accessor function returning the depth for each item
 */
export declare function sortByDepth<T>(items: readonly T[], getDepth: (item: T) => number): T[];
