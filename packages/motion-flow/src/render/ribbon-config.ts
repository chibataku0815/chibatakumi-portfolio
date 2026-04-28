// ============================================================
// motion-flowline-webgpu — Phase 8 ribbon render config
// Plan:    .claude/tasks/active/2026-04-18-motion-flowline-webgpu-phase8-plan.md §2 Stream C
// Handoff: docs/guides/2026-04-18-motion-flowline-webgpu-phase8-onward-complete-handoff.md §9.5
// ============================================================

/**
 * Ribbon render config.
 *
 * All values are tuning knobs for the vertex-shader expansion ribbon. Scene
 * presets (see ../scene/*) override a subset via Partial<RibbonConfig>.
 *
 * Tuning bounds (CD guidance — do not exceed without visual review):
 *   maxWidth     ∈ [0.002, 0.008]   — below 0.002 invisible, above 0.008 noisy
 *   minWidth     ∈ [0.0, maxWidth]  — 0.0 yields perfect tip tapering
 *   widthSpeedK  ∈ [0.0, 4.0]       — above 4.0 pulses violently
 *   curvatureK   ∈ [0.0, 6.0]       — higher = more alpha damp on sharp turns
 *   widthScale   ∈ [0.5, 2.0]       — preset multiplier only
 *   alphaScale   ∈ [0.5, 1.5]       — preset multiplier only
 */
export type RibbonConfig = {
  /** Widest ribbon half-width (normalized to [0,1] canvas space). */
  maxWidth: number;
  /** Thinnest ribbon half-width. Reached near end-of-life. */
  minWidth: number;
  /** Speed multiplier for width. Width = ... * (0.5 + speed * widthSpeedK). */
  widthSpeedK: number;
  /** Curvature damp coefficient for alpha on sharp turns. */
  curvatureK: number;
  /** Scene preset multiplier applied to final width. Default 1.0. */
  widthScale: number;
  /** Scene preset multiplier applied to final alpha. Default 1.0. */
  alphaScale: number;
};

/**
 * Phase 8 default values. Chosen so the Laminar scene reads as a calm field of
 * long arcing streamlines with hair-thin base width and occasional swelling
 * driven by agent speed.
 */
export const RIBBON_DEFAULT_CONFIG: RibbonConfig = {
  maxWidth:    0.004,
  minWidth:    0.0005,
  widthSpeedK: 2.0,
  curvatureK:  3.0,
  widthScale:  1.0,
  alphaScale:  1.0,
};
