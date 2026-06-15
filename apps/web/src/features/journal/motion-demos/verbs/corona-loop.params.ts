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
import type { FinishStandardParams } from "@bridges/webgpu-finish";
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

// Finish params matched to the lab mp4 (motion-grammar-lab scripts/render-corona-loop.ts),
// NOT the drawer light-palette standard. Two corrections over the default:
//   CA — fringing 0.5 and a 0.4%-of-frame max shift (default light standard is ~4× stronger);
//   grain ramp — the standard's shader weights grain on the DARK side (light palette); this is
//     a dark-bg corona, so the knot values are swapped to weight grain on the BRIGHT corona.
//     The inverted-ramp shader (w = bgW + (objW−bgW)·(1−smoothstep)) then reduces to the lab's
//     w = 0.18 + 0.47·smoothstep(0.3, 0.85, luma) — identical, just relabeled.
export const CORONA_FINISH_PARAMS: FinishStandardParams = {
  grainStrength: 0.9,
  grainSeed: 12345,
  grainAlphaGain: 0.35,
  grainGridHeight: 1000,
  objGrainW: 0.18, // grain weight on the dark side (lab BG weight)
  bgGrainW: 0.65, // grain weight on the bright corona (lab OBJ weight)
  objLo: 0.3,
  objHi: 0.85,
  caFringing: 0.5,
  caMaxShiftPxRef: 4.32, // 0.4% of a 1080 frame (lab: 6.4px at a 1600 finish)
  referenceSize: 1080,
} as const;
