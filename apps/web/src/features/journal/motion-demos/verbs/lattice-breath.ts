// Vendored — verbatim schedule logic from motion-grammar-lab.
//   source: packages/motion-grammar/src/lattice-breath.ts
//   upstream repo: forestone/motion-grammar-lab (private R&D)
//   provenance: promoted from studies/puttimw-motion-drawers cell #13
//     (drawer "count-growth"/増減) — see that study's
//     validation/lattice-breath-promotion-record.md.
//   why vendored, not imported: the upstream package is private:true with a
//     Remotion-coupled barrel, so it is not consumable from this deployed app.
//     The schedule below is pure (numbers in → numbers out): its only
//     dependency is the cubic-bezier easing primitive in ./unit-bezier, which
//     is mathematically identical to CSS cubic-bezier(). No Remotion, no React,
//     no DOM — safe to run in an rAF loop. Keep in sync with upstream; do not
//     re-derive the math here.
//
// MECHANISM (load-bearing): a polar-lattice "breath". ONE master timing
// (bloom → hold → collapse → rest) drives radius spread AND parent rotation on
// SHARED key frames per half (the "spiral" — separate bezier handles per
// channel, co-timing enforced by the type) while staggered per-family scale
// clips make interior families appear/disappear on the breathing lattice. The
// visible dot count growing and shrinking is FULLY EMERGENT from clip onsets —
// nothing spawns or dies structurally.

import { unitBezierY, type UnitBezier } from "./unit-bezier";

export interface LatticeBreathMaster {
  periodFrames: number;
  bloomStartFrame: number;
  bloomEndFrame: number;
  collapseStartFrame: number;
  collapseEndFrame: number;
  bloomBezier: UnitBezier;
  collapseBezier: UnitBezier;
  rotationBloomBezier: UnitBezier;
  rotationCollapseBezier: UnitBezier;
  /** parent rotation per half-loop (deg, negative = the origin cell's direction) */
  rotationPerHalfDeg: number;
}

/**
 * Two-segment 0→peak→1 scale-in clip (AE "0→120%→100%" idiom). The overshoot
 * amplitude (peakScale) is AUTHORED.
 */
export interface LatticeBreathOvershootInClip {
  riseDurFrames: number;
  riseBezier: UnitBezier;
  peakScale: number;
  settleDurFrames: number;
  settleBezier: UnitBezier;
}

/** One eased 0→1 segment. */
export interface LatticeBreathPlainClip {
  durFrames: number;
  bezier: UnitBezier;
}

export interface LatticeBreathParams {
  master: LatticeBreathMaster;
  geometry: {
    center: { x: number; y: number };
    /** arm count n; local angles = armAngle0 + k·(360/n), shared by inner ring */
    armCount: number;
    armAngle0Deg: number;
    restRadius: number;
    peakRadius: number;
    /** inner ring: fixed radius, same local angles as the arms */
    innerRadius: number;
    edgeFromRadius: number;
    edgeToRadius: number;
    edgeRadialKeys: {
      bloomStartFrame: number;
      bloomEndFrame: number;
      bloomBezier: UnitBezier;
      collapseStartFrame: number;
      collapseEndFrame: number;
      collapseBezier: UnitBezier;
    };
    dotRadius: number;
  };
  /** generic placement-offset channel; generic consumers use {0, 0}. */
  registrationOffsetDesign: { dx: number; dy: number };
  clips: {
    coreIn: LatticeBreathOvershootInClip;
    edgeIn: LatticeBreathPlainClip;
    coreOut: LatticeBreathPlainClip;
    edgeOut: LatticeBreathPlainClip;
  };
  onsets: {
    centerIn: number;
    edgeIn: number;
    innerIn: number;
    innerOut: number;
    centerOut: number;
    edgeOut: number;
  };
}

/** Master phase at a loop frame: radial spread ∈ [0,1] and parent rotation. */
export const latticeBreathMasterState = (
  master: LatticeBreathMaster,
  frame: number,
): { spread: number; rotationDeg: number } => {
  const f =
    ((frame % master.periodFrames) + master.periodFrames) % master.periodFrames;
  const {
    bloomStartFrame: b0,
    bloomEndFrame: b1,
    collapseStartFrame: c0,
    collapseEndFrame: c1,
    rotationPerHalfDeg: rot,
  } = master;
  if (f < b0) return { spread: 0, rotationDeg: 0 };
  if (f < b1) {
    const x = (f - b0) / (b1 - b0);
    return {
      spread: unitBezierY(...master.bloomBezier, x),
      rotationDeg: rot * unitBezierY(...master.rotationBloomBezier, x),
    };
  }
  if (f < c0) return { spread: 1, rotationDeg: rot };
  if (f < c1) {
    const x = (f - c0) / (c1 - c0);
    return {
      spread: 1 - unitBezierY(...master.collapseBezier, x),
      rotationDeg: rot + rot * unitBezierY(...master.rotationCollapseBezier, x),
    };
  }
  return { spread: 0, rotationDeg: 2 * rot };
};

const overshootInScale = (
  clip: LatticeBreathOvershootInClip,
  dt: number,
): number => {
  if (dt <= 0) return 0;
  if (dt < clip.riseDurFrames) {
    return clip.peakScale * unitBezierY(...clip.riseBezier, dt / clip.riseDurFrames);
  }
  const dt2 = dt - clip.riseDurFrames;
  if (dt2 < clip.settleDurFrames) {
    return (
      clip.peakScale -
      (clip.peakScale - 1) *
        unitBezierY(...clip.settleBezier, dt2 / clip.settleDurFrames)
    );
  }
  return 1;
};

const plainScale01 = (clip: LatticeBreathPlainClip, dt: number): number => {
  if (dt <= 0) return 0;
  if (dt >= clip.durFrames) return 1;
  return unitBezierY(...clip.bezier, dt / clip.durFrames);
};

/** in-clip then out-clip composition for one family. */
const familyScale = (
  frame: number,
  onsetIn: number,
  scaleIn: (dt: number) => number,
  onsetOut: number,
  outClip: LatticeBreathPlainClip,
): number => {
  if (frame >= onsetOut) {
    return 1 - plainScale01(outClip, frame - onsetOut);
  }
  return scaleIn(frame - onsetIn);
};

export type LatticeBreathRole = "arm" | "inner" | "edge" | "center";

export interface LatticeBreathDotState {
  role: LatticeBreathRole;
  cx: number;
  cy: number;
  /** rendered dot radius (dotRadius × family scale); 0 = not visible */
  r: number;
}

export interface LatticeBreathState {
  rotationDeg: number;
  armRadius: number;
  centerScale: number;
  innerScale: number;
  edgeScale: number;
  edgeRadius: number;
  dots: LatticeBreathDotState[];
}

/**
 * Schedule factory. Angles use the math convention (CCW positive, y up);
 * cartesian conversion flips y for the SVG screen space.
 */
export const createLatticeBreathSchedule = (params: LatticeBreathParams) => {
  const { master, geometry: g, clips, onsets } = params;
  const { dx, dy } = params.registrationOffsetDesign;
  const step = 360 / g.armCount;
  return (frame: number): LatticeBreathState => {
    const f =
      ((frame % master.periodFrames) + master.periodFrames) %
      master.periodFrames;
    const { spread, rotationDeg } = latticeBreathMasterState(master, f);
    const armRadius = g.restRadius + (g.peakRadius - g.restRadius) * spread;

    const centerScale = familyScale(
      f,
      onsets.centerIn,
      (dt) => overshootInScale(clips.coreIn, dt),
      onsets.centerOut,
      clips.coreOut,
    );
    const innerScale = familyScale(
      f,
      onsets.innerIn,
      (dt) => overshootInScale(clips.coreIn, dt),
      onsets.innerOut,
      clips.coreOut,
    );
    const edgeScale = familyScale(
      f,
      onsets.edgeIn,
      (dt) => plainScale01(clips.edgeIn, dt),
      onsets.edgeOut,
      clips.edgeOut,
    );
    const ek = g.edgeRadialKeys;
    let edgeSlide: number;
    if (f < ek.bloomStartFrame) {
      edgeSlide = 0;
    } else if (f < ek.bloomEndFrame) {
      edgeSlide = unitBezierY(
        ...ek.bloomBezier,
        (f - ek.bloomStartFrame) / (ek.bloomEndFrame - ek.bloomStartFrame),
      );
    } else if (f < ek.collapseStartFrame) {
      edgeSlide = 1;
    } else if (f < ek.collapseEndFrame) {
      edgeSlide =
        1 -
        unitBezierY(
          ...ek.collapseBezier,
          (f - ek.collapseStartFrame) /
            (ek.collapseEndFrame - ek.collapseStartFrame),
        );
    } else {
      edgeSlide = 0;
    }
    const edgeRadius =
      g.edgeFromRadius + (g.edgeToRadius - g.edgeFromRadius) * edgeSlide;

    const dots: LatticeBreathDotState[] = [];
    const place = (
      role: LatticeBreathRole,
      localAngleDeg: number,
      radius: number,
      scale: number,
    ) => {
      if (scale <= 0) return;
      const a = ((localAngleDeg + rotationDeg) * Math.PI) / 180;
      dots.push({
        role,
        cx: g.center.x + radius * Math.cos(a) + dx,
        cy: g.center.y - radius * Math.sin(a) + dy,
        r: g.dotRadius * scale,
      });
    };

    for (let k = 0; k < g.armCount; k += 1) {
      const armAngle = g.armAngle0Deg + k * step;
      place("arm", armAngle, armRadius, 1);
      place("inner", armAngle, g.innerRadius, innerScale);
      place("edge", armAngle + step / 2, edgeRadius, edgeScale);
    }
    place("center", 0, 0, centerScale);

    return {
      rotationDeg,
      armRadius,
      centerScale,
      innerScale,
      edgeScale,
      edgeRadius,
      dots,
    };
  };
};
