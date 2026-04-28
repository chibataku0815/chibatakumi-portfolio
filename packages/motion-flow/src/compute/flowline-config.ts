/**
 * Flowline agent/trail simulation config.
 *
 * N_TRAIL is pinned to 64 at the type level because the compute shader uses
 * bitwise ring indexing `(headIdx + 1) & (N_TRAIL - 1)`, which requires a
 * power-of-two. Changing it requires a matching WGSL override constant update.
 *
 * Presets: small=4000 / medium=8000 / large=16000 agents. Trail buffer is
 *   nAgents * N_TRAIL * 16 B → small=4 MiB, medium=8 MiB, large=16 MiB.
 * Launch export (Phase 12) can go to 16000 * 128 = 32 MiB on desktop GPUs.
 *
 * Phase 9 extension: adds required attractor{X,Y,Strength} + vorticity fields.
 * A scene disables the attractor by setting both attractorStrength=0 and
 * vorticity=0; the compute shader short-circuits the whole block in that case.
 */
export type FlowlineConfig = {
  /** Number of agents. Recommended presets: 4000 | 8000 | 16000. */
  nAgents: number;
  /** Trail length per agent. Pinned to 64 (power-of-two). */
  nTrail: 64;
  /** Curl noise advection strength. */
  flowForce: number;
  /** Spatial frequency of curl noise field. */
  noiseScale: number;
  /** Temporal drift speed of the noise field. */
  noiseSpeed: number;
  /** Per-frame velocity damping (0..1, higher = more flowy). */
  drag: number;
  /** Minimum agent lifetime in seconds. */
  lifetimeMin: number;
  /** Maximum agent lifetime in seconds (stratified). */
  lifetimeMax: number;
  /**
   * Fraction of agents colored as ink (0=paper dominant, 1=ink dominant).
   * CD guidance: 0.25 — paper-majority so the ensemble reads as a calm bed
   * with occasional ink strokes, matching the Moving Postcard palette balance.
   */
  colorMixBalance: number;
  /** Attractor target X — normalized [0, 1]. Ignored when strength=0. */
  attractorX: number;
  /** Attractor target Y — normalized [0, 1]. Ignored when strength=0. */
  attractorY: number;
  /**
   * Radial pull coefficient. 0 disables the attractor term; typical
   * AttractorKnot range [0.3, 0.8].
   */
  attractorStrength: number;
  /**
   * Tangential vorticity around the attractor. 0 disables the swirl; sign
   * flips swirl direction. Typical AttractorKnot range [0.8, 1.5].
   */
  vorticity: number;
  /**
   * Phase 11 — Comb/Flow weight. 0 means non-Comb scenes: the SDF branch in
   * the update kernel short-circuits for a zero-cost no-op. Comb/Flow scene
   * ramps this up so agents within the glyph band switch from curl noise to
   * tangent-to-iso-contour motion.
   */
  combStrength: number;
  /**
   * Phase 11 — Smoothstep band (world units) across which the SDF influence
   * falls from 1 to 0. 0.08 (8 % of unit-square) gives a readable edge
   * ribbon without pinning agents exactly on the stroke.
   */
  sdfEdgeSoft: number;
  /**
   * Phase 14 — Parametric shape attractor (hypotrochoid / epitrochoid / lissajous).
   * Outer radius of the rolling circle in unit-square coords. Curve is
   * centred at (0.5, 0.5). Unused when shapeStrength == 0.
   */
  shapeR: number;
  /** Phase 14 — Inner rolling-circle radius. (R - r) is the baseline petal span. */
  shapeSmall: number;
  /** Phase 14 — Pen offset from the inner centre. Controls petal depth. */
  shapeD: number;
  /**
   * Phase 14 — Angular scrub speed (rad/s) added to per-agent phase seed.
   * Produces the "curve revolves" feel without mutating agent struct.
   */
  phaseSpeed: number;
  /**
   * Phase 14 — Spring coefficient pulling agent toward its parametric target.
   * 0 disables the whole shape block (zero-cost early-out for organic scenes).
   * Typical Spirograph peak: 6–10.
   */
  shapeStrength: number;
  /**
   * Phase 14 — Curve family selector. 0=off, 1=hypotrochoid, 2=epitrochoid,
   * 3=lissajous. MVP implements only 1; reserved slot for extension phase.
   */
  shapeMode: number;
};

export const FLOWLINE_PRESET_SMALL: FlowlineConfig = {
  nAgents: 4000,
  nTrail: 64,
  flowForce: 0.35,
  noiseScale: 2.8, // TODO Phase 8: revisit once ribbon render is visible
  noiseSpeed: 0.12,
  drag: 0.92,
  lifetimeMin: 3.0,
  lifetimeMax: 12.0,
  colorMixBalance: 0.25,
  attractorX:        0.5,
  attractorY:        0.5,
  attractorStrength: 0.0,
  vorticity:         0.0,
  combStrength:      0.0,
  sdfEdgeSoft:       0.08,
  shapeR:            0.35,
  shapeSmall:        0.10,
  shapeD:            0.05,
  phaseSpeed:        0.30,
  shapeStrength:     0.0,
  shapeMode:         1.0,
};

export const FLOWLINE_PRESET_MEDIUM: FlowlineConfig = {
  ...FLOWLINE_PRESET_SMALL,
  nAgents: 8000,
};

export const FLOWLINE_PRESET_LARGE: FlowlineConfig = {
  ...FLOWLINE_PRESET_SMALL,
  nAgents: 16000,
};

/**
 * Default for Phase 7–11 development. Launch export (Phase 12) uses LARGE.
 *
 * Phase 8 post-M2 tune (2026-04-18): switched from MEDIUM (8000) to SMALL
 * (4000) — 8000 read as "乱れた織り込み" under Laminar lighting. SMALL gives
 * Laminar the calm bed it wants; Phase 9 Turbulent/AttractorKnot can revisit
 * per-scene nAgents if chaos needs higher density.
 */
export const FLOWLINE_DEFAULT_CONFIG: FlowlineConfig = FLOWLINE_PRESET_SMALL;
