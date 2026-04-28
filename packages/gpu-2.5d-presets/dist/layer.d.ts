/**
 * layer.ts — Depth layer management for 2.5D compositions.
 *
 * Pure TypeScript, ZERO GPU dependency.
 * Handles depth sorting (painter's algorithm) and parallax resolution
 * relative to camera state.
 */
import type { Vec2, CameraState, Viewport, Layer } from "./types";
/** Layer with parallax configuration for 2.5D compositions. */
export interface CompositionLayer<T = unknown> extends Layer<T> {
    /** Multiplier for camera-driven parallax offset. 0 = locked, 1 = normal, >1 = exaggerated. */
    readonly parallaxScale: number;
}
/** Fully resolved layer ready for rendering. */
export interface ResolvedLayer<T = unknown> extends CompositionLayer<T> {
    /** Screen-space parallax offset (px) derived from camera pan + depth. */
    readonly screenOffset: Vec2;
    /** Perspective scale factor at this layer's depth (focalLength / depth). */
    readonly depthScale: number;
    /** Back-to-front draw order index (0 = furthest). */
    readonly drawOrder: number;
}
export declare function createLayer<T>(config: {
    id: string;
    depth: number;
    content: T;
    opacity?: number;
    parallaxScale?: number;
}): CompositionLayer<T>;
export declare function sortLayersByDepth<T>(layers: ReadonlyArray<CompositionLayer<T>>): CompositionLayer<T>[];
/**
 * Resolve layers against a camera + viewport.
 *
 * For each layer:
 *  1. depthScale = focalLength / max(depth, epsilon) — perspective foreshortening
 *  2. screenOffset = camera pan * (1 - depthScale) * parallaxScale — parallax shift
 *  3. Layers sorted back-to-front, drawOrder assigned sequentially.
 */
export declare function resolveLayersWithCamera<T>(layers: ReadonlyArray<CompositionLayer<T>>, camera: CameraState, _viewport: Viewport): ResolvedLayer<T>[];
