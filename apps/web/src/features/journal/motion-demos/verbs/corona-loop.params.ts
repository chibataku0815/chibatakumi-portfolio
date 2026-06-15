// Measurement-bound constants for the corona-loop demo.
//
//   scatter spec: vendored from Motif PARAMETRIC_CORONA_DEFAULTS
//     (forestone/motion-effect-authoring). The one adaptation is
//     directionStrength: the published still uses a gentle lobe; for MOTION the
//     lobe is raised so the orbit reads at thumbnail size (user-chosen contrast).
//   orbit: the confirmed motion brief (forestone/motion-grammar-lab,
//     scripts/render-corona-loop.ts) — one turn per loop, lobe lingering at the
//     baseAngle (upper-right) via cosine rate modulation.
//   palette: the corona's own gold-on-dark register (this study is not a drawer,
//     so it does not use the shared light finish palette).
import type { CoronaSpec, CoronaOrbitParams } from "./corona-loop";

export const CORONA_SPEC: CoronaSpec = {
  dotCount: 2800,
  baseSize: 1.5,
  voidRadius: 0.3,
  spread: 0.45,
  phase: 0,
  brightLevel: 0.95,
  dimLevel: 0.12,
  brightMid: 0.3,
  directionStrength: 0.5,
  seed: 12345,
};

export const CORONA_ORBIT: CoronaOrbitParams = {
  periodFrames: 90,
  baseAngleDeg: 135,
  rateModDepth: 0.4,
};

export const CORONA_FPS = 30;
export const CORONA_PERIOD_FRAMES = 90;
/** reduced-motion still: the loop midpoint, where the lobe lingers upper-right. */
export const CORONA_POSTER_FRAME = 45;

export const CORONA_PALETTE = {
  background: "#1b1b21",
  dim: "#9a7636",
  bright: "#f2e8cf",
} as const;
