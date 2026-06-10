// Vendored — verbatim schedule logic from motion-grammar-lab.
//   source: packages/motion-grammar/src/pulse-grid.ts
//   upstream repo: forestone/motion-grammar-lab (private R&D)
//   provenance: promoted from studies/puttimw-motion-drawers cell #2
//     (drawer "random"/ランダム) — see that study's
//     validation/random-construction-record.md.
//   why vendored, not imported: the upstream package is private:true with a
//     Remotion-coupled barrel, so it is not consumable from this deployed app.
//     The schedule below is pure (numbers in → numbers out): its only
//     dependency is the cubic-bezier easing primitive in ./unit-bezier, which
//     is mathematically identical to CSS cubic-bezier(). No Remotion, no React,
//     no DOM — safe to run in an rAF loop. Keep in sync with upstream; do not
//     re-derive the math here.
//
// MECHANISM (load-bearing): a rank-staggered pulse grid. ONE scalar clip — a
// value key ladder with one cubic-bezier ease per segment (equal-value
// segments hold regardless of handles) — duplicated onto a fixed row×column
// grid, every duplicate playing the SAME clip time-shifted by cadence × rank.
// Rank comes from a per-cell table: a spatial scramble makes the firing order
// READ as "random", but the table is plain data — fully deterministic, no rng
// anywhere. The API owns only renderer-neutral schedule data; colors and
// realization stay with the consumer.

import { unitBezierY } from "./unit-bezier";

export interface PulseGridKey {
  /** clip-local frame (clip starts at t=0) */
  t: number;
  /** scalar clip value at this key */
  v: number;
}

export interface PulseGridParams {
  periodFrames: number;
  /** time shift per rank, frames */
  cadenceFrames: number;
  /** absolute loop frame where rank-0's clip starts */
  firstClipStartFrame: number;
  /** the ONE shared clip: scalar value key ladder */
  keys: PulseGridKey[];
  /** cubic-bezier ease per segment (keys.length − 1 entries; equal-value
   *  segments hold regardless of handles — the hold entry is inert) */
  segmentBeziers: [number, number, number, number][];
  /** grid x per column / y per row */
  gridColsX: number[];
  gridRowsY: number[];
  /** rankByCell[row][col] → firing rank */
  rankByCell: number[][];
}

export interface PulseGridSample {
  cx: number;
  cy: number;
  /** scalar clip value (the consuming realization decides what it drives) */
  r: number;
  rank: number;
  row: number;
  col: number;
}

/** Evaluate the shared clip at clip-local time T (rest outside the ladder). */
const clipValue = (params: PulseGridParams, T: number): number => {
  const keys = params.keys;
  if (T <= keys[0].t) return keys[0].v;
  const last = keys[keys.length - 1];
  if (T >= last.t) return last.v;
  let i = 0;
  while (keys[i + 1].t < T) i += 1;
  const k0 = keys[i];
  const k1 = keys[i + 1];
  if (k1.v === k0.v) return k0.v;
  const p = (T - k0.t) / (k1.t - k0.t);
  return k0.v + (k1.v - k0.v) * unitBezierY(...params.segmentBeziers[i], p);
};

export const createPulseGrid = (params: PulseGridParams) => {
  return (frame: number): PulseGridSample[] => {
    const local =
      ((frame % params.periodFrames) + params.periodFrames) %
      params.periodFrames;
    const dots: PulseGridSample[] = [];
    for (let row = 0; row < params.gridRowsY.length; row += 1) {
      for (let col = 0; col < params.gridColsX.length; col += 1) {
        const rank = params.rankByCell[row][col];
        const clipStart =
          params.firstClipStartFrame + params.cadenceFrames * rank;
        dots.push({
          cx: params.gridColsX[col],
          cy: params.gridRowsY[row],
          r: clipValue(params, local - clipStart),
          rank,
          row,
          col,
        });
      }
    }
    return dots;
  };
};
