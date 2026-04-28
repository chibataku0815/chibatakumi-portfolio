/**
 * box-rig.ts — 3D Box Model + Face Culling
 *
 * Builds a 6-face box in local space, applies yaw/pitch rotation,
 * perspective-projects each vertex, back-face culls, and returns
 * visible faces sorted for painter's algorithm rendering.
 *
 * Pure functions only. No mutable state.
 */
import type { Vec3, Quad, BoxDimensions, BoxPose } from "./types";
/** Axis-aligned rectangle in screen space. */
export interface Rect {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
}
export type FaceId = "front" | "back" | "left" | "right" | "top" | "bottom";
export interface FacePayload {
    readonly [key: string]: unknown;
}
export interface BoxDescriptor<T = unknown> {
    readonly dimensions: BoxDimensions;
    readonly pose: BoxPose;
    readonly faces: Partial<Record<FaceId, T>>;
}
export interface BoxRig<T = unknown> {
    readonly dimensions: BoxDimensions;
    readonly pose: BoxPose;
    readonly faces: Partial<Record<FaceId, T>>;
}
export interface VisibleFace<T = unknown> {
    readonly faceId: FaceId;
    readonly quad: Quad;
    readonly averageDepth: number;
    readonly normal: Vec3;
    readonly payload: T;
    readonly drawOrder: number;
}
export declare const DEFAULT_FOCAL_LENGTH = 640;
export declare const VISIBILITY_EPSILON = 0.0001;
export declare const FACE_ORDER: readonly FaceId[];
/**
 * Validate and store a box definition as an immutable rig.
 */
export declare function buildBoxRig<T = unknown>(descriptor: BoxDescriptor<T>): BoxRig<T>;
/**
 * Resolve visible faces of a box after rotation, projection, and back-face culling.
 * Returns painter's-algorithm sorted array (back-to-front).
 */
export declare function resolveBoxRigFaces<T = unknown>(descriptor: BoxDescriptor<T>, focalLength?: number): VisibleFace<T>[];
/**
 * Convert a visible face into a source-rect + target-quad pair
 * suitable for perspective-warp rendering.
 */
export declare function compileBoxRigFaceToPlaneInput(face: VisibleFace, sourceRect: Rect): {
    readonly sourceRect: Rect;
    readonly targetQuad: Quad;
};
