/**
 * perspective-warp.ts — Quad Warping + PerspectiveCorners
 *
 * Bilinear quad sampling, interpolation, and child-within-plane resolution
 * for 2.5D perspective composition. All functions are pure and stateless.
 */
import type { Vec2, Quad, PerspectiveCorners } from "./types";
import type { Rect } from "./box-rig";
export interface PlaneChild<T = unknown> {
    readonly localRect: Rect;
    readonly surface?: {
        readonly baseTransform?: Partial<{
            readonly scaleX: number;
            readonly scaleY: number;
            readonly rotation: number;
            readonly opacity: number;
        }>;
        readonly [key: string]: unknown;
    };
    readonly payload?: T;
}
export interface CenteredGeometry {
    readonly localLeft: number;
    readonly localTop: number;
    readonly width: number;
    readonly height: number;
}
export interface BaseTransform {
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly scaleX: number;
    readonly scaleY: number;
    readonly rotation: number;
    readonly opacity: number;
    readonly originX: number;
    readonly originY: number;
}
export interface ResolvedChild<T = unknown> {
    readonly surface: {
        readonly rect: {
            readonly width: number;
            readonly height: number;
        };
        readonly geometry: CenteredGeometry;
        readonly baseTransform: BaseTransform;
        readonly [key: string]: unknown;
    };
    readonly resolvedTransform: BaseTransform & {
        readonly perspectiveCorners: PerspectiveCorners;
    };
    readonly sourceRect: Rect;
    readonly targetQuad: Quad;
}
export interface PerspectivePlaneGroupConfig<T = unknown> {
    readonly planeRect: Rect;
    readonly targetQuad: Quad;
    readonly children: readonly PlaneChild<T>[];
}
/**
 * Bilinear interpolation: sample a position inside a quad at normalized (u, v).
 * u: 0 = left edge, 1 = right edge
 * v: 0 = top edge,  1 = bottom edge
 */
export declare function sampleQuad(quad: Quad, u: number, v: number): Vec2;
/**
 * Linearly interpolate all 4 corners between two quads.
 */
export declare function interpolateQuad(from: Quad, to: Quad, t: number): Quad;
/**
 * Translate all 4 corners of a quad by (dx, dy).
 */
export declare function translateQuad(quad: Quad, dx: number, dy: number): Quad;
/**
 * Compute per-corner dx/dy offsets from an axis-aligned source rect
 * to an arbitrary target quad. Used as input for CSS/GPU perspective warp.
 */
export declare function buildPerspectiveCorners(sourceRect: Rect, targetQuad: Quad): PerspectiveCorners;
/**
 * Map a child rectangle within a plane to its warped position
 * within the plane's target quad via UV sampling.
 */
export declare function resolveChildQuad(planeRect: Rect, targetQuad: Quad, childRect: Rect): Quad;
/**
 * Resolve a group of children within a perspective plane.
 * Each child gets its own warped quad and perspective corner offsets.
 */
export declare function buildPerspectivePlaneGroup<T = unknown>(config: PerspectivePlaneGroupConfig<T>): ResolvedChild<T>[];
