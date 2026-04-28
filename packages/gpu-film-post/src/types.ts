// ── Film Post-Processing Types ──────────────────────────────────────

export interface FilmPostConfig {
  grain?: {
    intensity?: number; // 0..1 (default: 0.10)
    size?: number; // 0..1 (default: 0.3)
    radialMix?: number; // 0..1 (default: 0.6) — 0=uniform, 1=full edge weighting
  };
  chromaticAberration?: {
    amount?: number; // 0..0.05 (default: 0.003)
  };
  bloom?: {
    threshold?: number; // 0..1 (default: 0.65)
    intensity?: number; // 0..1 (default: 0.45)
    warmth?: number; // 0..1 (default: 0.25)
  };
  vignette?: {
    strength?: number; // 0..1 (default: 0.85)
    warmShift?: number; // 0..1 (default: 0.3)
  };
  lightLeak?: {
    intensity?: number; // 0..1 (default: 0.25)
  };
  tonemap?: {
    shadowLift?: number; // 0..0.05 (default: 0.012)
    compression?: number; // 0..1 (default: 0.35)
  };
}

export interface FilmPostUniforms {
  time: number;
  pulse?: number; // 0..1, transient intensity boost during transitions
}

export interface FilmPostPipeline {
  render(
    encoder: GPUCommandEncoder,
    sceneTextureView: GPUTextureView,
    outputView: GPUTextureView,
    uniforms: FilmPostUniforms,
  ): void;
  resize(width: number, height: number): void;
  updateConfig(config: Partial<FilmPostConfig>): void;
  destroy(): void;
}

// ── Defaults ────────────────────────────────────────────────────────

export const DEFAULT_CONFIG = {
  grainIntensity: 0.10,
  grainSize: 0.3,
  grainRadialMix: 0.6,
  caAmount: 0.003,
  bloomThreshold: 0.65,
  bloomIntensity: 0.45,
  bloomWarmth: 0.25,
  vignetteStrength: 0.85,
  vignetteWarmShift: 0.3,
  leakIntensity: 0.25,
  shadowLift: 0.012,
  tonemapCompression: 0.35,
} as const;
