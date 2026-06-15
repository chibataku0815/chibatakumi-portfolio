// Vendored — corona dot GENERATOR + the orbit SCHEDULE for the corona-loop study.
//
//   generator source: forestone/motion-effect-authoring (Motif, private R&D),
//     src/features/mask-authoring/model/coronaGeneration.ts. The dot scatter
//     (dark eclipse void + gold stipple corona with density falloff) is OWNED by
//     Motif; the scatter below is faithful to that generator (same rng draw
//     order, same bounds cull). Split here into a direction-independent FIELD
//     plus a per-frame SHADE so the loop only re-measures brightness.
//   schedule source: the orbit is the new motion contribution — one master
//     direction angle swept once per loop with a seam-safe cosine rate
//     modulation (forestone/motion-grammar-lab, scripts/render-corona-loop.ts).
//   why vendored, not imported: both upstreams are private and renderer-coupled,
//     not consumable from this deployed app. Everything here is pure (numbers in
//     → numbers out): no React, no DOM, safe in an rAF loop.
//
// MECHANISM (load-bearing): dot geometry is fixed for the whole loop — only the
// bright LOBE moves. One direction angle sweeps a full turn per period; each
// dot's brightness is re-measured every frame from the cosine of (its azimuth −
// the direction), so the lit band flows around the ring while the dots stay put.
// Geometry is direction-independent and the dim floor sits above the drop
// threshold, so no dot ever pops in or out — the set is loop-invariant.

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const clamp = (value: number, min: number, max: number): number =>
  !Number.isFinite(value) ? min : Math.max(min, Math.min(max, value));

const seededStream = (seed: number): (() => number) => {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** viewBox the generator works in; renderers scale into their own space. */
export const CORONA_VIEWBOX = 800;

/** The scatter spec — direction-independent (direction is animated separately). */
export interface CoronaSpec {
  readonly dotCount: number;
  readonly baseSize: number;
  readonly voidRadius: number;
  readonly spread: number;
  readonly phase: number;
  readonly brightLevel: number;
  readonly dimLevel: number;
  readonly brightMid: number;
  readonly directionStrength: number;
  readonly seed: number;
}

/** A scattered dot, fixed for the whole loop. `azimuthDeg` + `radial` feed the
 *  per-frame shade; `x`/`y`/`radius` are its drawn geometry (viewBox space). */
export interface CoronaFieldDot {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  /** dot azimuth around the void, deg (screen y-down). */
  readonly azimuthDeg: number;
  /** base brightness from distance to center, in [0,1] — before the lobe. */
  readonly radial: number;
}

/** The orbit: how the bright lobe's direction angle moves over one loop. */
export interface CoronaOrbitParams {
  readonly periodFrames: number;
  /** lobe direction at the slow point (loop midpoint), deg. */
  readonly baseAngleDeg: number;
  /** rate-modulation depth: the lobe speeds up then eases, returning to the same
   *  angular speed at the seam so the loop has no velocity hitch. */
  readonly rateModDepth: number;
}

/**
 * GENERATOR — scatter the field once. Faithful to Motif's generateCoronaDots
 * (same rng draw order, same bounds cull); here it stops at the
 * direction-independent quantities so the loop can re-shade without re-scattering.
 */
export const generateCoronaField = (spec: CoronaSpec): CoronaFieldDot[] => {
  const half = CORONA_VIEWBOX / 2;
  const voidR = spec.voidRadius * half;
  const maxR = half * 1.06;
  const gamma = lerp(3, 0.7, spec.spread);
  const phaseR = (spec.phase * Math.PI) / 180;
  const rng = seededStream(Math.round(spec.seed));
  const n = Math.max(0, Math.round(spec.dotCount));
  const kSteep = 7;
  const field: CoronaFieldDot[] = [];

  Array.from({ length: n }).forEach(() => {
    const theta = rng() * Math.PI * 2;
    const tRad = Math.pow(rng(), gamma);
    const jittered = voidR + (maxR - voidR) * tRad + (rng() - 0.5) * 6;
    const r = Math.max(voidR, jittered);
    const nr = clamp((r - voidR) / Math.max(0.0001, maxR - voidR), 0, 1);
    const sizeNoise = 0.6 + rng() * 0.9;
    const th = theta + phaseR;
    const x = half + r * Math.cos(th);
    const y = half + r * Math.sin(th);
    if (x < 0 || x > CORONA_VIEWBOX || y < 0 || y > CORONA_VIEWBOX) return;

    const radial = 1 / (1 + Math.exp((nr - spec.brightMid) * kSteep));
    const radius = spec.baseSize * sizeNoise * lerp(1, 0.62, nr);
    field.push({ x, y, radius, azimuthDeg: (th * 180) / Math.PI, radial });
  });

  return field;
};

/** SCHEDULE — lobe direction angle for a loop-local frame (deg). */
export const coronaDirectionAngle = (
  local: number,
  orbit: CoronaOrbitParams,
): number => {
  const t =
    ((local % orbit.periodFrames) + orbit.periodFrames) % orbit.periodFrames;
  const phase = t / orbit.periodFrames;
  const turn = 360 * phase;
  const breath = ((orbit.rateModDepth * 360) / (2 * Math.PI)) * Math.sin(2 * Math.PI * phase);
  return orbit.baseAngleDeg + turn + breath;
};

/** SHADE — a dot's brightness in [0,1] for the current direction. The lit band
 *  is the cosine of the gap between the dot's azimuth and the direction. */
export const coronaBrightness = (
  azimuthDeg: number,
  directionDeg: number,
  directionStrength: number,
  radial: number,
): number => {
  const gap = ((azimuthDeg - directionDeg) * Math.PI) / 180;
  const lit = 1 + directionStrength * Math.cos(gap);
  return clamp(radial * lit, 0, 1);
};

/** final dot opacity for a brightness, between the dim floor and the bright cap. */
export const coronaAlpha = (
  brightness: number,
  dimLevel: number,
  brightLevel: number,
): number => lerp(dimLevel, brightLevel, brightness);
