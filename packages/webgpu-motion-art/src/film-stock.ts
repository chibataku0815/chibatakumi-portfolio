// Canonical film stock baselines — derived from
// motion-grid-guided-webgpu/docs/guides/2026-04-17-audio-reactive-mapping.md
//
// Philosophy: "sing, don't twitch". Static baseline absorbs silence without
// jittering; audio-reactive wires apply coefficients ON TOP of these values.

export const FILM_STOCK_CANON = {
  grain: { intensity: 0.07, size: 0.64, radialMix: 0.22 },
  chromaticAberration: { amount: 0.0014 },
  bloom: { threshold: 0.8, intensity: 0.14, warmth: 0.05 },
  vignette: { strength: 0.22, warmShift: 0.01 },
  tonemap: { shadowLift: 0.002, compression: 0.04 },
} as const;

// NOTE: CANON_FILM_AUDIO_WIRES was removed in Phase 3 Commit 8. Audio wiring
// is now declared per-app via defineAudioWiring<P>() from webgpu-motion-audio
// (see each app's src/audio/wiring.ts). The coefficient values previously
// exposed here live alongside their wires in those files.

export type FilmStockBaseline = typeof FILM_STOCK_CANON;
