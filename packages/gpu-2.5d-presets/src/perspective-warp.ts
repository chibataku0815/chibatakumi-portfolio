/**
 * perspective-warp.ts — Quad Warping + PerspectiveCorners
 *
 * Bilinear quad sampling, interpolation, and child-within-plane resolution
 * for 2.5D perspective composition. All functions are pure and stateless.
 */

import type { Vec2, Quad, PerspectiveCorners } from "./types";
import type { Rect } from "./box-rig";

// ---------------------------------------------------------------------------
// Local types (reconcile with types.ts later)
// ---------------------------------------------------------------------------

// from types.ts
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

// from types.ts
export interface CenteredGeometry {
  readonly localLeft: number;
  readonly localTop: number;
  readonly width: number;
  readonly height: number;
}

// from types.ts
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

// from types.ts
export interface ResolvedChild<T = unknown> {
  readonly surface: {
    readonly rect: { readonly width: number; readonly height: number };
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

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function clampUnit(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpVec2(a: Vec2, b: Vec2, t: number): Vec2 {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

function createCenteredGeometry(
  width: number,
  height: number,
): CenteredGeometry {
  return {
    localLeft: -width * 0.5,
    localTop: -height * 0.5,
    width,
    height,
  };
}

function createBaseTransform(
  centerX: number,
  centerY: number,
  partial: Record<string, unknown> = {},
): BaseTransform {
  return {
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    opacity: 1,
    originX: 0,
    originY: 0,
    z: 0,
    ...partial,
    // position always from arguments, never overridden by partial
    x: centerX,
    y: centerY,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Bilinear interpolation: sample a position inside a quad at normalized (u, v).
 * u: 0 = left edge, 1 = right edge
 * v: 0 = top edge,  1 = bottom edge
 */
export function sampleQuad(quad: Quad, u: number, v: number): Vec2 {
  const uu = clampUnit(u);
  const vv = clampUnit(v);
  const top = lerpVec2(quad.topLeft, quad.topRight, uu);
  const bottom = lerpVec2(quad.bottomLeft, quad.bottomRight, uu);
  return lerpVec2(top, bottom, vv);
}

/**
 * Linearly interpolate all 4 corners between two quads.
 */
export function interpolateQuad(from: Quad, to: Quad, t: number): Quad {
  return {
    topLeft: lerpVec2(from.topLeft, to.topLeft, t),
    topRight: lerpVec2(from.topRight, to.topRight, t),
    bottomRight: lerpVec2(from.bottomRight, to.bottomRight, t),
    bottomLeft: lerpVec2(from.bottomLeft, to.bottomLeft, t),
  };
}

/**
 * Translate all 4 corners of a quad by (dx, dy).
 */
export function translateQuad(quad: Quad, dx: number, dy: number): Quad {
  return {
    topLeft: { x: quad.topLeft.x + dx, y: quad.topLeft.y + dy },
    topRight: { x: quad.topRight.x + dx, y: quad.topRight.y + dy },
    bottomRight: { x: quad.bottomRight.x + dx, y: quad.bottomRight.y + dy },
    bottomLeft: { x: quad.bottomLeft.x + dx, y: quad.bottomLeft.y + dy },
  };
}

/**
 * Compute per-corner dx/dy offsets from an axis-aligned source rect
 * to an arbitrary target quad. Used as input for CSS/GPU perspective warp.
 */
export function buildPerspectiveCorners(
  sourceRect: Rect,
  targetQuad: Quad,
): PerspectiveCorners {
  const right = sourceRect.left + sourceRect.width;
  const bottom = sourceRect.top + sourceRect.height;
  return {
    topLeft: {
      x: targetQuad.topLeft.x - sourceRect.left,
      y: targetQuad.topLeft.y - sourceRect.top,
    },
    topRight: {
      x: targetQuad.topRight.x - right,
      y: targetQuad.topRight.y - sourceRect.top,
    },
    bottomRight: {
      x: targetQuad.bottomRight.x - right,
      y: targetQuad.bottomRight.y - bottom,
    },
    bottomLeft: {
      x: targetQuad.bottomLeft.x - sourceRect.left,
      y: targetQuad.bottomLeft.y - bottom,
    },
  };
}

/**
 * Map a child rectangle within a plane to its warped position
 * within the plane's target quad via UV sampling.
 */
export function resolveChildQuad(
  planeRect: Rect,
  targetQuad: Quad,
  childRect: Rect,
): Quad {
  const u0 = childRect.left / planeRect.width;
  const v0 = childRect.top / planeRect.height;
  const u1 = (childRect.left + childRect.width) / planeRect.width;
  const v1 = (childRect.top + childRect.height) / planeRect.height;
  return {
    topLeft: sampleQuad(targetQuad, u0, v0),
    topRight: sampleQuad(targetQuad, u1, v0),
    bottomRight: sampleQuad(targetQuad, u1, v1),
    bottomLeft: sampleQuad(targetQuad, u0, v1),
  };
}

/**
 * Resolve a group of children within a perspective plane.
 * Each child gets its own warped quad and perspective corner offsets.
 */
export function buildPerspectivePlaneGroup<T = unknown>(
  config: PerspectivePlaneGroupConfig<T>,
): ResolvedChild<T>[] {
  const { planeRect, targetQuad, children } = config;

  return children.map((child) => {
    const childRect = child.localRect;

    const sourceRect: Rect = {
      left: planeRect.left + childRect.left,
      top: planeRect.top + childRect.top,
      width: childRect.width,
      height: childRect.height,
    };

    const geometry = createCenteredGeometry(childRect.width, childRect.height);

    const baseTransform = createBaseTransform(
      sourceRect.left + sourceRect.width * 0.5,
      sourceRect.top + sourceRect.height * 0.5,
      (child.surface?.baseTransform as Record<string, unknown>) ?? {},
    );

    const childQuad = resolveChildQuad(planeRect, targetQuad, childRect);
    const perspectiveCorners = buildPerspectiveCorners(sourceRect, childQuad);

    const surface = {
      ...(child.surface ?? {}),
      rect: { width: childRect.width, height: childRect.height },
      geometry,
      baseTransform,
    };

    const resolvedTransform = {
      ...baseTransform,
      perspectiveCorners,
    };

    return {
      surface,
      resolvedTransform,
      sourceRect,
      targetQuad: childQuad,
    } as ResolvedChild<T>;
  });
}
