// Dot audio → scene/film wiring. 1 input → 1 param canon, declared via
// defineAudioWiring<DotParam>(). Replaces the legacy multi-input mappings
// from createPresentationModulation (previous form: e.g.
// `bloomIntensity = 0.3 + (bass*1.0 + kickPulse*1.5) * bloomMul`).
//
// Canon-化 strategy (plan §C.6, Commit 6): for each legacy multi-input
// pair, keep the higher-weight input and drop the lower. The visual result
// is slightly less reactive than the legacy but aesthetically simpler —
// each parameter maps to a single perceptual intent ("sing, don't twitch").
//
// Baseline is 0 for every wire: this module returns pure audio *delta*s.
// main.ts adds the static baseline (FILM_STOCK_CANON / tuning constants)
// and applies per-scene galleryMix damping post-resolve. This keeps the
// galleryMix math co-located with the consumer, since damping varies with
// panel count and the wiring itself is static.

import { defineAudioWiring } from "webgpu-motion-audio";

export type DotParam =
  | "scene.threshold"
  | "scene.softness"
  | "film.bloom.intensity"
  | "film.bloom.threshold"
  | "film.grain.intensity"
  | "film.chroma.amount"
  | "film.vignette.strength";

export const DOT_WIRING = defineAudioWiring<DotParam>()([
  {
    param: "scene.threshold",
    input: "bass",
    coefficient: -0.70,
    baseline: 0,
    intent: "低域でメタボール閾値が下がり、形が膨らむ（legacy bass 0.70 > kick 0.20）",
  },
  {
    param: "scene.softness",
    input: "energy",
    coefficient: 0.08,
    baseline: 0,
    intent: "ラウドネスで境界が柔らかく滲む",
  },
  {
    param: "film.bloom.intensity",
    input: "bassOnset",
    coefficient: 1.5,
    baseline: 0,
    intent: "キックで光量がパルス的に膨張する（legacy kick 1.5 > bass 1.0）",
  },
  {
    param: "film.bloom.threshold",
    input: "bass",
    coefficient: -0.4,
    baseline: 0,
    intent: "低域で発光閾値が下がり、光が滲み始める（legacy bass 0.4 > kick 0.3）",
  },
  {
    param: "film.grain.intensity",
    input: "trebleOnset",
    coefficient: 0.4,
    baseline: 0,
    intent: "ハットでフィルムの粒子感が瞬間的に強まる（legacy hat 0.4 > mid 0.3）",
  },
  {
    param: "film.chroma.amount",
    input: "midOnset",
    coefficient: 0.015,
    baseline: 0,
    intent: "スネアで色収差が瞬間的に増える（legacy snare 0.015 > treble 0.008）",
  },
  {
    param: "film.vignette.strength",
    input: "energy",
    coefficient: -0.6,
    baseline: 0,
    intent: "ラウドネスで周辺減光が緩和される（legacy energy 0.6 > onset 0.3）",
  },
] as const);

export const DOT_AUDIO_DELTA_BUFFER: Record<DotParam, number> = {
  "scene.threshold": 0,
  "scene.softness": 0,
  "film.bloom.intensity": 0,
  "film.bloom.threshold": 0,
  "film.grain.intensity": 0,
  "film.chroma.amount": 0,
  "film.vignette.strength": 0,
};
