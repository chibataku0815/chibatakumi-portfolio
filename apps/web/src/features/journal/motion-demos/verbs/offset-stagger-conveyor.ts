// Vendored — verbatim motion grammar from motion-grammar-lab.
//   source: packages/motion-grammar/src/offset-stagger-conveyor.ts
//   upstream repo: forestone/motion-grammar-lab (private R&D)
//   provenance: promoted from studies/puttimw-motion-drawers cell #1
//     (drawer "offset"/ずらし) — see that study's
//     validation/offset-construction-record.md and the package header.
//   why vendored, not imported: the upstream package is private:true with a
//     Remotion-coupled barrel, so it is not consumable from this deployed app.
//     The module below is pure (numbers in → numbers out) — its only dep is the
//     sibling ./unit-bezier primitive (also vendored, byte-identical). No
//     Remotion, no React, no DOM — safe in an rAF loop. Keep in sync with
//     upstream; do not re-derive the math here. Everything below this header
//     comment is byte-identical to the entire upstream file. The measured
//     constants and the demo recentring live in
//     ./offset-stagger-conveyor.params.ts.

// Offset-stagger conveyor grammar.
//
// A single scalar clip advances across a slot ladder once per sub-cycle while
// its scalar value walks the same slot-key ladder with the same master
// progression. The clip is duplicated by sub-cycle offsets; optional
// per-duplicate key overrides model authorable one-key anomalies.
//
// The API owns only renderer-neutral schedule data. Reference measurements,
// colors, SVG realization, and anti-aliasing calibration stay in the consuming
// study.

import { unitBezierY } from "./unit-bezier";

export type OffsetStaggerKeyOverride = {
  duplicateClass: number;
  slot: number;
  value: number;
};

export type OffsetStaggerConveyorParams = {
  /** Full loop; must equal L * subcycleFrames, where L is duplicate classes. */
  periodFrames: number;
  /** One slot advance per sub-cycle. */
  subcycleFrames: number;
  /** Eased ramp duration inside a sub-cycle; the remainder is a hold. */
  activeFrames: number;
  /** Unit cubic-bezier for the single master progression. */
  bezier: [number, number, number, number];
  /** Scalar spacing between slots. */
  spacingPx: number;
  /** Coordinate of slot 0. */
  anchorCoord: number;
  /** Scalar value per slot, index 0..K-1. */
  slotKeys: number[];
  /** Optional per-duplicate altered keys. */
  keyOverrides?: OffsetStaggerKeyOverride[];
};

export type OffsetStaggerConveyorSample = {
  /** Scalar position along the conveyor axis. */
  coord: number;
  /** Interpolated key-ladder value. */
  value: number;
  /** Which time-offset duplicate this sample belongs to. */
  duplicateClass: number;
  /** Lattice slot this sample is leaving during the sub-cycle. */
  slotFrom: number;
};

const positiveModulo = (value: number, modulo: number): number =>
  ((value % modulo) + modulo) % modulo;

export const createOffsetStaggerConveyor = (
  params: OffsetStaggerConveyorParams,
) => {
  const slotCount = params.slotKeys.length;
  const duplicateClassCount = Math.round(params.periodFrames / params.subcycleFrames);
  const [p1x, p1y, p2x, p2y] = params.bezier;
  const overrides = params.keyOverrides ?? [];

  const keyOf = (slot: number, duplicateClass: number): number => {
    for (const override of overrides) {
      if (override.duplicateClass === duplicateClass && override.slot === slot) {
        return override.value;
      }
    }
    return slot >= 0 && slot < slotCount ? params.slotKeys[slot] : 0;
  };

  return (frame: number): OffsetStaggerConveyorSample[] => {
    const local = positiveModulo(frame, params.periodFrames);
    const subcycle = Math.floor(local / params.subcycleFrames);
    const subcycleFrame = local - subcycle * params.subcycleFrames;
    const progress = unitBezierY(
      p1x,
      p1y,
      p2x,
      p2y,
      Math.min(subcycleFrame / params.activeFrames, 1),
    );

    const samples: OffsetStaggerConveyorSample[] = [];
    for (let slot = 0; slot < slotCount; slot += 1) {
      const duplicateClass = positiveModulo(
        subcycle + slot - (slotCount - 1),
        duplicateClassCount,
      );
      const valueFrom = keyOf(slot, duplicateClass);
      const valueTo = keyOf(slot - 1, duplicateClass);
      samples.push({
        coord: params.anchorCoord + params.spacingPx * (slot - progress),
        value: valueFrom * (1 - progress) + valueTo * progress,
        duplicateClass,
        slotFrom: slot,
      });
    }
    return samples;
  };
};
