// Demo parameters for the master-rotation-echo motion study.
//
// These are the ORIGIN cell's measurement-bound constants (drawer cell #9
// "afterimage"/残像 — an antipodal dot pair on an orbit with a time-shifted
// echo stack, 90-frame / 3s loop @ 30fps), copied from motion-grammar-lab
// studies/puttimw-motion-drawers/src/verbs/afterimage.ts (afterimageParams).
// Deliberate adaptations for this embedded demo (the allowed three only):
//   1. The orbit center is recentred on the demo viewBox center — upstream
//      sat at (169.73, 129.13) in the reference crop (the cell reserves a
//      label band at the bottom). Only the origin moves; orbit radius 72.5,
//      dot radius 16.5 and the rest angles stay exactly as measured.
//   2. No raster-calibration artifact existed on this cell (the upstream
//      realization draws dotRadius 16.5 directly, with no AA compensation) —
//      nothing to zero out.
//   3. Colours are NOT carried. Upstream pairs the schedule with a
//      study-local red fill the schedule itself never reads; the package
//      params are schedule-only. The SVG demo paints with the site's
//      substrate ink (currentColor), the finish demo with the API-finish
//      light palette.
// The rotation (2 keys, one bezier, 79-frame sweep + rest hold) and the echo
// stack (9 copies × 1.65 frames × 0.77 opacity) — the motion knowledge
// itself — are kept faithful.

import { createMasterRotationEchoSchedule } from "./master-rotation-echo";
import type { MasterRotationEchoParams } from "./master-rotation-echo";

export const MASTER_ROTATION_ECHO_VIEWBOX = 240;
export const MASTER_ROTATION_ECHO_PERIOD_FRAMES = 90;
export const MASTER_ROTATION_ECHO_FPS = 30; // design contract: 90f = 3s loop

/**
 * The most legible single frame — mid-sweep inside the fast window, where the
 * copies have pulled apart into the discrete flip-book ring. Used as the
 * static fallback for prefers-reduced-motion.
 */
export const MASTER_ROTATION_ECHO_FAST_FRAME = 44;

export const masterRotationEchoParams: MasterRotationEchoParams = {
  periodFrames: 90,
  sweepFrames: 79, // rotation keys end at frame 79; frames 79–90 are rest
  bezier: [0.82, 0.003, 0.163, 0.996],
  copies: 9,
  delayFrames: 1.65, // = 0.055s at 30fps
  decay: 0.77,
  shutterFrames: 0, // the origin cell ships zero sub-frame blur
  // upstream center (169.73, 129.13) → recentred to the 240-viewBox center
  // (adaptation 1 above)
  center: [120, 120],
  orbitRadius: 72.5,
  dotRadius: 16.5,
  restAnglesDeg: [-90, 90],
};

export const masterRotationEchoSchedule = createMasterRotationEchoSchedule(
  masterRotationEchoParams,
);
