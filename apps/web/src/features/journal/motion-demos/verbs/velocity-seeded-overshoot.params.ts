// Demo parameters for the velocity-seeded-overshoot motion study.
//
// These are the ORIGIN cell's measurement-bound constants (drawer cell #11
// "follow-through"/追従 — a flexible lowercase "i" swinging right→left: a thick
// round-capped stem plus a lagging dot that overshoots on arrival; 90-frame /
// 3s loop @ 30fps), copied from motion-grammar-lab
// studies/puttimw-motion-drawers/src/verbs/follow-through.ts. What the lab
// promoted to packages is the single CHANNEL alone (./velocity-seeded-
// overshoot: keyed move + exit-velocity-seeded settle, mirror+half-shift loop);
// the glyph assembly (three parallel channels with staggered starts driving the
// stem's two ends and the dot) is the drawer concept and lives study-side
// upstream — this file transcribes that assembly (createFollowThroughSchedule)
// verbatim on top of the vendored channel.
//
// Deliberate adaptations for this embedded demo (the allowed three only):
//   1. Recentring: the upstream design cell sits inside an asymmetric crop with
//      its motion centered near (156.95, 119.45); the demo stage is a 324
//      square, so a render-only shift moves that center to (162, 162) — the
//      same shift the lab's own finish deliverable applies. Every key value,
//      bezier handle, settle constant, stroke width, dot radius and segment
//      time stays exactly as measured; only the whole-glyph translation is new.
//   2. No raster-calibration artifact exists on this cell's schedule —
//      nothing to zero out.
//   3. Colours are NOT carried. Upstream binds a study-side red fill the
//      schedule never reads. The SVG demo paints stem + dot with the page's
//      substrate ink (currentColor), the finish demo with the API-finish light
//      palette. The two white eye-marks are a glyph DECORATION, not motion —
//      the schedule still returns them (provenance fidelity) but neither demo
//      draws them, so the motion reads in a single ink (lab finish decision).

import {
  velocitySeededOvershootValue,
  type VelocitySeededOvershootChannel,
} from "./velocity-seeded-overshoot";

export const VSO_VIEWBOX = 324;
export const VSO_PERIOD_FRAMES = 90;
export const VSO_FPS = 30; // design contract: 90f = 3s loop

/**
 * Static fallback frame for prefers-reduced-motion: just past the swing's
 * arrival, where the dot's overshoot and the stem's lean are both visible —
 * the mechanism's most legible single frame.
 */
export const VSO_POSTER_FRAME = 30;

// Render-only recentring (adaptation 1): upstream motion center → 324 square.
const CENTER_SHIFT_X = 162 - 156.95;
const CENTER_SHIFT_Y = 162 - 119.45;

// Three parallel keyed channels (upstream followThroughRig). Each channel's
// final key-segment EXIT VELOCITY seeds its own settle — no overshoot size is
// authored. Staggered starts toward a near-shared end key give the lag; the
// stemTop−stemBot difference gives the lean. All values measurement-bound.
const BOT: VelocitySeededOvershootChannel = {
  keys: [
    { t: 0.0, x: 211.0 },
    { t: 24.88, x: 102.9 },
  ],
  bezs: [[0.69, 0.04, 0.27, 0.97]],
  settleLambda: 0.08,
  settleOmega: 0.45,
};
const TOP: VelocitySeededOvershootChannel = {
  keys: [
    { t: 0.0, x: 211.0 },
    { t: 11.53, x: 176.5 },
    { t: 24.75, x: 102.9 },
  ],
  bezs: [
    [0.77, 0.12, 0.72, 0.0],
    [0.25, 0.79, 0.56, 0.75],
  ],
  settleLambda: 0.16,
  settleOmega: 0.4,
};
const DOT: VelocitySeededOvershootChannel = {
  keys: [
    { t: 10.46, x: 211.0 },
    { t: 25.0, x: 102.9 },
  ],
  bezs: [[0.55, 0.03, 0.8, 0.71]],
  settleLambda: 0.27,
  settleOmega: 0.46,
};

// Footprint-calibrated geometry (Phase-0 curated; upstream followThroughGeometry
// minus the fill colour — adaptation 3). The stem is a round-capped stroke
// between the two channel-driven endpoints; the dot is a rigid circle.
const STEM_WIDTH = 28;
const STEM_CAP_TOP_Y = 121.5;
const STEM_CAP_BOT_Y = 170;
const DOT_CY = 77.4;
const DOT_RADIUS = 22.5;
const EYE_DX = 5;
const EYE_DY = 9;
const EYE_WIDTH = 2;
const EYE_HEIGHT = 8;

export interface VsoEyeMark {
  cx: number;
  cy: number;
  width: number;
  height: number;
}

export interface VsoGlyphState {
  /** round-capped stem: a thick line between these two points */
  stemTop: { x: number; y: number };
  stemBot: { x: number; y: number };
  stemWidth: number;
  /** the lagging, overshooting dot (the tittle of the "i") */
  dot: { cx: number; cy: number; r: number };
  /** glyph decoration — returned for provenance, NOT drawn by either demo */
  eyeMarks: [VsoEyeMark, VsoEyeMark];
}

/**
 * The drawer assembly, transcribed verbatim from the study schedule
 * (createFollowThroughSchedule): three parallel channels drive the stem's two
 * ends and the dot's center along x; the y values are geometry constants.
 * Proven equal to the study schedule over all 90 frames, 13 fields, Object.is
 * (centers aligned) — see the article's verification script.
 */
export const vsoGlyphSchedule = (frame: number): VsoGlyphState => {
  // Design-space coordinates first (computed identically to the upstream
  // createFollowThroughSchedule), then a single render-only shift added LAST
  // per field — so each field equals the study schedule's value + the same
  // shift, preserving Object.is parity (FP add is not associative).
  const topX = velocitySeededOvershootValue(frame, TOP, VSO_PERIOD_FRAMES);
  const botX = velocitySeededOvershootValue(frame, BOT, VSO_PERIOD_FRAMES);
  const dotCx = velocitySeededOvershootValue(frame, DOT, VSO_PERIOD_FRAMES);
  const eyeCy = DOT_CY + EYE_DY;
  return {
    stemTop: { x: topX + CENTER_SHIFT_X, y: STEM_CAP_TOP_Y + CENTER_SHIFT_Y },
    stemBot: { x: botX + CENTER_SHIFT_X, y: STEM_CAP_BOT_Y + CENTER_SHIFT_Y },
    stemWidth: STEM_WIDTH,
    dot: { cx: dotCx + CENTER_SHIFT_X, cy: DOT_CY + CENTER_SHIFT_Y, r: DOT_RADIUS },
    eyeMarks: [
      { cx: dotCx - EYE_DX + CENTER_SHIFT_X, cy: eyeCy + CENTER_SHIFT_Y, width: EYE_WIDTH, height: EYE_HEIGHT },
      { cx: dotCx + EYE_DX + CENTER_SHIFT_X, cy: eyeCy + CENTER_SHIFT_Y, width: EYE_WIDTH, height: EYE_HEIGHT },
    ],
  };
};
