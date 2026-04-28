/**
 * layer.ts — Depth layer management for 2.5D compositions.
 *
 * Pure TypeScript, ZERO GPU dependency.
 * Handles depth sorting (painter's algorithm) and parallax resolution
 * relative to camera state.
 */

import type { Vec2, CameraState, Viewport, Layer } from "./types";

// ---------------------------------------------------------------------------
// Extended types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createLayer<T>(config: {
  id: string;
  depth: number;
  content: T;
  opacity?: number;
  parallaxScale?: number;
}): CompositionLayer<T> {
  return {
    id: config.id,
    depth: config.depth,
    content: config.content,
    opacity: config.opacity ?? 1,
    parallaxScale: config.parallaxScale ?? 1,
  };
}

// ---------------------------------------------------------------------------
// Sorting — painter's algorithm (back to front, descending depth)
// ---------------------------------------------------------------------------

export function sortLayersByDepth<T>(
  layers: ReadonlyArray<CompositionLayer<T>>,
): CompositionLayer<T>[] {
  return [...layers].sort((a, b) => b.depth - a.depth);
}

// ---------------------------------------------------------------------------
// Resolution — project layers through camera
// ---------------------------------------------------------------------------

/**
 * Resolve layers against a camera + viewport.
 *
 * For each layer:
 *  1. depthScale = focalLength / max(depth, epsilon) — perspective foreshortening
 *  2. screenOffset = camera pan * (1 - depthScale) * parallaxScale — parallax shift
 *  3. Layers sorted back-to-front, drawOrder assigned sequentially.
 */
export function resolveLayersWithCamera<T>(
  layers: ReadonlyArray<CompositionLayer<T>>,
  camera: CameraState,
  _viewport: Viewport,
): ResolvedLayer<T>[] {
  const EPSILON = 0.001;

  const sorted = sortLayersByDepth(layers);

  return sorted.map((layer, index) => {
    const effectiveDepth = Math.max(
      layer.depth - camera.position.z,
      EPSILON,
    );
    const depthScale = camera.focalLength / effectiveDepth;
    const pScale = layer.parallaxScale;

    // Parallax: layers closer than focal plane shift more with camera pan.
    // Factor (1 - depthScale) inverts: far layers barely move, near layers track.
    const parallaxFactor = (1 - depthScale) * pScale;
    const screenOffset: Vec2 = {
      x: camera.panX * parallaxFactor,
      y: camera.panY * parallaxFactor,
    };

    return {
      ...layer,
      screenOffset,
      depthScale,
      drawOrder: index,
    };
  });
}
