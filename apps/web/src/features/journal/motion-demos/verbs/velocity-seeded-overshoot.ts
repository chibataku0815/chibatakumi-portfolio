// Vendored — verbatim motion channel from motion-grammar-lab.
//   source: packages/motion-grammar/src/velocity-seeded-overshoot.ts
//   upstream repo: forestone/motion-grammar-lab (private R&D)
//   provenance: promoted from studies/puttimw-motion-drawers cell #11
//     (drawer "follow-through"/追従) — see that study's
//     validation/follow-through-construction-record.md and
//     velocity-seeded-overshoot-promotion-record.md.
//   why vendored, not imported: the upstream package is private:true with a
//     Remotion-coupled barrel, so it is not consumable from this deployed app.
//     The module below is pure (numbers in → numbers out) — its only dependency
//     is the sibling ./unit-bezier easing primitive (also vendored, byte-
//     identical). No Remotion, no React, no DOM — safe in an rAF loop. Keep in
//     sync with upstream; do not re-derive the math here. Everything below this
//     header comment is byte-identical to the entire upstream file. The glyph
//     assembly built on this channel is transcribed in
//     ./velocity-seeded-overshoot.params.ts.

/**
 * velocity-seeded-overshoot — a keyed motion channel whose overshoot is NOT a
 * free amplitude but is SEEDED by the channel's own key-exit velocity (the
 * After Effects "inertia" / overshoot idiom, mechanized).
 *
 * MECHANISM (load-bearing): one channel value over a loop is
 *
 *   value(t) = keyed(t) + Σ arrival rings
 *
 * where:
 *  - keyed(t) is a multi-key cubic-bezier move (first key = rest A, last key =
 *    rest B), evaluated leg-locally; the loop is closed by SPATIAL MIRROR +
 *    HALF-PERIOD SHIFT (second half replays restA+restB−keyed(t−half)), so one
 *    authored leg covers the full period.
 *  - each "arrival ring" is a damped sine SEEDED by the final key segment's
 *    EXIT VELOCITY (v · e^(−λ·d) · sin(ω·d) / ω) — ZERO free amplitude: the
 *    overshoot size emerges from how hot the channel arrives. Rings are summed
 *    from both legs' arrivals (alternating sign for the mirrored leg) with one
 *    extra period of lookback (periodic steady state; e^(−λ·period) < 2e-5).
 *
 * This is the reusable grammar behind "follow-through": stack several of these
 * channels with staggered starts / hotter arrivals and the secondary-motion
 * lag, the differential overshoot ladder, and any emergent lean between two
 * channels all fall out for free — no per-channel amplitude is authored. The
 * specific glyph assembly (which channels drive what, the shapes, the palette)
 * is the consumer's job; this module owns only the single channel.
 *
 * Promoted verbatim from studies/puttimw-motion-drawers verb `follow-through`
 * (cell #11). The drawer's `createFollowThroughSchedule` + geometry stay in the
 * study because their output type is glyph-bound (a lowercase-"i" with two
 * eye-marks); the generality demo drives this channel directly with 4 links on
 * a vertical axis, which is the operational definition of the reusable unit.
 *
 * Pure schedule: numbers in (frame), numbers out.
 */

import { unitBezierY } from "./unit-bezier";

export interface VelocitySeededOvershootKey {
  /** key time in leg-local frames (within [0, periodFrames/2)) */
  t: number;
  /** keyed value, design units */
  x: number;
}

export type VelocitySeededOvershootBezier = readonly [number, number, number, number];

export interface VelocitySeededOvershootChannel {
  /** move keys; first = rest A, last = rest B */
  keys: VelocitySeededOvershootKey[];
  /** one cubic-bezier ease per key segment (keys.length - 1 entries) */
  bezs: VelocitySeededOvershootBezier[];
  /** inertial-overshoot decay (per frame) */
  settleLambda: number;
  /** inertial-overshoot angular frequency (rad per frame) */
  settleOmega: number;
}

const positiveModulo = (value: number, modulus: number): number =>
  ((value % modulus) + modulus) % modulus;

/** exit velocity of a channel's final key segment, units per frame (signed) */
export const velocitySeededOvershootExitVelocity = (
  channel: VelocitySeededOvershootChannel,
): number => {
  const n = channel.keys.length;
  const last = channel.keys[n - 1];
  const prev = channel.keys[n - 2];
  const bez = channel.bezs[n - 2];
  const exitSlope = (1 - bez[3]) / Math.max(1e-9, 1 - bez[2]);
  return (exitSlope * (last.x - prev.x)) / (last.t - prev.t);
};

/**
 * One channel's value at a loop frame. Additive AE-expression form:
 * value(t) = keyed(t) + Σ arrival rings (periodic steady state, alternating
 * sign per mirrored leg, one extra period of lookback — e^(−λ·period) < 2e-5).
 */
export const velocitySeededOvershootValue = (
  frame: number,
  channel: VelocitySeededOvershootChannel,
  periodFrames: number,
): number => {
  const half = periodFrames / 2;
  const t = positiveModulo(frame, periodFrames);
  const keys = channel.keys;
  const restA = keys[0].x;
  const restB = keys[keys.length - 1].x;
  const tEnd = keys[keys.length - 1].t;

  const keyedLeg = (tau: number): number => {
    if (tau < keys[0].t) return restA;
    for (let i = 0; i < keys.length - 1; i += 1) {
      const a = keys[i];
      const b = keys[i + 1];
      if (tau < b.t) {
        const bz = channel.bezs[i];
        return a.x + (b.x - a.x) * unitBezierY(bz[0], bz[1], bz[2], bz[3], (tau - a.t) / (b.t - a.t));
      }
    }
    return restB;
  };

  let x = t < half ? keyedLeg(t) : restA + restB - keyedLeg(t - half);

  const vExit = velocitySeededOvershootExitVelocity(channel);
  const { settleLambda: lam, settleOmega: om } = channel;
  for (const [phase, sign] of [
    [tEnd, 1],
    [tEnd + half, -1],
  ] as const) {
    const e0 = positiveModulo(t - phase, periodFrames);
    for (const m of [0, 1]) {
      const d = e0 + m * periodFrames;
      x += sign * ((vExit * Math.exp(-lam * d) * Math.sin(om * d)) / om);
    }
  }
  return x;
};
