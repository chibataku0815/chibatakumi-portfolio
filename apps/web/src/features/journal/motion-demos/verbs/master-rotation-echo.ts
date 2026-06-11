// Vendored — verbatim schedule logic from motion-grammar-lab.
//   source: packages/motion-grammar/src/master-rotation-echo.ts
//   upstream repo: forestone/motion-grammar-lab (private R&D)
//   provenance: promoted from studies/puttimw-motion-drawers cell #9
//     (drawer "afterimage"/残像) — see that study's
//     validation/afterimage-construction-record.md.
//   why vendored, not imported: the upstream package is private:true with a
//     Remotion-coupled barrel, so it is not consumable from this deployed app.
//     The schedule below is pure (numbers in → numbers out): its only
//     dependency is the cubic-bezier easing primitive in ./unit-bezier, which
//     is mathematically identical to CSS cubic-bezier(). No Remotion, no React,
//     no DOM — safe to run in an rAF loop. Keep in sync with upstream; do not
//     re-derive the math here.
//
// MECHANISM (load-bearing): ONE master phase theta(t) = 360° · bezier(clamp(t /
// sweepFrames, 0, 1)) per loop drives an antipodal dot pair; the afterimage is
// a TIME-SHIFTED DUPLICATE STACK — copy k replays theta(t − k·delayFrames) at
// opacity decay^k. The comet smear (slow phases), the discrete onion-skin ring
// (fast window) and the clean settle are all consequences of this one rig:
// copies look discrete exactly when speed·delay exceeds the dot's angular
// width. Each copy carries an optional sub-frame motion-blur capsule
// [theta(s − shutter/2), theta(s + shutter/2)] — unused by the origin cell,
// which ships shutterFrames = 0.

import { unitBezierY } from "./unit-bezier";

/** frame → loop-local frame in [0, period). Safe for negative frames.
 *  (inlined from studies/puttimw-motion-drawers/src/lib/loop — the only
 *  non-verbatim edit vs the study verb; render-byte covers it.) */
const loopFrame = (frame: number, period: number): number =>
  ((frame % period) + period) % period;

/** One echo copy of the master clip (lead = copy 0). */
export interface EchoCopyState {
  /** master phase at this copy's (sub-frame) source time, in [0, 1] */
  phase: number;
  /** phase at source − shutter/2 (motion-blur capsule start) */
  phaseStart: number;
  /** phase at source + shutter/2 (motion-blur capsule end) */
  phaseEnd: number;
  /** decay^k */
  opacity: number;
}

export interface TimeShiftEchoOptions {
  periodFrames: number;
  /** number of trailing copies (lead excluded) */
  copies: number;
  /** time shift per copy, frames */
  delayFrames: number;
  /** opacity ratio per copy */
  decay: number;
  /** motion-blur capsule width, frames (0 = none) */
  shutterFrames: number;
}

/**
 * Generic time-shifted duplicate stack: replays ONE loop-periodic master
 * phase at k·delay frame lags with geometrically decaying opacity.
 * The master phase receives a loop-local frame (float, [0, period)).
 */
export const timeShiftEcho = (
  masterPhase: (local: number) => number,
  opts: TimeShiftEchoOptions,
) => {
  const at = (t: number): number =>
    masterPhase(loopFrame(t, opts.periodFrames));
  return (frame: number): EchoCopyState[] => {
    const states: EchoCopyState[] = [];
    for (let k = 0; k <= opts.copies; k += 1) {
      const s = frame - k * opts.delayFrames;
      states.push({
        phase: at(s),
        phaseStart: at(s - opts.shutterFrames / 2),
        phaseEnd: at(s + opts.shutterFrames / 2),
        opacity: opts.decay ** k,
      });
    }
    return states;
  };
};

/** Schedule-only params (NO color — see header). */
export interface MasterRotationEchoParams {
  periodFrames: number;
  /** rotation keyframe span; frames sweepFrames..periodFrames are a rest hold */
  sweepFrames: number;
  /** master ease between the two rotation keyframes (unit bezier) */
  bezier: [number, number, number, number];
  copies: number;
  delayFrames: number;
  decay: number;
  shutterFrames: number;
  /** orbit center, DESIGN-cell coordinates */
  center: [number, number];
  orbitRadius: number;
  dotRadius: number;
  /** rest angles of the antipodal pair (deg; 0=+x, screen-clockwise) */
  restAnglesDeg: [number, number];
}

/** master rotation phase ∈ [0,1] at a loop-local (float) frame */
export const masterRotationEchoPhase = (
  local: number,
  p: MasterRotationEchoParams,
): number => {
  const [p1x, p1y, p2x, p2y] = p.bezier;
  return unitBezierY(p1x, p1y, p2x, p2y, local / p.sweepFrames);
};

/** One rendered copy: dot center angle + motion-blur capsule ends (deg). */
export interface MasterRotationEchoCopyState {
  angleDeg: number;
  angleStartDeg: number;
  angleEndDeg: number;
  opacity: number;
}

export interface MasterRotationEchoState {
  centerX: number;
  centerY: number;
  orbitRadius: number;
  dotRadius: number;
  /** arms[arm][k] — copy k of each antipodal arm (k=0 = lead) */
  arms: MasterRotationEchoCopyState[][];
}

export const createMasterRotationEchoSchedule = (
  params: MasterRotationEchoParams,
) => {
  const echo = timeShiftEcho(
    (local) => masterRotationEchoPhase(local, params),
    {
      periodFrames: params.periodFrames,
      copies: params.copies,
      delayFrames: params.delayFrames,
      decay: params.decay,
      shutterFrames: params.shutterFrames,
    },
  );
  return (frame: number): MasterRotationEchoState => {
    const stack = echo(frame);
    const arms = params.restAnglesDeg.map((rest) =>
      stack.map((c) => {
        // The rotation master is a sawtooth (phase 0→1 per loop) whose
        // continuity lives in ANGLE space (mod 360): a shutter capsule that
        // straddles the loop seam reads phases ~1 and ~0. Unwrap the capsule
        // end to the minimal span (phase 1 ≡ phase 0 for a full turn).
        const angleStartDeg = rest + 360 * c.phaseStart;
        let angleEndDeg = rest + 360 * c.phaseEnd;
        angleEndDeg -= 360 * Math.round((angleEndDeg - angleStartDeg) / 360);
        return {
          angleDeg: rest + 360 * c.phase,
          angleStartDeg,
          angleEndDeg,
          opacity: c.opacity,
        };
      }),
    );
    return {
      centerX: params.center[0],
      centerY: params.center[1],
      orbitRadius: params.orbitRadius,
      dotRadius: params.dotRadius,
      arms,
    };
  };
};
